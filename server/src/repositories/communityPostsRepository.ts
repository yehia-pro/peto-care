import { randomUUID } from 'crypto'
import { supabaseAdmin } from '../lib/supabase'

const profileToLegacy = (role: string | null | undefined): string => {
  if (role === 'vet') return 'vet'
  if (role === 'admin') return 'admin'
  if (role === 'store_owner') return 'petstore'
  return 'user'
}

const mapAuthor = (p: { id: string; full_name?: string | null; avatar_url?: string | null; role?: string | null }) => ({
  _id: p.id,
  fullName: p.full_name || '',
  avatarUrl: p.avatar_url || '',
  role: profileToLegacy(p.role)
})

export const mapCommunityPostRow = (row: any) => {
  const author = row.author || {}
  const likes = Array.isArray(row.likes) ? row.likes.map(String) : []
  const rawComments = Array.isArray(row.comments) ? row.comments : []
  const comments = rawComments.map((c: any) => ({
    _id: c.id,
    user: c.user || { _id: c.user_id, fullName: '', avatarUrl: '', role: 'user' },
    text: c.text || '',
    likes: Array.isArray(c.likes) ? c.likes.map(String) : [],
    createdAt: c.createdAt || c.created_at
  }))
  return {
    _id: row.id,
    author: mapAuthor(author),
    content: row.content,
    image: row.image_url || '',
    isEdited: row.is_edited,
    likes,
    comments,
    createdAt: row.created_at
  }
}

const selectWithAuthor = `
  *,
  author:profiles!community_posts_author_user_id_fkey(id, full_name, avatar_url, role)
`

export const communityPostsRepository = {
  async list() {
    const { data, error } = await supabaseAdmin
      .from('community_posts')
      .select(selectWithAuthor)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(mapCommunityPostRow)
  },

  async getById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('community_posts')
      .select(selectWithAuthor)
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    return mapCommunityPostRow(data)
  },

  async create(authorUserId: string, content: string, imageUrl: string | null) {
    const { data, error } = await supabaseAdmin
      .from('community_posts')
      .insert({
        author_user_id: authorUserId,
        content,
        image_url: imageUrl || null,
        likes: [],
        comments: []
      })
      .select(selectWithAuthor)
      .single()
    if (error) throw error
    return mapCommunityPostRow(data)
  },

  async update(id: string, content: string, imageUrl: string | null | undefined) {
    const patch: Record<string, unknown> = {
      content,
      is_edited: true,
      updated_at: new Date().toISOString()
    }
    if (imageUrl !== undefined) patch.image_url = imageUrl || null
    const { data, error } = await supabaseAdmin
      .from('community_posts')
      .update(patch)
      .eq('id', id)
      .select(selectWithAuthor)
      .single()
    if (error) throw error
    return mapCommunityPostRow(data)
  },

  async delete(id: string) {
    const { error } = await supabaseAdmin.from('community_posts').delete().eq('id', id)
    if (error) throw error
  },

  async togglePostLike(id: string, userId: string) {
    const { data: row, error } = await supabaseAdmin.from('community_posts').select('likes').eq('id', id).single()
    if (error) throw error
    const likes: string[] = Array.isArray(row.likes) ? row.likes.map(String) : []
    const idx = likes.indexOf(userId)
    if (idx === -1) likes.push(userId)
    else likes.splice(idx, 1)
    const { error: upErr } = await supabaseAdmin.from('community_posts').update({ likes, updated_at: new Date().toISOString() }).eq('id', id)
    if (upErr) throw upErr
    return likes
  },

  async addComment(postId: string, userId: string, text: string) {
    const { data: profile, error: pErr } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, avatar_url, role')
      .eq('id', userId)
      .maybeSingle()
    if (pErr) throw pErr

    const { data: row, error } = await supabaseAdmin.from('community_posts').select('comments').eq('id', postId).single()
    if (error) throw error
    const comments = Array.isArray(row.comments) ? [...row.comments] : []
    const id = randomUUID()
    const userSnap = mapAuthor(profile || { id: userId, full_name: '', avatar_url: '', role: 'customer' })
    comments.push({
      id,
      user_id: userId,
      user: userSnap,
      text,
      likes: [],
      createdAt: new Date().toISOString()
    })
    const { error: upErr } = await supabaseAdmin
      .from('community_posts')
      .update({ comments, updated_at: new Date().toISOString() })
      .eq('id', postId)
    if (upErr) throw upErr
    return comments.map((c: any) => ({
      _id: c.id,
      user: c.user,
      text: c.text,
      likes: Array.isArray(c.likes) ? c.likes.map(String) : [],
      createdAt: c.createdAt
    }))
  },

  async toggleCommentLike(postId: string, commentId: string, userId: string) {
    const { data: row, error } = await supabaseAdmin.from('community_posts').select('comments').eq('id', postId).single()
    if (error) throw error
    const comments = Array.isArray(row.comments) ? row.comments.map((c: any) => ({ ...c })) : []
    const c = comments.find((x: any) => x.id === commentId)
    if (!c) return null
    const cl: string[] = Array.isArray(c.likes) ? c.likes.map(String) : []
    const i = cl.indexOf(userId)
    if (i === -1) cl.push(userId)
    else cl.splice(i, 1)
    c.likes = cl
    const { error: upErr } = await supabaseAdmin
      .from('community_posts')
      .update({ comments, updated_at: new Date().toISOString() })
      .eq('id', postId)
    if (upErr) throw upErr
    return comments.map((cm: any) => ({
      _id: cm.id,
      user: cm.user,
      text: cm.text,
      likes: Array.isArray(cm.likes) ? cm.likes.map(String) : [],
      createdAt: cm.createdAt
    }))
  },

  async deleteComment(postId: string, commentId: string) {
    const { data: row, error } = await supabaseAdmin.from('community_posts').select('comments').eq('id', postId).single()
    if (error) throw error
    const comments = (Array.isArray(row.comments) ? row.comments : []).filter((c: any) => c.id !== commentId)
    const { error: upErr } = await supabaseAdmin
      .from('community_posts')
      .update({ comments, updated_at: new Date().toISOString() })
      .eq('id', postId)
    if (upErr) throw upErr
    return comments.map((cm: any) => ({
      _id: cm.id,
      user: cm.user,
      text: cm.text,
      likes: Array.isArray(cm.likes) ? cm.likes.map(String) : [],
      createdAt: cm.createdAt
    }))
  }
}
