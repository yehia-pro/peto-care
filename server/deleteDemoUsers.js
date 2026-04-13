const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vet-network:vet-network-2025@cluster0.z2g7d.mongodb.net/vet-network?retryWrites=true&w=majority';

async function deleteDemos() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!\n');

    const db = mongoose.connection.db;
    const demoEmails = [
      'demo_store@example.local',
      'demo_vet@example.local',
      'demo_user@example.local'
    ];

    // Find and show what we're about to delete
    const found = await db.collection('users').find({ email: { $in: demoEmails } }).toArray();
    if (found.length === 0) {
      console.log('No demo users found in MongoDB.');
    } else {
      console.log('Found demo users to delete:');
      found.forEach(u => console.log(` - ${u.email} | role: ${u.role} | _id: ${u._id}`));
    }

    // Delete demo users
    const userResult = await db.collection('users').deleteMany({ email: { $in: demoEmails } });
    console.log(`\nDeleted ${userResult.deletedCount} user(s).`);

    // Delete all petstore docs linked to demo users (by userId)
    const demoIds = found.map(u => u._id.toString());
    if (demoIds.length > 0) {
      const storeResult = await db.collection('petstores').deleteMany({ userId: { $in: demoIds } });
      console.log(`Deleted ${storeResult.deletedCount} petstore document(s).`);
    }

    // Also clean any leftover petstore by store name
    const byName = await db.collection('petstores').deleteMany({ storeName: 'متجر تجريبي' });
    console.log(`Deleted ${byName.deletedCount} stores named 'متجر تجريبي'.`);

    // Clean local JSON file too
    const fs = require('fs');
    const path = require('path');
    const usersJsonPath = path.join(__dirname, 'data', 'users.json');
    if (fs.existsSync(usersJsonPath)) {
      let users = JSON.parse(fs.readFileSync(usersJsonPath, 'utf8'));
      const before = users.length;
      users = users.filter(u => !demoEmails.includes(u.email));
      fs.writeFileSync(usersJsonPath, JSON.stringify(users, null, 2));
      console.log(`\nRemoved ${before - users.length} demo user(s) from local users.json`);
    }

    console.log('\n✅ Done! All demo data removed.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

deleteDemos();
