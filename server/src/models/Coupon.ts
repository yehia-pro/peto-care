import mongoose, { Document, Schema } from 'mongoose'

export interface ICoupon extends Document {
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  expiresAt?: Date
  minOrderAmount: number
  maxUses: number
  usedCount: number
  isActive: boolean
  createdBy?: string
  createdAt: Date
  updatedAt: Date
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    expiresAt: { type: Date },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    maxUses: { type: Number, default: 0, min: 0 }, // 0 means unlimited
    usedCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String }
  },
  { timestamps: true }
)

// Index for fast lookup by code
couponSchema.index({ code: 1 })

export default mongoose.models?.Coupon || mongoose.model<ICoupon>('Coupon', couponSchema)
