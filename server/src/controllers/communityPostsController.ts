import { Request, Response } from 'express'
import { communityPostsRepository } from '../repositories/communityPostsRepository'

export const communityPostsController = {
  async list(_req: Request, res: Response) {
    try {
      const posts = await communityPostsRepository.list()
      return res.json(posts)
    } catch (e: any) {
      console.error(e)
      return res.status(500).json({ error: 'server_error', message: e.message || 'فشل جلب المنشورات' })
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { content, image } = req.body
      const userId = (req as any).user.id
      if (!content) {
        return res.status(400).json({ error: 'content_required', message: 'محتوى المنشور مطلوب' })
      }
      const post = await communityPostsRepository.create(userId, String(content).trim(), image || null)
      return res.status(201).json(post)
    } catch (e: any) {
      console.error(e)
      return res.status(500).json({ error: 'server_error', message: e.message || 'فشل النشر' })
    }
  },

  async update(req: Request, res: Response) {
    try {
      const postId = req.params.id
      const { content, image } = req.body
      const userId = (req as any).user.id
      const userRole = (req as any).user.role
      if (!content) {
        return res.status(400).json({ error: 'content_required', message: 'محتوى المنشور مطلوب' })
      }
      const existing = await communityPostsRepository.getById(postId)
      if (!existing) return res.status(404).json({ error: 'post_not_found', message: 'المنشور غير موجود' })
      if (String(existing.author._id) !== String(userId) && userRole !== 'admin') {
        return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتعديل هذا المنشور' })
      }
      const updated = await communityPostsRepository.update(postId, String(content).trim(), image)
      return res.json(updated)
    } catch (e: any) {
      console.error(e)
      return res.status(500).json({ error: 'server_error', message: e.message || 'فشل التحديث' })
    }
  },

  async toggleLike(req: Request, res: Response) {
    try {
      const postId = req.params.id
      const userId = (req as any).user.id
      const existing = await communityPostsRepository.getById(postId)
      if (!existing) return res.status(404).json({ error: 'post_not_found', message: 'المنشور غير موجود' })
      const likes = await communityPostsRepository.togglePostLike(postId, userId)
      return res.json({ likes })
    } catch (e: any) {
      console.error(e)
      return res.status(500).json({ error: 'server_error', message: e.message })
    }
  },

  async addComment(req: Request, res: Response) {
    try {
      const postId = req.params.id
      const { text } = req.body
      const userId = (req as any).user.id
      if (!text) return res.status(400).json({ error: 'text_required', message: 'نص التعليق مطلوب' })
      const existing = await communityPostsRepository.getById(postId)
      if (!existing) return res.status(404).json({ error: 'post_not_found', message: 'المنشور غير موجود' })
      const comments = await communityPostsRepository.addComment(postId, userId, String(text).trim())
      return res.json({ comments })
    } catch (e: any) {
      console.error(e)
      return res.status(500).json({ error: 'server_error', message: e.message })
    }
  },

  async toggleCommentLike(req: Request, res: Response) {
    try {
      const { id: postId, commentId } = req.params
      const userId = (req as any).user.id
      const existing = await communityPostsRepository.getById(postId)
      if (!existing) return res.status(404).json({ error: 'post_not_found', message: 'المنشور غير موجود' })
      const comments = await communityPostsRepository.toggleCommentLike(postId, commentId, userId)
      if (!comments) return res.status(404).json({ error: 'comment_not_found', message: 'التعليق غير موجود' })
      return res.json({ success: true, comments })
    } catch (e: any) {
      console.error(e)
      return res.status(500).json({ error: 'server_error', message: e.message })
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const postId = req.params.id
      const userId = (req as any).user.id
      const userRole = (req as any).user.role
      const existing = await communityPostsRepository.getById(postId)
      if (!existing) return res.status(404).json({ error: 'post_not_found', message: 'المنشور غير موجود' })
      if (String(existing.author._id) !== String(userId) && userRole !== 'admin') {
        return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لحذف هذا المنشور' })
      }
      await communityPostsRepository.delete(postId)
      return res.json({ success: true, message: 'تم حذف المنشور بنجاح' })
    } catch (e: any) {
      console.error(e)
      return res.status(500).json({ error: 'server_error', message: e.message })
    }
  },

  async removeComment(req: Request, res: Response) {
    try {
      const { id: postId, commentId } = req.params
      const userId = (req as any).user.id
      const userRole = (req as any).user.role
      const existing = await communityPostsRepository.getById(postId)
      if (!existing) return res.status(404).json({ error: 'post_not_found', message: 'المنشور غير موجود' })
      const comment = existing.comments.find((c: any) => c._id === commentId)
      if (!comment) return res.status(404).json({ error: 'comment_not_found', message: 'التعليق غير موجود' })
      const isCommentAuthor = String(comment.user?._id) === String(userId)
      const isPostAuthor = String(existing.author._id) === String(userId)
      const isAdmin = userRole === 'admin'
      if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
        return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لحذف هذا التعليق' })
      }
      const comments = await communityPostsRepository.deleteComment(postId, commentId)
      return res.json({ success: true, comments })
    } catch (e: any) {
      console.error(e)
      return res.status(500).json({ error: 'server_error', message: e.message })
    }
  }
}
