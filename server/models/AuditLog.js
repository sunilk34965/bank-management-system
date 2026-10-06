import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  logId: { type: String, required: true, unique: true },
  performedBy: { type: String, default: 'System' },
  userEmail: { type: String, default: 'system@smartbank.com' },
  userRole: { type: String, default: 'SYSTEM' },
  action: { type: String, required: true }, // DEPOSIT, WITHDRAWAL, TRANSFER, ACCOUNT_FREEZE, CHEQUE_APPROVAL, LOGIN
  targetAccount: { type: String, default: 'N/A' },
  amount: { type: Number, default: 0 },
  details: { type: String, default: '' },
  ipAddress: { type: String, default: '127.0.0.1' },
  status: { type: String, enum: ['SUCCESS', 'FAILED', 'WARNING'], default: 'SUCCESS' },
  timestamp: { type: Date, default: Date.now }
});

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
