import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { supabaseAdmin } from '../lib/supabase'

const router = Router()

const mapRow = (r: any) => ({
  _id: r.id,
  id: r.id,
  title: r.title,
  description: r.description || '',
  imageUrl: r.image_url || '',
  careTips: Array.isArray(r.care_tips) ? r.care_tips : []
})

router.get('/', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin.from('pet_guides').select('*').order('created_at', { ascending: false })
    if (error) throw error
    res.json((data || []).map(mapRow))
  } catch (e) {
    console.error('Error fetching pet guides:', e)
    res.status(500).json({ error: 'server_error', message: 'حدث خطأ أثناء جلب دليل الحيوانات' })
  }
})

router.post('/', requireAuth(['admin']), async (req: Request, res: Response) => {
  try {
    const { title, description, imageUrl, careTips } = req.body
    const { data, error } = await supabaseAdmin
      .from('pet_guides')
      .insert({
        title,
        description: description || '',
        image_url: imageUrl || '',
        care_tips: Array.isArray(careTips) ? careTips : []
      })
      .select('*')
      .single()
    if (error) throw error
    res.status(201).json(mapRow(data))
  } catch (e) {
    console.error('Error creating pet guide:', e)
    res.status(500).json({ error: 'server_error', message: 'حدث خطأ أثناء إضافة الحيوان' })
  }
})

router.put('/:id', requireAuth(['admin']), async (req: Request, res: Response) => {
  try {
    const { title, description, imageUrl, careTips } = req.body
    const { data, error } = await supabaseAdmin
      .from('pet_guides')
      .update({
        title,
        description: description || '',
        image_url: imageUrl || '',
        care_tips: Array.isArray(careTips) ? careTips : [],
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select('*')
      .maybeSingle()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'not_found', message: 'الحيوان غير موجود' })
    res.json(mapRow(data))
  } catch (e) {
    console.error('Error updating pet guide:', e)
    res.status(500).json({ error: 'server_error', message: 'حدث خطأ أثناء تحديث بيانات الحيوان' })
  }
})

router.delete('/:id', requireAuth(['admin']), async (req: Request, res: Response) => {
  try {
    const { error } = await supabaseAdmin.from('pet_guides').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ message: 'تم الحذف بنجاح' })
  } catch (e) {
    console.error('Error deleting pet guide:', e)
    res.status(500).json({ error: 'server_error', message: 'حدث خطأ أثناء حذف الحيوان' })
  }
})

export default router
