import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  content: string;
  appointmentId?: Types.ObjectId;
  read: boolean;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>({
  sender: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  receiver: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  content: { 
    type: String, 
    required: true,
    trim: true
  },
  appointmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  read: {
    type: Boolean,
    default: false
  },
}, {
  timestamps: true
});

// Index for faster querying of conversations
messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });
messageSchema.index({ appointmentId: 1, createdAt: 1 });

export const Message = mongoose.models.Message || 
  mongoose.model<IMessage>('Message', messageSchema);
