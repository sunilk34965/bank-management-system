import express from 'express';
import { login, registerCustomer, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', registerCustomer);
router.get('/me', protect, getMe);

export default router;
