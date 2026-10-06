import express from 'express';
import { 
  transferMoney, 
  processPayment, 
  requestChequeBook, 
  getChequeBookStatus,
  deleteTransaction,
  deleteSelectedTransactions
} from '../controllers/transactionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.post('/transfer', protect, authorizeRoles('customer'), transferMoney);
router.post('/payment', protect, authorizeRoles('customer'), processPayment);
router.post('/chequebook/request', protect, authorizeRoles('customer'), requestChequeBook);
router.get('/chequebook/status', protect, authorizeRoles('customer'), getChequeBookStatus);
router.post('/delete-selected', protect, authorizeRoles('customer'), deleteSelectedTransactions);
router.delete('/:id', protect, authorizeRoles('customer'), deleteTransaction);

export default router;
