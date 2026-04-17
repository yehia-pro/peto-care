import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { supabaseAdmin } from '../lib/supabase'

const router = Router()

const mapRow = (r: any) => ({
  _id: r.id,
  id: r.id,
  name: r.name,
  description: r.description || '',
  symptoms: Array.isArray(r.symptoms) ? r.symptoms : [],
  imageUrl: r.image_url || '',
  isRare: Boolean(r.is_rare)
})

router.get('/', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin.from('diseases').select('*').order('created_at', { ascending: false })
    if (error) throw error
    res.json((data || []).map(mapRow))
  } catch (e) {
    console.error('Error fetching diseases:', e)
    res.status(500).json({ error: 'server_error', message: 'حدث خطأ أثناء جلب الأمراض' })
  }
})

router.post('/', requireAuth(['admin']), async (req: Request, res: Response) => {
  try {
    const { name, description, symptoms, imageUrl, isRare } = req.body
    const { data, error } = await supabaseAdmin
      .from('diseases')
      .insert({
        name,
        description: description || '',
        symptoms: Array.isArray(symptoms) ? symptoms : [],
        image_url: imageUrl || '',
        is_rare: Boolean(isRare)
      })
      .select('*')
      .single()
    if (error) throw error
    res.status(201).json(mapRow(data))
  } catch (e) {
    console.error('Error creating disease:', e)
    res.status(500).json({ error: 'server_error', message: 'حدث خطأ أثناء إضافة المرض' })
  }
})

router.put('/:id', requireAuth(['admin']), async (req: Request, res: Response) => {
  try {
    const { name, description, symptoms, imageUrl, isRare } = req.body
    const { data, error } = await supabaseAdmin
      .from('diseases')
      .update({
        name,
        description: description || '',
        symptoms: Array.isArray(symptoms) ? symptoms : [],
        image_url: imageUrl || '',
        is_rare: Boolean(isRare),
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select('*')
      .maybeSingle()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'not_found', message: 'المرض غير موجود' })
    res.json(mapRow(data))
  } catch (e) {
    console.error('Error updating disease:', e)
    res.status(500).json({ error: 'server_error', message: 'حدث خطأ أثناء تحديث بيانات المرض' })
  }
})

router.delete('/:id', requireAuth(['admin']), async (req: Request, res: Response) => {
  try {
    const { error } = await supabaseAdmin.from('diseases').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ message: 'تم الحذف بنجاح' })
  } catch (e) {
    console.error('Error deleting disease:', e)
    res.status(500).json({ error: 'server_error', message: 'حدث خطأ أثناء حذف المرض' })
  }
})

export default router
