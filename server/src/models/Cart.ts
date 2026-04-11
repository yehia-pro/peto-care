import mongoose, { Schema, Document, Types } from 'mongoose';

interface ICartItem {
  productId: Types.ObjectId;
  quantity: number;
  price: number;
  name: string;
  image?: string;
}

interface ICart extends Document {
  userId: Types.ObjectId;
  items: ICartItem[];
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>({
  productId: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  name: { type: String, required: true },
  image: { type: String }
});

const cartSchema = new Schema<ICart>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true
  },
  items: [cartItemSchema],
  totalAmount: { 
    type: Number, 
    required: true, 
    default: 0 
  }
}, {
  timestamps: true
});

// Calculate total amount before saving
cartSchema.pre<ICart>('save', function(next) {
  this.totalAmount = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  next();
});

export const Cart = mongoose.models.Cart || mongoose.model<ICart>('Cart', cartSchema);
