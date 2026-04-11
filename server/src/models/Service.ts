import mongoose, { Schema, Document } from 'mongoose'

export interface IService extends Document {
    name: string
    description: string
    price: number
    duration: number
    category: 'veterinary' | 'grooming' | 'boarding' | 'training' | 'other'
    vetId?: string
    storeId?: string
    isActive: boolean
    averageRating: number
    reviewCount: number
    salePrice?: number
    saleExpiresAt?: Date
    createdAt: Date
    updatedAt: Date
}

const ServiceSchema = new Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 15 }, // in minutes
    category: {
        type: String,
        enum: ['veterinary', 'grooming', 'boarding', 'training', 'other'],
        default: 'veterinary'
    },
    vetId: { type: Schema.Types.ObjectId, ref: 'User' },
    storeId: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    salePrice: { type: Number },
    saleExpiresAt: { type: Date }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

// Index for getting services by provider
ServiceSchema.index({ vetId: 1 })
ServiceSchema.index({ storeId: 1 })

export default mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema)
