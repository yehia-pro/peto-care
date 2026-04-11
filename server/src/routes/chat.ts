import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Message } from '../models/Message';
import mongoose, { Types } from 'mongoose';

const router = Router();

// Get messages between two users or for a specific appointment
router.get('/', requireAuth(['user', 'vet', 'admin']), async (req, res) => {
  try {
    const userId = new Types.ObjectId((req as any).user.id);
    const { otherUserId, appointmentId, limit = 50, before } = req.query;

    const query: any = {
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    };

    if (appointmentId) {
      query.appointmentId = new Types.ObjectId(appointmentId as string);
    } else if (otherUserId) {
      const otherId = new Types.ObjectId(otherUserId as string);
      query.$and = [
        { $or: [{ sender: userId }, { sender: otherId }] },
        { $or: [{ receiver: userId }, { receiver: otherId }] }
      ];
    } else {
      return res.status(400).json({ error: 'Either otherUserId or appointmentId is required' });
    }

    if (before) {
      query.createdAt = { $lt: new Date(before as string) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .lean();

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get list of conversations for the current user
router.get('/conversations', requireAuth(['user', 'vet', 'admin']), async (req, res) => {
  try {
    const userId = new Types.ObjectId((req as any).user.id);

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId },
            { receiver: userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$content' },
          lastMessageTime: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', userId] },
                    { $eq: ['$read', false] }
                  ]
                },
                1,
                0
              ]
            }
          },
          appointmentId: { $first: '$appointmentId' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userId: '$_id',
          userName: '$user.name',
          userAvatar: '$user.avatar',
          lastMessage: 1,
          lastMessageTime: 1,
          unreadCount: 1,
          appointmentId: 1
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      }
    ]);

    res.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Send a new message
const sendMessageSchema = z.object({
  body: z.object({
    receiverId: z.string().min(1, 'Receiver ID is required'),
    content: z.string().min(1, 'Message content is required'),
    appointmentId: z.string().optional()
  })
});

router.post('/', requireAuth(['user', 'vet', 'admin']), validate(sendMessageSchema), async (req, res) => {
  try {
    const senderId = (req as any).user.id;
    const { receiverId, content, appointmentId } = req.body;

    const message = new Message({
      sender: new Types.ObjectId(senderId),
      receiver: new Types.ObjectId(receiverId),
      content,
      appointmentId: appointmentId ? new Types.ObjectId(appointmentId) : undefined,
      read: false
    });

    await message.save();

    // Populate sender and receiver details for the response
    await message.populate('sender', 'name avatar');
    await message.populate('receiver', 'name avatar');

    // Real-time messaging via Socket.IO
    try {
      const io = (req as any).app.get('io');
      if (io) {
        const { sendNotification } = await import('../socket');

        // Emit message to receiver
        io.to(`user-${receiverId}`).emit('receive_message', {
          message,
          sender: message.sender
        });

        // Also send a notification
        sendNotification(
          io,
          receiverId,
          'رسالة جديدة 💬',
          content.substring(0, 50) + (content.length > 50 ? '...' : ''),
          'info',
          { messageId: message._id, senderId }
        );
      }
    } catch (socketError) {
      console.error('Failed to emit socket event:', socketError);
      // Don't fail the request if socket fails
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
    senderId: z.string().min(1, 'Sender ID is required'),
    appointmentId: z.string().optional()
  })
});

router.post('/mark-read', requireAuth(['user', 'vet', 'admin']), validate(markAsReadSchema), async (req, res) => {
  try {
    const receiverId = (req as any).user.id;
    const { senderId, appointmentId } = req.body;

    const updateQuery: any = {
      sender: new Types.ObjectId(senderId),
      receiver: new Types.ObjectId(receiverId),
      read: false
    };

    if (appointmentId) {
      updateQuery.appointmentId = new Types.ObjectId(appointmentId);
    }

    const result = await Message.updateMany(
      updateQuery,
      { $set: { read: true } }
    );

    res.json({ success: true, updatedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

export default router;
