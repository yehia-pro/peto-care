import { supabaseAdmin } from '../lib/supabase'

export const startAutoRejectJob = (_io: any) => {
  // Run every hour
  setInterval(async () => {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      const { data: pending, error } = await supabaseAdmin
        .from('appointments')
        .select('id')
        .eq('status', 'pending')
        .lte('created_at', twentyFourHoursAgo)

      if (error) {
        console.error('AutoRejectJob query failed:', error)
        return
      }

      const ids = (pending || []).map((r: any) => r.id)
      if (ids.length === 0) return

      console.log(`Auto-cancelling ${ids.length} pending appointments older than 24 hours.`)

      const { error: updateError } = await supabaseAdmin
        .from('appointments')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .in('id', ids)

      if (updateError) {
        console.error('AutoRejectJob update failed:', updateError)
      }
    } catch (error) {
      console.error('Error running autoRejectJob:', error)
    }
  }, 60 * 60 * 1000) // 1 hour interval
}
