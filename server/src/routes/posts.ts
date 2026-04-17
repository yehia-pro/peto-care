import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { communityPostsController } from '../controllers/communityPostsController'

const router = Router()

router.get('/', async (req, res) => communityPostsController.list(req, res))

router.post('/', requireAuth(['user', 'vet', 'petstore', 'admin']), async (req, res) =>
  communityPostsController.create(req, res)
)

router.put('/:id', requireAuth(['user', 'vet', 'petstore', 'admin']), async (req, res) =>
  communityPostsController.update(req, res)
)

router.post('/:id/like', requireAuth(['user', 'vet', 'petstore', 'admin']), async (req, res) =>
  communityPostsController.toggleLike(req, res)
)

router.post('/:id/comment', requireAuth(['user', 'vet', 'petstore', 'admin']), async (req, res) =>
  communityPostsController.addComment(req, res)
)

router.post('/:id/comment/:commentId/like', requireAuth(['user', 'vet', 'petstore', 'admin']), async (req, res) =>
  communityPostsController.toggleCommentLike(req, res)
)

router.delete('/:id', requireAuth(['user', 'vet', 'petstore', 'admin']), async (req, res) =>
  communityPostsController.remove(req, res)
)

router.delete('/:id/comment/:commentId', requireAuth(['user', 'vet', 'petstore', 'admin']), async (req, res) =>
  communityPostsController.removeComment(req, res)
)

export default router
