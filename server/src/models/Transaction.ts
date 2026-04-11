import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'appointment' | 'order' | 'subscription' | 'payment';
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    paymentMethod: 'card' | 'cash' | 'wallet';
    referenceId?: mongoose.Types.ObjectId; // appointmentId or orderId
    stripePaymentIntentId?: string;
    description?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const TransactionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['appointment', 'order', 'subscription', 'payment'],
        required: true
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'EGP' },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'cash', 'wallet'],
        default: 'cash'
    },
    referenceId: { type: Schema.Types.ObjectId },
    stripePaymentIntentId: { type: String },
    description: { type: String },
    metadata: { type: Schema.Types.Mixed }
}, {
    timestamps: true
});

// Index for fast lookup
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ type: 1 });

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
