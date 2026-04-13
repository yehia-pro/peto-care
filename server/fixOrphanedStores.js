const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vet-network:vet-network-2025@cluster0.z2g7d.mongodb.net/vet-network?retryWrites=true&w=majority';

const userSchema = new mongoose.Schema({}, { strict: false });
const storeSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', userSchema, 'users');
const PetStore = mongoose.models.PetStore || mongoose.model('PetStore', storeSchema, 'petstores');

async function fixOrphanedStores() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB\n');

  // Find all approved petstore users
  const approvedPetstoreUsers = await User.find({ role: 'petstore', isApproved: true }).lean();
  console.log(`Found ${approvedPetstoreUsers.length} approved petstore user(s):\n`);

  for (const user of approvedPetstoreUsers) {
    const userId = user._id.toString();
    const existing = await PetStore.findOne({ userId }).lean();

    console.log(`User: ${user.email} (${userId})`);
    console.log(`  isApproved: ${user.isApproved}`);
    console.log(`  PetStore exists: ${!!existing}`);

    if (!existing) {
      console.log(`  ⚠️  No PetStore found - creating one now...`);

      let contact = {};
      try {
        contact = typeof user.contact === 'string' ? JSON.parse(user.contact) : (user.contact || {});
      } catch (_) {}

      const placeholder = 'https://placehold.co/600x400';
      try {
        const created = await PetStore.create({
          userId,
          storeName: contact.storeName || user.storeName || user.fullName || 'متجر جديد',
          storeType: contact.storeType || 'comprehensive',
          description: contact.description || '',
          phone: user.phone || contact.phone || '',
          whatsapp: contact.whatsapp || '',
          openingTime: contact.openingTime || '09:00',
          closingTime: contact.closingTime || '21:00',
          services: Array.isArray(contact.services)
            ? contact.services
            : (typeof contact.services === 'string' && contact.services
                ? contact.services.split(',').map(s => s.trim()).filter(Boolean)
                : []),
          brands: Array.isArray(contact.brands)
            ? contact.brands
            : (typeof contact.brands === 'string' && contact.brands
                ? contact.brands.split(',').map(b => b.trim()).filter(Boolean)
                : []),
          city: contact.city || '',
          address: contact.address || '',
          commercialRegImageUrl: user.commercialRegImageUrl || placeholder,
          rating: 0
        });
        console.log(`  ✅ PetStore created! ID: ${created._id}\n`);
      } catch (e) {
        console.error(`  ❌ Failed to create PetStore: ${e.message}\n`);
      }
    } else {
      console.log(`  ✅ PetStore already exists (ID: ${existing._id})\n`);
    }
  }

  // Also show all unapproved petstore users
  const pendingUsers = await User.find({ role: 'petstore', isApproved: false }).lean();
  if (pendingUsers.length > 0) {
    console.log(`\n📋 Pending (unapproved) petstore users:`);
    pendingUsers.forEach(u => console.log(`  - ${u.email} (${u._id})`));
  }

  console.log('\n✅ Done!');
  process.exit(0);
}

fixOrphanedStores().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
