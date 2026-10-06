import mongoose from 'mongoose';

const approvalRequestSchema = new mongoose.Schema({
  _id: { type: String, default: () => 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) },
  requestId: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ['CHEQUE_CLEARANCE', 'CHEQUE_BOOK', 'TRANSFER_APPROVAL', 'WITHDRAWAL_APPROVAL'],
    required: true
  },
  customerName: { type: String, required: true },
  customerEmail: { type: String, default: '' },
  accountNumber: { type: String, required: true },
  toAccountNumber: { type: String, default: '' },
  chequeNumber: { type: String, default: '' },
  payeeName: { type: String, default: '' },
  amount: { type: Number, default: 0 },
  leaves: { type: Number, default: 25 },
  reason: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: { type: String, default: '' },
  reviewNotes: { type: String, default: '' },
  reviewedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const ApprovalRequest = mongoose.models.ApprovalRequest || mongoose.model('ApprovalRequest', approvalRequestSchema);
export default ApprovalRequest;
