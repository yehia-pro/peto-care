import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
    reviewerId: mongoose.Types.ObjectId;
    targetId: mongoose.Types.ObjectId; // Vet or Store ID
    targetType: 'vet' | 'petstore' | 'product';
    rating: number;
    comment?: string;
    createdAt: Date;
}

const ReviewSchema = new Schema({
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetId: { type: Schema.Types.ObjectId, required: true }, // Can be User (Vet), PetStore, or Product ID
    targetType: { type: String, enum: ['vet', 'petstore', 'product'], required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
}, {
    timestamps: true
});

// Index to quickly find reviews for a target
ReviewSchema.index({ targetId: 1, createdAt: -1 });
// Index to prevent duplicate reviews from same user to same target? (Optional, maybe allowed)
// ReviewSchema.index({ reviewerId: 1, targetId: 1 }, { unique: true });

export default mongoose.model<IReview>('Review', ReviewSchema);
