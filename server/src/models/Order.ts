import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

export interface IShippingAddress {
  fullName: string;
  address: string;
  city: string;
  phone: string;
  notes?: string;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;         // المشتري (Customer)
  storeId: mongoose.Types.ObjectId;        // صاحب المتجر (Vendor)
  items: IOrderItem[];                     // المنتجات المطلوبة
  totalAmount: number;                     // الإجمالي (شامل كل شيء)
  currency: string;
  shippingAddress: IShippingAddress;       // عنوان الشحن
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'; // حالة الطلب
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';                // حالة الدفع
  stripeSessionId?: string;                // رقم جلسة Stripe
  stripePaymentIntentId?: string;          // رقم تأكيد الدفع من Stripe
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  imageUrl: { type: String }
});

const ShippingAddressSchema = new Schema({
  fullName: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  phone: { type: String, required: true },
  notes: { type: String }
});

const OrderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [OrderItemSchema],
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'EGP' },
  shippingAddress: { type: ShippingAddressSchema, required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  stripeSessionId: { type: String },
  stripePaymentIntentId: { type: String }
}, {
  timestamps: true
});

// Indexes for faster lookups (Useful for vendor dashboard and customer order history)
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ storeId: 1, createdAt: -1 });
OrderSchema.index({ stripeSessionId: 1 });

export const MOrderModel = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
