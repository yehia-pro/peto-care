const mongoose = require('mongoose');

const petStoreSchema = new mongoose.Schema(
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
      salePrice: Number,
      saleExpiresAt: Date
    }]
  },
  { timestamps: true }
);

const MPetStoreModel = mongoose.models.PetStore || mongoose.model('PetStore', petStoreSchema);

async function test() {
  await mongoose.connect('mongodb+srv://vet-network:vet-network-2025@cluster0.z2g7d.mongodb.net/vet-network?retryWrites=true&w=majority');
  try {
    const created = await MPetStoreModel.create({
      userId: 'some_dummy_id',
      storeName: 'Test Store',
      storeType: 'comprehensive',
      description: 'Test text',
      phone: '0100000',
      whatsapp: '010000',
      openingTime: '09:00',
      closingTime: '21:00',
      services: [],
      brands: [],
      city: 'Cairo',
      address: 'Street',
      commercialRegImageUrl: 'test_url.jpg',
      rating: 0
    });
    console.log('Success!', created._id);
    await MPetStoreModel.deleteMany({ userId: 'some_dummy_id' });
  } catch(e) {
    console.error('Database Error:', e.message);
  }
  process.exit();
}
test();
