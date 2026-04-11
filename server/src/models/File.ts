import mongoose, { Schema, Document } from 'mongoose';

export interface IFile extends Document {
    userId: string;
    appointmentId?: string;
    filename: string;
    mimetype: string;
    size: number;
    path: string;
    createdAt: Date;
}

const FileSchema: Schema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    appointmentId: {
        type: Schema.Types.ObjectId,
        ref: 'Appointment'
    },
    filename: {
        type: String,
        required: true
    },
    mimetype: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure virtuals are included in toJSON/toObject
FileSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
    }
});

export const FileModel = mongoose.model<IFile>('File', FileSchema);
