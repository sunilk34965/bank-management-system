import express from 'express';
import { 
  getManagerDashboard, 
  getCustomersList, 
  toggleAccountFreeze, 
  updateAccountApprovalStatus,
  updateChequeBookStatus, 
  getAuditLogs,
  getApprovalRequests,
  processApprovalAction,
  submitChequeForClearance
} from '../controllers/managerController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(protect, authorizeRoles('manager', 'admin'));

router.get('/dashboard', getManagerDashboard);
router.get('/customers', getCustomersList);
router.post('/account/freeze', toggleAccountFreeze);
router.post('/account/approval', updateAccountApprovalStatus);
router.post('/cheque/status', updateChequeBookStatus);
router.get('/audit-logs', getAuditLogs);

// Approval & Check Requests
router.get('/approvals', getApprovalRequests);
router.post('/approvals/action', processApprovalAction);
router.post('/approvals/create-cheque', submitChequeForClearance);

export default router;
