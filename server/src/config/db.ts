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

  const remoteUri = "mongodb+srv://euphoriapetocare_db_user:2009200613@cluster0.adpudw0.mongodb.net/peto-care?appName=Cluster0";
  const localUri = 'mongodb://127.0.0.1:27017/vetapp';

  // 1. Try Remote Connection if URI exists
  if (remoteUri) {
    try {
      console.log('Attempting to connect to Remote MongoDB...');
      const conn = await mongoose.connect(remoteUri, {
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

