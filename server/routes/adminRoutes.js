import express from 'express';
import { 
  getAdminStats, 
  getStaffList,
  createStaffUser, 
  updateStaffStatus,
  resetStaffPassword,
  deleteStaffUser,
  getBranchesList,
  createBranch,
  updateBranchStatus,
  deleteBranch
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(protect, authorizeRoles('admin'));

// Stats
router.get('/stats', getAdminStats);

// Staff Management
router.get('/staff', getStaffList);
router.post('/staff', createStaffUser);
router.put('/staff/:id/status', updateStaffStatus);
router.put('/staff/:id/password', resetStaffPassword);
router.delete('/staff/:id', deleteStaffUser);

// Branch Management
router.get('/branches', getBranchesList);
router.post('/branch', createBranch);
router.put('/branches/:id/status', updateBranchStatus);
router.delete('/branches/:id', deleteBranch);

export default router;

