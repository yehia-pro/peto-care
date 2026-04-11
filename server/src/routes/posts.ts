import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import Post from '../models/Post';
import User from '../models/User';

const router = Router();

// Get all posts
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('author', 'fullName avatarUrl role') // Populate author details
            .populate('comments.user', 'fullName avatarUrl role') // Populate comment authors
            .sort({ createdAt: -1 }); // Newest first

        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'server_error', message: 'حدث خطأ أثناء جلب المنشورات' });
    }
});

// Create a new post
router.post('/', requireAuth(['user', 'vet', 'petstore', 'admin']), async (req, res) => {
    try {
        const { content, image } = req.body;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;

        if (!content) {
            return res.status(400).json({ error: 'content_required', message: 'محتوى المنشور مطلوب' });
        }

        const newPost = await Post.create({
            author: userId,
            authorType: userRole,
            content,
            image,
        });

        // Populate author before returning
        await newPost.populate('author', 'fullName avatarUrl role');

        res.status(201).json(newPost);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'server_error', message: 'حدث خطأ أثناء نشر المنشور' });
    }
});

// Update a post
router.put('/:id', requireAuth(['user', 'vet', 'petstore', 'admin']), async (req, res) => {
    try {
        const postId = req.params.id;
        const { content, image } = req.body;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;

        if (!content) {
            return res.status(400).json({ error: 'content_required', message: 'محتوى المنشور مطلوب' });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'post_not_found', message: 'المنشور غير موجود' });
        }

        // Check permissions: must be author
        if (post.author.toString() !== userId && userRole !== 'admin') {
            return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لتعديل هذا المنشور' });
        }

        post.content = content;
        if (image !== undefined) post.image = image;
        
        // Mongoose will update updatedAt automatically; we also set isEdited flag.
        post.isEdited = true;

        await post.save();

        const updatedPost = await Post.findById(postId)
            .populate('author', 'fullName avatarUrl role')
            .populate('comments.user', 'fullName avatarUrl role');
            
        res.json(updatedPost);
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'server_error', message: 'حدث خطأ أثناء تحديث المنشور' });
    }
});

// Like a post
router.post('/:id/like', requireAuth(['user', 'vet', 'petstore', 'admin']), async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = (req as any).user.id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'post_not_found', message: 'المنشور غير موجود' });
        }

        const likeIndex = post.likes.indexOf(userId);
        if (likeIndex === -1) {
            post.likes.push(userId);
        } else {
            post.likes.splice(likeIndex, 1);
        }

        await post.save();
        res.json({ likes: post.likes });
    } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).json({ error: 'server_error', message: 'حدث خطأ أثناء الإعجاب بالمنشور' });
    }
});

// Add a comment
router.post('/:id/comment', requireAuth(['user', 'vet', 'petstore', 'admin']), async (req, res) => {
    try {
        const postId = req.params.id;
        const { text } = req.body;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;

        if (!text) {
            return res.status(400).json({ error: 'text_required', message: 'نص التعليق مطلوب' });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'post_not_found', message: 'المنشور غير موجود' });
        }

        const newComment = {
            user: userId,
            userType: userRole,
            text,
            createdAt: new Date(),
        };

        post.comments.push(newComment as any);
        await post.save();

        // Repopulate fully from database to ensure the frontend receives all fields like user name
        const updatedPost = await Post.findById(postId).populate('comments.user', 'fullName avatarUrl role');

        res.json({ comments: updatedPost?.comments || [] });
    } catch (error) {
        console.error('Error commenting on post:', error);
        res.status(500).json({ error: 'server_error', message: 'حدث خطأ أثناء التعليق' });
    }
});

// Like a comment
router.post('/:id/comment/:commentId/like', requireAuth(['user', 'vet', 'petstore', 'admin']), async (req, res) => {
    try {
        const { id: postId, commentId } = req.params;
        const userId = (req as any).user.id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'post_not_found', message: 'المنشور غير موجود' });
        }

        const comment = (post.comments as any).id
            ? (post.comments as any).id(commentId)
            : post.comments.find(c => {
                const cid = (c as any)._id || (c as any).id;
                return cid && cid.toString() === commentId;
            });

        if (!comment) {
            return res.status(404).json({ error: 'comment_not_found', message: 'التعليق غير موجود' });
        }

        // Ensure likes array exists if coming from old schema
        if (!comment.likes) comment.likes = [];

        const likeIndex = comment.likes.indexOf(userId);
        if (likeIndex === -1) {
            comment.likes.push(userId);
        } else {
            comment.likes.splice(likeIndex, 1);
        }

        await post.save();

        const updatedPost = await Post.findById(postId).populate('comments.user', 'fullName avatarUrl role');
        res.json({ success: true, comments: updatedPost?.comments || [] });
    } catch (error) {
        console.error('Error liking comment:', error);
        res.status(500).json({ error: 'server_error', message: 'حدث خطأ أثناء الإعجاب بالتعليق' });
    }
});

// Delete a post
router.delete('/:id', requireAuth(['user', 'vet', 'petstore', 'admin']), async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'post_not_found', message: 'المنشور غير موجود' });
        }

        // Check permissions: must be author or admin
        if (post.author.toString() !== userId && userRole !== 'admin') {
            return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لحذف هذا المنشور' });
        }

        await Post.findByIdAndDelete(postId);
        res.json({ success: true, message: 'تم حذف المنشور بنجاح' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'server_error', message: 'حدث خطأ أثناء حذف المنشور' });
    }
});

// Delete a comment
router.delete('/:id/comment/:commentId', requireAuth(['user', 'vet', 'petstore', 'admin']), async (req, res) => {
    try {
        const { id: postId, commentId } = req.params;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'post_not_found', message: 'المنشور غير موجود' });
        }

        const commentIndex = post.comments.findIndex(c => {
            const cid = (c as any)._id || (c as any).id;
            return cid && cid.toString() === commentId;
        });

        if (commentIndex === -1) {
            return res.status(404).json({ error: 'comment_not_found', message: 'التعليق غير موجود' });
        }

        const comment = post.comments[commentIndex];

        // Check permissions: must be comment author, post author, or admin
        const isCommentAuthor = comment.user.toString() === userId;
        const isPostAuthor = post.author.toString() === userId;
        const isAdmin = userRole === 'admin';

        if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
            return res.status(403).json({ error: 'forbidden', message: 'ليس لديك صلاحية لحذف هذا التعليق' });
        }

        post.comments.splice(commentIndex, 1);
        await post.save();

        const updatedPost = await Post.findById(postId).populate('comments.user', 'fullName avatarUrl role');
        res.json({ success: true, comments: updatedPost?.comments || [] });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'server_error', message: 'حدث خطأ أثناء حذف التعليق' });
    }
});

export default router;
