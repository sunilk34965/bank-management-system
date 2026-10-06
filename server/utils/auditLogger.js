import AuditLog from '../models/AuditLog.js';
import { isMemoryFallback } from '../config/db.js';
import { memoryStore } from '../services/seedService.js';

export const logAudit = async ({
  performedBy = 'System',
  userEmail = 'system@smartbank.com',
  userRole = 'SYSTEM',
  action,
  targetAccount = 'N/A',
  amount = 0,
  details = '',
  ipAddress = '127.0.0.1',
  status = 'SUCCESS'
}) => {
  const logId = 'AUD' + Date.now() + Math.floor(Math.random() * 100);
  const logData = {
    logId,
    performedBy,
    userEmail,
    userRole,
    action,
    targetAccount,
    amount,
    details,
    ipAddress,
    status,
    timestamp: new Date()
  };

  try {
    if (isMemoryFallback) {
      memoryStore.auditLogs.unshift(logData);
    } else {
      await AuditLog.create(logData);
    }
  } catch (err) {
    console.error('Failed to record audit log:', err.message);
    memoryStore.auditLogs.unshift(logData);
  }
};
