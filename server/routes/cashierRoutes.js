import express from 'express';
import { verifyCustomerAccount, getCustomerAccounts, depositCash, withdrawCash, getCashierSummary } from '../controllers/cashierController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(protect, authorizeRoles('cashier', 'manager', 'admin'));

router.get('/verify', verifyCustomerAccount);
router.get('/customers', getCustomerAccounts);
router.post('/deposit', depositCash);
router.post('/withdraw', withdrawCash);
router.get('/summary', getCashierSummary);

export default router;
