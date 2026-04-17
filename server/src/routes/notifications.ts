import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate'
import { requireAuth } from '../middleware/auth'
import { sendEmail } from '../services/email'
import { supabaseAdmin } from '../lib/supabase'

const router = Router()

const adminRecipients = (process.env.ADMIN_NOTIFICATION_EMAILS || 'yaheaeldesoky0@gmail.com,aymanyoussef219@gmail.com')
  .split(',')
  .map((email) => email.trim())
  .filter(Boolean)

const applicationSchema = z.object({
  body: z.object({
    type: z.enum(['vet', 'petstore']),
    data: z.record(z.any())
  })
})

const directEmailSchema = z.object({
  body: z.object({
    to: z.union([z.string().email(), z.array(z.string().email())]),
    subject: z.string(),
    html: z.string().optional(),
    message: z.string().optional()
  })
})

const notifyAdministrators = async (subject: string, html: string) => {
  await Promise.all(
    adminRecipients.map((recipient) =>
      sendEmail(recipient, subject, html).catch((error) => {
        console.error(`Failed to send notification email to ${recipient}`, error)
      })
    )
  )
}

const buildApplicationHtml = (type: 'vet' | 'petstore', data: Record<string, any>) => {
  const rows = Object.entries(data)
    .map(([key, value]) => {
      const displayValue =
        value === null || value === undefined
          ? '-'
          : typeof value === 'object'
            ? JSON.stringify(value, null, 2)
            : String(value)
      return `<tr>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;text-transform:capitalize;">${key}</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;">${displayValue}</td>
      </tr>`
    })
    .join('')

  const title = type === 'vet' ? 'طلب انضمام لطبيب بيطري جديد' : 'طلب تسجيل متجر جديد'

  const approveLink = data.approveLink
    ? `<p style="margin-top:16px;"><a href="${data.approveLink}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">الموافقة على الطلب</a></p>`
    : ''
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;">
      <h2 style="color:#111827;">${title}</h2>
      <p>تم تقديم طلب جديد من خلال الموقع. يمكن مراجعة التفاصيل أدناه والموافقة على الطلب من لوحة التحكم.</p>
      <table style="border-collapse:collapse;border:1px solid #e5e7eb;width:100%;margin-top:16px;">
        <thead>
          <tr>
            <th style="text-align:right;padding:10px;background:#f3f4f6;border:1px solid #e5e7eb;">الحقل</th>
            <th style="text-align:right;padding:10px;background:#f3f4f6;border:1px solid #e5e7eb;">القيمة</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      ${approveLink}
    </div>
  `
}

const mapNotification = (row: any) => ({
  _id: row.id,
  id: row.id,
  userId: row.user_id,
  title: row.title,
  message: row.message,
  type: row.type,
  link: row.link,
  isRead: row.is_read,
  read: row.is_read,
  createdAt: row.created_at,
  metadata: row.metadata || {}
})

router.post('/application', validate(applicationSchema), async (req, res) => {
  const { type, data } = req.body
  const html = buildApplicationHtml(type, data)
  await notifyAdministrators(type === 'vet' ? 'طلب انضمام طبيب بيطري' : 'طلب تسجيل متجر حيوانات أليفة', html)
  res.json({ success: true })
})

router.post('/send-email', requireAuth(['admin', 'vet', 'user', 'petstore']), validate(directEmailSchema), async (req, res) => {
  try {
    const recipients = Array.isArray(req.body.to) ? req.body.to : [req.body.to]
    const htmlContent = req.body.html || `<pre>${req.body.message || ''}</pre>`
    await Promise.all(recipients.map((recipient: string) => sendEmail(recipient, req.body.subject, htmlContent)))
    res.json({ success: true })
  } catch (error) {
    console.error('Error sending email:', error)
    res.status(500).json({ error: 'Failed to send email' })
  }
})

router.post('/register-token', requireAuth(['user', 'vet', 'admin', 'petstore']), async (req, res) => {
  const { token } = req.body
  if (!token) return res.status(400).json({ error: 'missing_token' })

  const userId = (req as any).user.id
  const { data: profile, error: readErr } = await supabaseAdmin.from('profiles').select('metadata').eq('id', userId).maybeSingle()
  if (readErr) return res.status(400).json({ error: 'read_failed', message: readErr.message })

  const metadata = { ...(profile?.metadata || {}), fcm_token: token }
  const { error } = await supabaseAdmin.from('profiles').update({ metadata, updated_at: new Date().toISOString() }).eq('id', userId)
  if (error) return res.status(400).json({ error: 'update_failed', message: error.message })

  res.json({ success: true })
})

router.get('/', requireAuth(['user', 'vet', 'petstore', 'admin']), async (req, res) => {
  try {
    const userId = (req as any).user.id
    const { data: rows, error } = await supabaseAdmin
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      if (error.code === '42P01' || error.message?.includes('user_notifications')) {
        return res.json({ notifications: [], unreadCount: 0 })
      }
      throw error
    }

    const notifications = (rows || []).map(mapNotification)
    const unreadCount = notifications.filter((n) => !n.isRead).length
    res.json({ notifications, unreadCount })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    res.status(500).json({ error: 'server_error' })
  }
})

const markReadHandler = async (req: any, res: any) => {
  try {
    const userId = (req as any).user.id
    const { data, error } = await supabaseAdmin
      .from('user_notifications')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .select('*')
      .maybeSingle()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'not_found' })
    res.json({ success: true, notification: mapNotification(data) })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    res.status(500).json({ error: 'server_error' })
  }
}

router.put('/:id/read', requireAuth(['user', 'vet', 'petstore', 'admin']), markReadHandler)
router.patch('/:id/read', requireAuth(['user', 'vet', 'petstore', 'admin']), markReadHandler)

router.patch('/read-all', requireAuth(['user', 'vet', 'petstore', 'admin']), async (req, res) => {
  try {
    const userId = (req as any).user.id
    const { error } = await supabaseAdmin
      .from('user_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) throw error
    res.json({ success: true })
  } catch (error) {
    console.error('Error marking all notifications read:', error)
    res.status(500).json({ error: 'server_error' })
  }
})

router.delete('/:id', requireAuth(['user', 'vet', 'petstore', 'admin']), async (req, res) => {
  try {
    const userId = (req as any).user.id
    const { data, error } = await supabaseAdmin
      .from('user_notifications')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .select('id')

    if (error) throw error
    if (!data?.length) return res.status(404).json({ error: 'not_found' })
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting notification:', error)
    res.status(500).json({ error: 'server_error' })
  }
})

export default router
