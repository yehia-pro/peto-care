import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

import PetGuide from './models/PetGuide';
import Disease from './models/Disease';
import { NO_PETS_CARDS_AR } from './seedData1';
import { COMMON_DISEASES_AR, RARE_DISEASES_AR } from './seedData2';

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('✅ Connected to MongoDB');

        // Seed Pet Guides
        await PetGuide.deleteMany({});
        for (const pet of NO_PETS_CARDS_AR) {
            await PetGuide.create({
                title: pet.name,
                description: pet.description,
                imageUrl: pet.image || '',
                careTips: pet.careTips || []
            });
        }
        console.log(`🌱 Seeded ${NO_PETS_CARDS_AR.length} pet guides`);

        // Seed Diseases
        await Disease.deleteMany({});
        let diseaseCount = 0;
        for (const d of COMMON_DISEASES_AR) {
            await Disease.create({
                name: d.name,
                description: d.description,
                symptoms: d.symptoms || [],
                imageUrl: d.image || '',
                isRare: false
            });
            diseaseCount++;
        }
        for (const d of RARE_DISEASES_AR) {
            await Disease.create({
                name: d.name,
                description: d.description,
                symptoms: d.symptoms || [],
                imageUrl: d.image || '',
                isRare: true
            });
            diseaseCount++;
        }
        console.log(`🌱 Seeded ${diseaseCount} diseases`);

        console.log('🚀 Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seed();
