import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = { body: req.body, query: req.query, params: req.params }
    const result = schema.safeParse(data)
    if (!result.success) {
      console.error('Validation Error Details:', JSON.stringify(result.error.flatten(), null, 2));
      return res.status(400).json({ error: 'validation_error', details: result.error.flatten() });
    }
    next()
  }
}
