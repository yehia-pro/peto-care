import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// Get messages between two users or for a specific appointment
router.get('/', requireAuth(['user', 'vet', 'admin']), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { otherUserId, appointmentId, limit = 50 } = req.query;

    let query = supabaseAdmin
      .from('messages')
      .select('*, sender:users!sender_id(*), receiver:users!receiver_id(*)')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (appointmentId) {
      query = query.eq('appointment_id', appointmentId);
    } else if (otherUserId) {
      query = query.or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`);
    } else {
      return res.status(400).json({ error: 'Either otherUserId or appointmentId is required' });
    }

    const { data: messages, error } = await query;

    if (error) return res.status(500).json({ error: 'fetch_failed', message: error.message });
    res.json({ messages: (messages || []).reverse() });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get list of conversations for the current user
router.get('/conversations', requireAuth(['user', 'vet', 'admin']), async (req, res) => {
  try {
    const userId = (req as any).user.id;

    // Get all messages where user is sender or receiver
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'fetch_failed', message: error.message });

    // Group by conversation partner
    const conversationsMap = new Map();

    for (const msg of (messages || [])) {
      const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (!conversationsMap.has(otherId)) {
        conversationsMap.set(otherId, {
          userId: otherId,
          lastMessage: msg.content,
          lastMessageTime: msg.created_at,
          unreadCount: msg.receiver_id === userId && !msg.read ? 1 : 0,
          appointmentId: msg.appointment_id
        });
      } else if (msg.receiver_id === userId && !msg.read) {
        conversationsMap.get(otherId).unreadCount++;
      }
    }

    res.json({ conversations: Array.from(conversationsMap.values()) });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Send a new message
const sendMessageSchema = z.object({
  body: z.object({
    receiverId: z.string().uuid(),
    content: z.string().min(1, 'Message content is required'),
    appointmentId: z.string().uuid().optional()
  })
});

router.post('/', requireAuth(['user', 'vet', 'admin']), validate(sendMessageSchema), async (req, res) => {
  try {
    const senderId = (req as any).user.id;
    const { receiverId, content, appointmentId } = req.body;

    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        appointment_id: appointmentId,
        read: false
      })
      .select('*, sender:users!sender_id(*), receiver:users!receiver_id(*)')
      .single();

    if (error) return res.status(500).json({ error: 'insert_failed', message: error.message });

    // Real-time messaging via Socket.IO
    try {
      const io = (req as any).app.get('io');
      if (io) {
        const { sendNotification } = await import('../socket');

        io.to(`user-${receiverId}`).emit('receive_message', { message });
        sendNotification(
          io,
          receiverId,
          'رسالة جديدة 💬',
          content.substring(0, 50) + (content.length > 50 ? '...' : ''),
          'info',
          { messageId: message.id, senderId }
        );
      }
    } catch (socketError) {
      console.error('Failed to emit socket event:', socketError);
    }

    res.status(201).json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark messages as read
const markAsReadSchema = z.object({
  body: z.object({
    senderId: z.string().uuid(),
    appointmentId: z.string().uuid().optional()
  })
});

router.post('/mark-read', requireAuth(['user', 'vet', 'admin']), validate(markAsReadSchema), async (req, res) => {
  try {
    const receiverId = (req as any).user.id;
    const { senderId, appointmentId } = req.body;

    let query = supabaseAdmin
      .from('messages')
      .update({ read: true })
      .eq('sender_id', senderId)
      .eq('receiver_id', receiverId)
      .eq('read', false);

    if (appointmentId) {
      query = query.eq('appointment_id', appointmentId);
    }

    const { error } = await query;

    if (error) return res.status(500).json({ error: 'update_failed', message: error.message });
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

export default router;
