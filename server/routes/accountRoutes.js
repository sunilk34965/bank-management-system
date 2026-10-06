import express from 'express';
import { 
  getCustomerPassbook, 
  getAccountDetails,
  lookupBeneficiary,
  getSuggestedBeneficiaries
} from '../controllers/accountController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.get('/me', protect, getAccountDetails);
router.get('/passbook', protect, authorizeRoles('customer', 'manager'), getCustomerPassbook);
router.get('/beneficiary/:accountNumber', protect, lookupBeneficiary);
router.get('/suggested-beneficiaries', protect, getSuggestedBeneficiaries);

export default router;
