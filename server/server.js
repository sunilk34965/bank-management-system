import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, isMemoryFallback } from './config/db.js';
import { initializeSeedData } from './services/seedService.js';

import authRoutes from './routes/authRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import cashierRoutes from './routes/cashierRoutes.js';
import managerRoutes from './routes/managerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/cashier', cashierRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/admin', adminRoutes);

// Database Status & Health Check
app.get('/api/health', async (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;
  const collections = {};
  if (isMongoConnected) {
    try {
      const cols = await mongoose.connection.db.listCollections().toArray();
      for (const col of cols) {
        collections[col.name] = await mongoose.connection.db.collection(col.name).countDocuments();
      }
    } catch (e) {
      collections.error = e.message;
    }
  }

  res.json({
    status: 'ONLINE',
    service: 'SmartBank Banking System API',
    database: {
      provider: 'MongoDB',
      connected: isMongoConnected,
      host: mongoose.connection.host || 'localhost',
      port: mongoose.connection.port || 27017,
      name: mongoose.connection.name || 'smartbank_db',
      mode: isMongoConnected && !isMemoryFallback ? 'MongoDB Live Database (Connected)' : 'Hybrid In-Memory Fallback',
      collections
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/db-status', (req, res) => {
  res.redirect('/api/health');
});

// Root route
app.get('/', (req, res) => {
  res.send('🏦 SmartBank Banking Management System API Server is Running');
});

// Start Server
const startServer = async () => {
  await connectDB();
  await initializeSeedData();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🏦 SmartBank Server running on port ${PORT} (0.0.0.0)`);
    console.log(`📡 API Endpoint: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
};

startServer();
