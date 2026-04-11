import mongoose, { Schema, Document } from 'mongoose'

export interface IReminder extends Document {
    userId: string
    petId?: string
    type: 'vaccination' | 'medication' | 'appointment' | 'checkup'
    title: string
    description: string
    dueDate: Date
    sent: boolean
    createdAt: Date
}

const ReminderSchema = new Schema({
    userId: { type: String, required: true, index: true },
    petId: { type: String },
    type: { type: String, enum: ['vaccination', 'medication', 'appointment', 'checkup'], required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    dueDate: { type: Date, required: true, index: true },
    sent: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
})

export default mongoose.models.Reminder || mongoose.model<IReminder>('Reminder', ReminderSchema)
