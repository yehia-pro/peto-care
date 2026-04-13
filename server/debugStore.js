const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vet-network:vet-network-2025@cluster0.z2g7d.mongodb.net/vet-network?retryWrites=true&w=majority';

async function checkDetails() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB\n');
  const db = mongoose.connection.db;

  // Get the user
  const user = await db.collection('users').findOne({ email: 'demo_store@example.local' });
  console.log('=== USER ===');
  console.log('_id:', user._id.toString());
  console.log('role:', user.role);
  console.log('isApproved:', user.isApproved);

  // Get the petstore
  const store = await db.collection('petstores').findOne({ userId: user._id.toString() });
  console.log('\n=== PETSTORE (search by userId string) ===');
  if (store) {
    console.log('Found! _id:', store._id.toString());
    console.log('userId in store:', store.userId);
    console.log('userId matches?:', store.userId === user._id.toString());
    console.log('storeName:', store.storeName);
  } else {
    console.log('❌ NOT FOUND by userId string');
    // Try any store
    const anyStore = await db.collection('petstores').findOne({});
    if (anyStore) {
      console.log('First store in collection:', anyStore.userId, '| type:', typeof anyStore.userId);
    }
  }

  process.exit(0);
}

checkDetails().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
