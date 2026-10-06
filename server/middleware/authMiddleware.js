import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { memoryStore } from '../services/seedService.js';
import { isMemoryFallback } from '../config/db.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
  }

  // Handle demo token format (e.g. demo_token_customer@smartbank.com or demo_token_...)
  if (token.startsWith('demo_token_')) {
    const demoEmail = token.replace('demo_token_', '').toLowerCase().trim();
    let user;
    if (isMemoryFallback) {
      user = memoryStore.users.find(u => u.email.toLowerCase() === demoEmail) ||
             memoryStore.users.find(u => u.role === 'customer') ||
             memoryStore.users[0];
    } else {
      user = await User.findOne({ email: demoEmail }) || await User.findOne({ role: 'customer' });
    }
    if (user) {
      req.user = user;
      return next();
    }
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smartbank_jwt_secret_key_2026_secure_bank_app');
    
    if (isMemoryFallback) {
      const user = memoryStore.users.find(u => u._id === decoded.id || u.email === decoded.email);
      if (!user) {
        return res.status(401).json({ success: false, message: 'User account not found' });
      }
      req.user = user;
    } else {
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'User account not found' });
      }
      req.user = user;
    }
    
    next();
  } catch (error) {
    // If token verification fails, check if it's a demo token as fallback
    if (token && token.startsWith('demo_token_')) {
      const demoEmail = token.replace('demo_token_', '').toLowerCase().trim();
      let user;
      if (isMemoryFallback) {
        user = memoryStore.users.find(u => u.email.toLowerCase() === demoEmail) || memoryStore.users[0];
      } else {
        user = await User.findOne({ email: demoEmail });
      }
      if (user) {
        req.user = user;
        return next();
      }
    }
    return res.status(401).json({ success: false, message: 'Token invalid or expired', error: error.message });
  }
};
