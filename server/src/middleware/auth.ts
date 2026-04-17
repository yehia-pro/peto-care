import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase'

type LegacyRole = 'user' | 'vet' | 'admin' | 'petstore'
type ProfileRole = 'customer' | 'vet' | 'admin' | 'store_owner'

const profileToLegacyRole = (role?: ProfileRole | null): LegacyRole => {
  if (role === 'store_owner') return 'petstore'
  if (role === 'vet') return 'vet'
  if (role === 'admin') return 'admin'
  return 'user'
}

export const requireAuth = (roles?: LegacyRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'unauthorized' })
    }

    const token = header.substring(7)
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !authData.user) {
      return res.status(401).json({ error: 'unauthorized' })
    }

    const userId = authData.user.id
    const email = authData.user.email || ''

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name')
      .eq('id', userId)
      .maybeSingle()

    const role = profileToLegacyRole((profile?.role as ProfileRole | undefined) || 'customer')
    ;(req as any).user = {
      id: userId,
      email,
      role,
      fullName: profile?.full_name || authData.user.user_metadata?.full_name || ''
    }

    if (roles && !roles.includes(role)) {
      return res.status(403).json({ error: 'forbidden' })
    }

    next()
  }
}
