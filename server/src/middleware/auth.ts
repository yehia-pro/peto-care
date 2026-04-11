import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthPayload { id: string; role: 'user' | 'vet' | 'admin' | 'petstore' }

export const requireAuth = (roles?: Array<'user' | 'vet' | 'admin' | 'petstore'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' })
    const token = header.substring(7)
    try {
      const payload = jwt.verify(token, String(process.env.JWT_SECRET)) as AuthPayload
        ; (req as any).user = payload
      if (roles && !roles.includes(payload.role)) return res.status(403).json({ error: 'forbidden' })
      if (payload.role === 'admin') {
        const allowedAdmins = ['yaheaeldesoky0@gmail.com', 'aymanyoussef219@gmail.com']
        // payload must now include email from login
        if (!(payload as any).email || !allowedAdmins.includes((payload as any).email)) {
          return res.status(403).json({ error: 'forbidden_admin_access' })
        }
      }
      next()
    } catch {
      res.status(401).json({ error: 'unauthorized' })
    }
  }
}
