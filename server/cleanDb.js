const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Mongoose Models
const UserSchema = new mongoose.Schema({ role: String }, { strict: false });
const PetStoreSchema = new mongoose.Schema({}, { strict: false });
const ProductSchema = new mongoose.Schema({}, { strict: false });

const MUserModel = mongoose.models.User || mongoose.model('User', UserSchema);
const MPetStoreModel = mongoose.models.PetStore || mongoose.model('PetStore', PetStoreSchema);

async function cleanDB() {
  try {
    console.log('Connecting to MongoDB...');
    // Replace with the URI or read from .env
    require('dotenv').config({ path: path.join(__dirname, '.env') });
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://vet-network:vet-network-2025@cluster0.z2g7d.mongodb.net/vet-network?retryWrites=true&w=majority');
    console.log('Connected to MongoDB.');

    // 1. Delete all petstore users and vet users to start fresh if needed, but definitely petstores.
    const deletedSt = await MPetStoreModel.deleteMany({});
    console.log(`Deleted ${deletedSt.deletedCount} store documents from MongoDB`);

    const deletedUsers = await MUserModel.deleteMany({ role: { $in: ['petstore'] } });
    console.log(`Deleted ${deletedUsers.deletedCount} petstore users from MongoDB`);

    console.log('Cleaning local JSON files...');
    const dataDir = path.join(__dirname, '../data');
    
    // Clean stores.json
    const storesPath = path.join(dataDir, 'stores.json');
    if (fs.existsSync(storesPath)) {
       fs.writeFileSync(storesPath, JSON.stringify([]));
       console.log('Cleared stores.json');
    }
    
    // Clean products.json
    const productsPath = path.join(dataDir, 'products.json');
    if (fs.existsSync(productsPath)) {
       fs.writeFileSync(productsPath, JSON.stringify([]));
       console.log('Cleared products.json');
    }
    
    // Remove petstores from users.json
    const usersPath = path.join(dataDir, 'users.json');
    if (fs.existsSync(usersPath)) {
       let users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
       const countBefore = users.length;
       users = users.filter(u => u.role !== 'petstore');
       fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
       console.log(`Cleaned ${countBefore - users.length} petstore users from users.json`);
    }

    console.log('Done cleaning!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

cleanDB();
