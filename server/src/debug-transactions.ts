
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const checkTransactions = async () => {
    try {
        console.log('Connecting to DB...');
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined');
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Dynamically import the model to test the exact file logic
        // We use require to mimic how it might be loaded or just import it if we were in a module system properly.
        // But since this is a standalone script, let's try to import specifically.

        // Note: In a real ts-node execution, we might need to point to the .ts file or .js if compiled.
        // Assuming we run this with ts-node.

        const Transaction = (await import('./models/Transaction')).default;

        console.log('Transaction Model:', Transaction);

        if (!Transaction) {
            console.error('Transaction model is undefined!');
            return;
        }

        const count = await Transaction.countDocuments();
        console.log('Transaction count:', count);

        const transactions = await Transaction.find().limit(5).populate('userId', 'fullName email'); // Removed lean() to see if that's an issue with types, but lean() is fine.
        console.log('Transactions sample:', JSON.stringify(transactions, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkTransactions();
