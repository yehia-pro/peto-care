import mongoose from 'mongoose';

// Initialize connection state
let isConnected = false;

/**
 * Connect to MongoDB
 */
export const connectMongo = async () => {
  // Return if already connected
  if (isConnected) {
    console.log('Using existing MongoDB connection');
    return mongoose;
  }

  const remoteUri = process.env.MONGODB_URI;
  const localUri = process.env.LOCAL_MONGODB_URI || 'mongodb://127.0.0.1:27017/vetapp';

  if (remoteUri) {
    try {
      console.log(`[DEBUG] remoteUri length is ${remoteUri?.length}, ends with Cluster0? ${remoteUri?.endsWith('Cluster0')}`);
      console.log('Attempting to connect to Remote MongoDB...');
      const conn = await mongoose.connect(remoteUri.trim(), {
        serverSelectionTimeoutMS: 5000,
      });
      isConnected = true;
      console.log('✅ Connected to Remote MongoDB');
      return conn;
    } catch (error: any) {
      console.warn('⚠️ Remote MongoDB connection failed:', error.message || error);
      console.log('🔄 Falling back to Local MongoDB...');
    }
  }

  // 2. Try Local Connection (Fallback or Default)
  try {
    const conn = await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log('✅ Connected to Local MongoDB');
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error (Remote & Local failed):', error);
    throw error;
  }
};

