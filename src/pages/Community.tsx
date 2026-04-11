import { useState, useEffect } from 'react'
import { MessageSquare, ThumbsUp, Share2, MoreVertical, Image as ImageIcon, Send, Trash2, Heart, Edit2 } from 'lucide-react'
import { SafeImage } from '../components/SafeImage'
import { useAuthStore } from '@/stores/authStore'
import api from '@/services/api'
import { toast } from 'sonner'

interface Post {
    _id: string;
    author: {
        _id: string;
        fullName: string;
        avatarUrl?: string;
        role: string;
    };
    content: string;
    image?: string;
    isEdited?: boolean;
    likes: string[];
    comments: any[];
    createdAt: string;
}

const Community = () => {
    const { isAuthenticated, user } = useAuthStore()
    const [posts, setPosts] = useState<Post[]>([])
    const [newPostContent, setNewPostContent] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isPosting, setIsPosting] = useState(false)
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    // Edit states
    const [editingPostId, setEditingPostId] = useState<string | null>(null)
    const [editPostContent, setEditPostContent] = useState('')
    const [isSavingEdit, setIsSavingEdit] = useState(false)

    // Comment states
    const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null)
    const [commentText, setCommentText] = useState('')
    const [isSubmittingComment, setIsSubmittingComment] = useState(false)

    useEffect(() => {
        fetchPosts()
    }, [])

    const fetchPosts = async () => {
        try {
            const { data } = await api.get('/posts')
            setPosts(data)
        } catch (error) {
            console.error('Failed to fetch posts:', error)
            toast.error('فشل تحميل المنشورات، جاري عرض بيانات تجريبية')

            // Mock data fallback
            const mockPosts = [
                {
                    _id: 'mock1',
                    author: { _id: '1', fullName: 'د. يحيى', role: 'vet', avatarUrl: 'https://placehold.co/100x100' },
                    content: 'نصيحة اليوم: تأكد من تطعيم حيوانك الأليف في الموعد المحدد.',
                    likes: [],
                    comments: [],
                    createdAt: new Date().toISOString()
                }
            ]
            setPosts(mockPosts)
        } finally {
            setIsLoading(false)
        }
    }

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedImage(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const handleCreatePost = async () => {
        if (!isAuthenticated) {
            toast.error('يجب عليك تسجيل الدخول أولاً')
            return
        }

        if (!newPostContent.trim()) {
            toast.error('يرجى كتابة محتوى المنشور')
            return
        }

        setIsPosting(true)
        try {
            let imageUrl = ''
            if (selectedImage) {
                const formData = new FormData()
                formData.append('file', selectedImage)
                const uploadRes = await api.post('/uploads/images', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                imageUrl = uploadRes.data.url
            }

            const { data } = await api.post('/posts', {
                content: newPostContent,
                image: imageUrl
            })

            setPosts([data, ...posts])
            setNewPostContent('')
            setSelectedImage(null)
            setPreviewUrl(null)
            toast.success('تم نشر المنشور بنجاح')
        } catch (error) {
            console.error('Failed to create post:', error)
            toast.error('حدث خطأ أثناء النشر')
        } finally {
            setIsPosting(false)
        }
    }

    const handleEditPost = (post: Post) => {
        setEditingPostId(post._id)
        setEditPostContent(post.content)
    }

    const handleSaveEdit = async (postId: string) => {
        if (!editPostContent.trim()) {
            toast.error('لا يمكن ترك المنشور فارغاً')
            return
        }
        setIsSavingEdit(true)
        try {
            const { data } = await api.put(`/posts/${postId}`, { content: editPostContent })
            setPosts(posts.map(p => p._id === postId ? data : p))
            setEditingPostId(null)
            toast.success('تم تعديل المنشور بنجاح')
        } catch (error) {
            console.error('Error editing post:', error)
            toast.error('حدث خطأ أثناء تعديل المنشور')
        } finally {
            setIsSavingEdit(false)
        }
    }

    const handleLike = async (postId: string) => {
        if (!isAuthenticated) return toast.error('يجب تسجيل الدخول للإعجاب')

        try {
            const { data } = await api.post(`/posts/${postId}/like`)
            setPosts(posts.map(post => {
                if (post._id === postId) {
                    return {
                        ...post,
                        likes: data.likes || []
                    }
                }
                return post
            }))
        } catch (error) {
            console.error('Error liking post:', error)
        }
    }

    const handleLikeComment = async (postId: string, commentId: string) => {
        if (!isAuthenticated) return toast.error('يجب تسجيل الدخول للإعجاب')

        try {
            const { data } = await api.post(`/posts/${postId}/comment/${commentId}/like`)
            setPosts(posts.map(p => {
                if (p._id === postId) {
                    return { ...p, comments: data.comments || [] }
                }
                return p
            }))
        } catch (error) {
            console.error('Error liking comment:', error)
        }
    }

    const toggleComments = (postId: string) => {
        if (activeCommentPost === postId) {
            setActiveCommentPost(null)
        } else {
            setActiveCommentPost(postId)
            setCommentText('')
        }
    }

    const handleCommentSubmit = async (postId: string) => {
        if (!isAuthenticated) return toast.error('يجب تسجيل الدخول للتعليق')
        if (!commentText.trim()) return

        setIsSubmittingComment(true)
        try {
            const { data } = await api.post(`/posts/${postId}/comment`, { text: commentText })

            setPosts(posts.map(post => {
                if (post._id === postId) {
                    return {
                        ...post,
                        comments: data.comments || []
                    }
                }
                return post
            }))

            setCommentText('')
            toast.success('تمت إضافة التعليق')
        } catch (error) {
            console.error('Error submitting comment:', error)
            toast.error('حدث خطأ أثناء إضافة التعليق')
        } finally {
            setIsSubmittingComment(false)
        }
    }

    const handleDeletePost = async (postId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا المنشور؟')) return
        try {
            await api.delete(`/posts/${postId}`)
            setPosts(posts.filter(p => p._id !== postId))
            toast.success('تم حذف المنشور')
        } catch (error) {
            console.error('Error deleting post:', error)
            toast.error('حدث خطأ أثناء حذف المنشور')
        }
    }

    const handleDeleteComment = async (postId: string, commentId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) return
        try {
            const { data } = await api.delete(`/posts/${postId}/comment/${commentId}`)
            setPosts(posts.map(p => {
                if (p._id === postId) {
                    return { ...p, comments: data.comments || [] }
                }
                return p
            }))
            toast.success('تم حذف التعليق')
        } catch (error) {
            console.error('Error deleting comment:', error)
            toast.error('حدث خطأ أثناء حذف التعليق')
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (diffInSeconds < 60) return 'الآن'
        if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`
        if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`
        return date.toLocaleDateString('ar-EG')
    }

    return (
        <div className="min-h-screen bg-gray-100 pt-24 pb-12" dir="rtl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Sidebar / Trends */}
                    <div className="hidden lg:block space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h3 className="font-bold text-gray-900 mb-4 font-['Cairo']">المواضيع الشائعة</h3>
                            <ul className="space-y-3 text-sm font-['Tajawal']">
                                <li className="flex justify-between text-gray-600 cursor-pointer hover:text-[var(--color-vet-primary)]">
                                    <span>#تغذية_القطط</span>
                                    <span className="bg-gray-100 px-2 rounded-full">1.2k</span>
                                </li>
                                <li className="flex justify-between text-gray-600 cursor-pointer hover:text-[var(--color-vet-primary)]">
                                    <span>#تبني_لا_تشتري</span>
                                    <span className="bg-gray-100 px-2 rounded-full">850</span>
                                </li>
                                <li className="flex justify-between text-gray-600 cursor-pointer hover:text-[var(--color-vet-primary)]">
                                    <span>#صحة_الكلاب</span>
                                    <span className="bg-gray-100 px-2 rounded-full">500</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Main Feed */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* New Post Box */}
                        <div className="bg-white rounded-2xl shadow-sm p-4">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                    {user?.avatarUrl && <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" />}
                                </div>
                                <div className="flex-1">
                                    <textarea
                                        value={newPostContent}
                                        onChange={(e) => setNewPostContent(e.target.value)}
                                        placeholder="شاركنا أفكارك أو استسفارك..."
                                        className="w-full bg-gray-50 rounded-lg px-4 py-2 border-none focus:ring-2 focus:ring-blue-100 transition-all font-['Tajawal'] resize-none"
                                        rows={3}
                                    />
                                    {previewUrl && (
                                        <div className="mt-2 relative">
                                            <img src={previewUrl} alt="Preview" className="max-h-60 rounded-lg" />
                                            <button
                                                onClick={() => { setSelectedImage(null); setPreviewUrl(null); }}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                                <div className="flex gap-2">
                                    <label className="cursor-pointer text-gray-500 hover:bg-gray-50 p-2 rounded-lg text-sm font-bold flex items-center gap-2">
                                        <ImageIcon className="w-5 h-5" />
                                        <span>صورة</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageSelect}
                                        />
                                    </label>
                                </div>
                                <button
                                    onClick={handleCreatePost}
                                    disabled={isPosting || (!newPostContent.trim() && !selectedImage)}
                                    className={`bg-[var(--color-vet-primary)] text-white px-6 py-2 rounded-full font-bold hover:bg-[var(--color-vet-primary)] transition-colors flex items-center gap-2 ${isPosting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isPosting ? 'جاري النشر...' : (
                                        <>
                                            <span>نشر</span>
                                            <Send className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Posts */}
                        {isLoading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-vet-primary)] mx-auto"></div>
                                <p className="mt-2 text-gray-500">جاري تحميل المنشورات...</p>
                            </div>
                        ) : (
                            posts.map(post => (
                                <div key={post._id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                                    <div className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <SafeImage src={post.author.avatarUrl || ''} alt={post.author.fullName} className="w-10 h-10 rounded-full object-cover" />
                                            <div>
                                                <h4 className="font-bold text-gray-900 font-['Cairo'] flex items-center gap-1">
                                                    {post.author.fullName}
                                                    {post.author.role === 'vet' && <span className="bg-blue-100 text-[var(--color-vet-primary)] text-[10px] px-2 rounded-full">طبيب</span>}
                                                </h4>
                                                <p className="text-xs text-gray-500 font-['Tajawal'] flex items-center gap-1">
                                                    <span>{formatDate(post.createdAt)}</span>
                                                    {post.isEdited && <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-400 font-medium">(تم التعديل)</span>}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {(user?.role === 'admin' || user?.id === post.author._id) && (
                                                <>
                                                    {user?.id === post.author._id && (
                                                        <button onClick={() => handleEditPost(post)} className="text-gray-400 hover:text-[var(--color-vet-secondary)] hover:bg-green-50 p-2 rounded-full transition-colors" title="تعديل المنشور">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleDeletePost(post._id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors" title="حذف المنشور">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </>
                                            )}
                                            <button className="text-gray-400 hover:bg-gray-50 p-2 rounded-full">
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="px-4 pb-4">
                                        {editingPostId === post._id ? (
                                            <div className="space-y-3 mt-2">
                                                <textarea
                                                    value={editPostContent}
                                                    onChange={(e) => setEditPostContent(e.target.value)}
                                                    className="w-full bg-gray-50 rounded-lg px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-[var(--color-vet-primary)] transition-all font-['Tajawal'] min-h-[100px] resize-none"
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => setEditingPostId(null)}
                                                        className="px-4 py-1.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                                                    >
                                                        إلغاء
                                                    </button>
                                                    <button 
                                                        onClick={() => handleSaveEdit(post._id)}
                                                        disabled={isSavingEdit || editPostContent.trim() === post.content}
                                                        className="px-4 py-1.5 text-sm font-bold bg-[var(--color-vet-primary)] text-white hover:bg-blue-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {isSavingEdit ? 'جاري الحفظ...' : 'حفظ التعديل'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-gray-700 font-['Tajawal'] whitespace-pre-wrap leading-relaxed">
                                                {post.content}
                                            </p>
                                        )}
                                    </div>

                                    {post.image && (
                                        <div className="w-full bg-gray-100">
                                            <SafeImage src={post.image} alt="Post content" className="w-full h-auto max-h-96 object-contain" />
                                        </div>
                                    )}

                                    <div className="p-4 border-t border-gray-100 flex items-center justify-between text-gray-500">
                                        <button
                                            onClick={() => handleLike(post._id)}
                                            className={`flex items-center gap-2 hover:text-[var(--color-vet-primary)] transition-colors ${post.likes.includes(user?.id || '') ? 'text-[var(--color-vet-primary)]' : ''}`}
                                        >
                                            <ThumbsUp className="w-5 h-5" />
                                            <span>{post.likes.length}</span>
                                        </button>
                                        <button
                                            onClick={() => toggleComments(post._id)}
                                            className={`flex items-center gap-2 hover:text-[var(--color-vet-primary)] transition-colors ${activeCommentPost === post._id ? 'text-[var(--color-vet-primary)]' : ''}`}
                                        >
                                            <MessageSquare className="w-5 h-5" />
                                            <span>{post.comments.length}</span>
                                        </button>
                                        <button className="flex items-center gap-2 hover:text-[var(--color-vet-primary)] transition-colors">
                                            <Share2 className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Comments Section */}
                                    {activeCommentPost === post._id && (
                                        <div className="bg-gray-50 p-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                                            {/* Add Comment Input */}
                                            <div className="flex gap-3 mb-6">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                                    {user?.avatarUrl && <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" />}
                                                </div>
                                                <div className="flex-1 relative">
                                                    <input
                                                        type="text"
                                                        value={commentText}
                                                        onChange={(e) => setCommentText(e.target.value)}
                                                        placeholder="أضف تعليقاً..."
                                                        className="w-full rounded-full border border-gray-300 px-4 py-2 pr-12 focus:ring-2 focus:ring-blue-100 focus:border-[var(--color-vet-primary)] font-['Tajawal'] text-sm"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                e.preventDefault();
                                                                handleCommentSubmit(post._id);
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => handleCommentSubmit(post._id)}
                                                        disabled={isSubmittingComment || !commentText.trim()}
                                                        className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--color-vet-primary)] hover:bg-blue-50 p-1 rounded-full disabled:text-gray-400"
                                                    >
                                                        <Send className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Comments List */}
                                            <div className="space-y-4">
                                                {post.comments.length === 0 ? (
                                                    <p className="text-center text-gray-500 text-sm py-2">كن أول من يعلق!</p>
                                                ) : (
                                                    post.comments.map((comment, idx) => (
                                                        <div key={idx} className="flex gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 mt-1">
                                                                <SafeImage
                                                                    src={comment.user?.avatarUrl || ''}
                                                                    alt={comment.user?.fullName}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            <div className="flex-1 bg-white p-3 rounded-2xl rounded-tr-none shadow-sm">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="font-bold text-xs text-gray-900 font-['Cairo']">
                                                                        {comment.user?.fullName || 'مستخدم'}
                                                                        {comment.user?.role === 'vet' && <span className="mr-2 bg-blue-100 text-[var(--color-vet-primary)] text-[10px] px-1.5 py-0.5 rounded-full">طبيب</span>}
                                                                    </span>
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleLikeComment(post._id, comment._id)}
                                                                            className={`text-gray-400 hover:text-red-500 p-1 transition-colors flex items-center gap-1 ${comment.likes?.includes(user?.id || '') ? 'text-red-500' : ''}`}
                                                                            title="إعجاب بالتعليق"
                                                                        >
                                                                            <Heart className="w-3 h-3" fill={comment.likes?.includes(user?.id || '') ? 'currentColor' : 'none'} />
                                                                            {comment.likes?.length > 0 && <span className="text-[10px]">{comment.likes.length}</span>}
                                                                        </button>
                                                                        <span className="text-[10px] text-gray-400">{formatDate(comment.createdAt || new Date().toISOString())}</span>
                                                                        {(user?.role === 'admin' || user?.id === post.author._id || user?.id === comment.user?._id) && (
                                                                            <button onClick={() => handleDeleteComment(post._id, comment._id)} className="text-red-400 hover:text-red-600 p-1 rounded-full transition-colors" title="حذف التعليق">
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <p className="text-sm text-gray-700 font-['Tajawal']">{comment.text}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Verified Vets Suggestion */}
                    <div className="hidden lg:block space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h3 className="font-bold text-gray-900 mb-4 font-['Cairo']">أطباء مقترحون</h3>
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[var(--color-vet-primary)] font-bold">د</div>
                                        <div>
                                            <p className="font-bold text-sm">د. سارة محمود</p>
                                            <button className="text-[var(--color-vet-primary)] text-xs font-bold hover:underline">متابعة</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Community
