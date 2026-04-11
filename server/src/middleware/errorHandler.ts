import { Request, Response, NextFunction } from 'express'

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || 500
  const message = err.message || 'internal_error'
  res.status(status).json({ error: message })
}
