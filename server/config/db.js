import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export let isMemoryFallback = false;

export const setMemoryFallback = (val) => {
  isMemoryFallback = val;
};

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2500, // Timeout fast if local mongo server isn't running
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`MongoDB Connection Warning: ${error.message}`);
    console.log('Falling back to SmartBank Hybrid Storage Mode (In-Memory + File Persistence)...');
    isMemoryFallback = true;
  }
};
