import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { requireAuth } from '../middleware/auth'
import { supabaseAdmin } from '../lib/supabase'

const router = Router()

const uploadDir = path.join(__dirname, '..', '..', 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
})

const imageFileFilter = (_req: any, file: any, cb: any) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
  if (allowed.includes(file.mimetype) || file.originalname.match(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i)) cb(null, true)
  else cb(new Error('invalid_image_type'))
}

const docFileFilter = (_req: any, file: any, cb: any) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png']
  if (allowed.includes(file.mimetype)) cb(null, true)
  else cb(new Error('invalid_document_type'))
}

const videoFileFilter = (_req: any, file: any, cb: any) => {
  const allowed = ['video/mp4', 'video/webm']
  if (allowed.includes(file.mimetype)) cb(null, true)
  else cb(new Error('invalid_video_type'))
}

const uploadImageMw = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: imageFileFilter })
const uploadDocMw = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: docFileFilter })
const uploadVideoMw = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 }, fileFilter: videoFileFilter })

router.post('/documents', requireAuth(['user', 'vet', 'admin']), uploadDocMw.single('file'), async (req, res) => {
  try {
    const file = (req as any).file
    const userId = (req as any).user.id

    if (!userId || !file) return res.status(400).json({ error: 'invalid' })

    // Save file metadata to Supabase
    const { data: newFile, error } = await supabaseAdmin
      .from('files')
      .insert({
        user_id: userId,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: 'save_failed', message: error.message })

    res.json({ file: newFile, url: `/uploads/${file.filename}` })
  } catch (error) {
    console.error('Error uploading document:', error)
    res.status(500).json({ error: 'server_error' })
  }
})

router.post('/images', requireAuth(['user', 'vet', 'petstore', 'admin']), (req, res, next) => {
  uploadImageMw.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err)
      if (err.message === 'invalid_image_type') {
        return res.status(400).json({ error: 'invalid_image_type', message: 'Only JPEG, PNG, and WebP images are allowed' })
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'file_too_large', message: 'File size must be less than 10MB' })
      }
      return res.status(400).json({ error: 'upload_failed', message: err.message })
    }
    next()
  })
}, async (req, res) => {
  const file = (req as any).file
  if (!file) {
    return res.status(400).json({
      error: 'no_file',
      message: 'No file received.'
    })
  }

  res.json({ filename: file.filename, path: file.path, url: `/uploads/${file.filename}` })
})

router.post('/videos', requireAuth(['vet']), uploadVideoMw.single('file'), async (req, res) => {
  try {
    const file = (req as any).file
    const userId = (req as any).user.id

    if (!file) return res.status(400).json({ error: 'invalid' })

    // Save file metadata to Supabase
    const { data: newFile, error } = await supabaseAdmin
      .from('files')
      .insert({
        user_id: userId,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: 'save_failed', message: error.message })

    res.json({ filename: file.filename, path: file.path, url: `/uploads/${file.filename}`, file: newFile })
  } catch (error) {
    console.error('Error uploading video:', error)
    res.status(500).json({ error: 'server_error' })
  }
})

// Get user's uploaded files
router.get('/my-files', requireAuth(['user', 'vet', 'petstore', 'admin']), async (req, res) => {
  try {
    const userId = (req as any).user.id

    const { data: files, error } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: 'fetch_failed', message: error.message })
    res.json({ files: files || [] })
  } catch (error) {
    console.error('Error fetching files:', error)
    res.status(500).json({ error: 'failed_to_fetch_files' })
  }
})

export default router

