import mongoose, { Document, Schema } from 'mongoose'

export interface IInvoice extends Document {
  userId: string
  type: 'appointment' | 'product'
  referenceId?: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'cancelled'
  description?: string
  createdAt: Date
  updatedAt: Date
}

const invoiceSchema = new Schema<IInvoice>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ['appointment', 'product'], required: true },
    referenceId: { type: String },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending', index: true },
    description: { type: String },
  },
  { timestamps: true }
)

invoiceSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.models?.Invoice || mongoose.model<IInvoice>('Invoice', invoiceSchema)

