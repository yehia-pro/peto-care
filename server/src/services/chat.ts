import mongoose, { Schema, Model } from 'mongoose'

const MessageSchema = new Schema({
  conversationId: { type: String, index: true, required: true },
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
})

export const MessageModel: Model<any> = mongoose.models.Message || mongoose.model('Message', MessageSchema)
