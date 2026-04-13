import mongoose, { Document, Schema } from 'mongoose'

export interface IPetStore extends Document {
  userId: string
  storeName: string
  storeType?: string
  description?: string
  phone?: string
  website?: string
  whatsapp?: string
  openingTime?: string
  closingTime?: string
  services?: string[]
  brands?: string[]
  city?: string
  address?: string
  commercialRegImageUrl: string
  rating: number
  reviewCount: number
  products?: {
    name: string
    description: string
    price: number
    category: string
    imageUrl: string
    inStock: boolean
    stock: number
    salePrice?: number
    saleExpiresAt?: Date
  }[]
  createdAt: Date
  updatedAt: Date
}

const petStoreSchema = new Schema<IPetStore>(
  {
    userId: { type: String, required: true, index: true },
    storeName: { type: String, required: true },
    storeType: String,
    description: String,
    phone: String,
    website: String,
    whatsapp: String,
    openingTime: String,
    closingTime: String,
    services: [String],
    brands: [String],
    city: String,
    address: String,
    commercialRegImageUrl: { type: String, required: true },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    products: [{
      name: String,
      description: String,
      price: Number,
      category: String,
      imageUrl: String,
      stock: { type: Number, default: 0 },
      inStock: { type: Boolean, default: true },
      salePrice: { type: Number },
      saleExpiresAt: { type: Date }
    }]
  },
  { timestamps: true }
)

petStoreSchema.index({ userId: 1 })

export default mongoose.models?.PetStore || mongoose.model<IPetStore>('PetStore', petStoreSchema)

