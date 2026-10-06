import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import Chequebook from '../models/Chequebook.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import Branch from '../models/Branch.js';
import ApprovalRequest from '../models/ApprovalRequest.js';
import { isMemoryFallback, setMemoryFallback } from '../config/db.js';

export const memoryStore = {
  users: [],
  accounts: [],
  transactions: [],
  chequebooks: [],
  payments: [],
  notifications: [],
  auditLogs: [],
  branches: [],
  approvalRequests: []
};

export const initializeSeedData = async () => {
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const managerPassword = await bcrypt.hash('manager123', salt);
  const cashierPassword = await bcrypt.hash('cashier123', salt);
  const customerPassword = await bcrypt.hash('customer123', salt);

  const branches = [
    {
      _id: 'br_001',
      branchId: 'BR001',
      branchName: 'SmartBank Central Branch (Mumbai)',
      branchCode: 'SMRT001',
      IFSCcode: 'SMRT0000101',
      address: 'Plot 42, Nariman Point, Financial District, Mumbai',
      phone: '+91 22 4910 8800',
      status: 'ACTIVE'
    },
    {
      _id: 'br_002',
      branchId: 'BR002',
      branchName: 'SmartBank Tech City Branch (Bengaluru)',
      branchCode: 'SMRT002',
      IFSCcode: 'SMRT0000102',
      address: '100 Feet Road, Indiranagar, Bengaluru',
      phone: '+91 80 2520 9900',
      status: 'ACTIVE'
    }
  ];

  const users = [
    {
      _id: 'usr_admin',
      name: 'System Administrator',
      email: 'admin@smartbank.com',
      phone: '+91 98765 00001',
      password: adminPassword,
      role: 'admin',
      address: 'Headquarters, Mumbai',
      status: 'active',
      createdAt: new Date('2025-01-01')
    },
    {
      _id: 'usr_manager',
      name: 'Rajesh Malhotra (Branch Manager)',
      email: 'manager@smartbank.com',
      phone: '+91 98765 00002',
      password: managerPassword,
      role: 'manager',
      address: 'Central Branch, Mumbai',
      status: 'active',
      createdAt: new Date('2025-01-05')
    },
    {
      _id: 'usr_cashier',
      name: 'Sneha Kulkarni (Senior Cashier)',
      email: 'cashier@smartbank.com',
      phone: '+91 98765 00003',
      password: cashierPassword,
      role: 'cashier',
      address: 'Counter #3, Central Branch, Mumbai',
      status: 'active',
      createdAt: new Date('2025-01-10')
    },
    {
      _id: 'usr_customer1',
      name: 'Rahul Sharma',
      email: 'customer@smartbank.com',
      phone: '+91 98201 12345',
      password: customerPassword,
      role: 'customer',
      address: 'Flat 402, Skyline Towers, Andheri East, Mumbai',
      status: 'active',
      createdAt: new Date('2025-02-01')
    },
    {
      _id: 'usr_customer2',
      name: 'Priya Patel',
      email: 'priya@smartbank.com',
      phone: '+91 98922 54321',
      password: customerPassword,
      role: 'customer',
      address: 'B-12, Palm Grove, Bandra West, Mumbai',
      status: 'active',
      createdAt: new Date('2025-02-10')
    },
    {
      _id: 'usr_customer3',
      name: 'Amit Verma',
      email: 'amit@smartbank.com',
      phone: '+91 97110 88776',
      password: customerPassword,
      role: 'customer',
      address: '77 Cyber City, Gurugram',
      status: 'active',
      createdAt: new Date('2025-02-15')
    }
  ];

  const accounts = [
    {
      _id: 'acc_001',
      accountNumber: '601928374651',
      userId: 'usr_customer1',
      accountType: 'Savings',
      balance: 125500,
      branchId: 'BR001',
      status: 'active',
      openedAt: new Date('2025-02-01')
    },
    {
      _id: 'acc_002',
      accountNumber: '609876543210',
      userId: 'usr_customer2',
      accountType: 'Current',
      balance: 480000,
      branchId: 'BR001',
      status: 'active',
      openedAt: new Date('2025-02-10')
    },
    {
      _id: 'acc_003',
      accountNumber: '605432109876',
      userId: 'usr_customer3',
      accountType: 'Savings',
      balance: 45000,
      branchId: 'BR002',
      status: 'active',
      openedAt: new Date('2025-02-15')
    }
  ];

  const transactions = [
    {
      _id: 'txn_001',
      transactionId: 'TXN98273401',
      accountId: 'acc_001',
      accountNumber: '601928374651',
      type: 'DEPOSIT',
      amount: 50000,
      balanceBefore: 0,
      balanceAfter: 50000,
      description: 'Initial Account Opening Cash Deposit',
      performedByName: 'Sneha Kulkarni (Cashier)',
      paymentMethod: 'CASH',
      createdAt: new Date('2026-08-15T10:30:00')
    },
    {
      _id: 'txn_002',
      transactionId: 'TXN98273402',
      accountId: 'acc_001',
      accountNumber: '601928374651',
      type: 'DEPOSIT',
      amount: 78000,
      balanceBefore: 50000,
      balanceAfter: 128000,
      description: 'Salary Credit - TechCorp Solutions',
      performedByName: 'System NEFT',
      paymentMethod: 'ONLINE',
      createdAt: new Date('2026-08-25T09:15:00')
    },
    {
      _id: 'txn_003',
      transactionId: 'TXN98273403',
      accountId: 'acc_001',
      accountNumber: '601928374651',
      type: 'PAYMENT',
      amount: 2500,
      balanceBefore: 128000,
      balanceAfter: 125500,
      description: 'Electricity Bill Payment - Adani Electricity',
      performedByName: 'Rahul Sharma',
      paymentMethod: 'ONLINE',
      createdAt: new Date('2026-08-31T14:20:00')
    },
    {
      _id: 'txn_004',
      transactionId: 'TXN98273404',
      accountId: 'acc_001',
      accountNumber: '601928374651',
      type: 'DEPOSIT',
      amount: 10000,
      balanceBefore: 115500,
      balanceAfter: 125500,
      description: 'Cash Deposit at Counter #3',
      performedByName: 'Sneha Kulkarni (Cashier)',
      paymentMethod: 'CASH',
      createdAt: new Date('2026-09-01T11:05:00')
    },
    {
      _id: 'txn_005',
      transactionId: 'TXN98273405',
      accountId: 'acc_002',
      accountNumber: '609876543210',
      type: 'DEPOSIT',
      amount: 500000,
      balanceBefore: 0,
      balanceAfter: 500000,
      description: 'Business Current Account Opening',
      performedByName: 'Sneha Kulkarni (Cashier)',
      paymentMethod: 'CHEQUE',
      createdAt: new Date('2026-08-10T11:00:00')
    },
    {
      _id: 'txn_006',
      transactionId: 'TXN98273406',
      accountId: 'acc_002',
      accountNumber: '609876543210',
      type: 'WITHDRAW',
      amount: 20000,
      balanceBefore: 500000,
      balanceAfter: 480000,
      description: 'Branch ATM Cash Withdrawal',
      performedByName: 'Priya Patel',
      paymentMethod: 'ATM',
      createdAt: new Date('2026-09-02T16:45:00')
    }
  ];

  const chequebooks = [
    {
      _id: 'chq_001',
      chequeBookId: 'CHQ881920',
      userId: 'usr_customer1',
      accountId: 'acc_001',
      accountNumber: '601928374651',
      customerName: 'Rahul Sharma',
      totalLeaves: 25,
      usedLeaves: 7,
      remainingLeaves: 18,
      status: 'approved',
      requestedAt: new Date('2026-08-10'),
      approvedAt: new Date('2026-08-11')
    },
    {
      _id: 'chq_002',
      chequeBookId: 'CHQ881921',
      userId: 'usr_customer2',
      accountId: 'acc_002',
      accountNumber: '609876543210',
      customerName: 'Priya Patel',
      totalLeaves: 50,
      usedLeaves: 0,
      remainingLeaves: 50,
      status: 'pending',
      requestedAt: new Date('2026-09-03T10:00:00')
    }
  ];

  const payments = [
    {
      _id: 'pay_001',
      paymentId: 'PAY77281',
      userId: 'usr_customer1',
      accountId: 'acc_001',
      accountNumber: '601928374651',
      category: 'Electricity',
      merchantName: 'Adani Electricity Mumbai',
      consumerNumber: '102938475',
      amount: 2500,
      status: 'SUCCESS',
      referenceNo: 'REF9928172',
      createdAt: new Date('2026-08-31T14:20:00')
    }
  ];

  const notifications = [
    {
      _id: 'notif_001',
      userId: 'usr_customer1',
      title: 'Cash Deposit Successful',
      message: '₹10,000 deposited successfully into account XXXX4651 at Central Branch.',
      type: 'success',
      read: false,
      createdAt: new Date('2026-09-01T11:06:00')
    },
    {
      _id: 'notif_002',
      userId: 'usr_customer1',
      title: 'Cheque Book Approved',
      message: 'Your 25-leaf cheque book request has been approved by the Branch Manager.',
      type: 'info',
      read: true,
      createdAt: new Date('2026-08-11T12:00:00')
    }
  ];

  const auditLogs = [
    {
      _id: 'aud_001',
      logId: 'AUD1001',
      performedBy: 'Sneha Kulkarni',
      userEmail: 'cashier@smartbank.com',
      userRole: 'CASHIER',
      action: 'DEPOSIT',
      targetAccount: '601928374651',
      amount: 10000,
      details: 'Cash deposit confirmed at counter #3',
      ipAddress: '192.168.1.45',
      status: 'SUCCESS',
      timestamp: new Date('2026-09-01T11:05:00')
    },
    {
      _id: 'aud_002',
      logId: 'AUD1002',
      performedBy: 'Rajesh Malhotra',
      userEmail: 'manager@smartbank.com',
      userRole: 'MANAGER',
      action: 'CHEQUE_APPROVAL',
      targetAccount: '601928374651',
      amount: 0,
      details: 'Approved 25-leaf Cheque Book for Rahul Sharma',
      ipAddress: '192.168.1.10',
      status: 'SUCCESS',
      timestamp: new Date('2026-08-11T12:00:00')
    }
  ];

  const approvalRequests = [
    {
      _id: 'req_001',
      requestId: 'CHK-9021',
      type: 'CHEQUE_CLEARANCE',
      customerName: 'Rahul Sharma',
      customerEmail: 'customer@smartbank.com',
      accountNumber: '601928374651',
      chequeNumber: 'CHQ-882104',
      payeeName: 'Global Enterprises Ltd.',
      amount: 45000,
      reason: 'Vendor payment clearing for hardware procurement',
      status: 'pending',
      createdAt: new Date('2026-10-01T10:15:00')
    },
    {
      _id: 'req_002',
      requestId: 'TRF-4022',
      type: 'TRANSFER_APPROVAL',
      customerName: 'Priya Patel',
      customerEmail: 'priya@smartbank.com',
      accountNumber: '609876543210',
      toAccountNumber: '601928374651',
      amount: 120000,
      reason: 'High-value commercial contract settlement',
      status: 'pending',
      createdAt: new Date('2026-10-02T09:30:00')
    },
    {
      _id: 'req_003',
      requestId: 'WDR-3023',
      type: 'WITHDRAWAL_APPROVAL',
      customerName: 'Amit Verma',
      customerEmail: 'amit@smartbank.com',
      accountNumber: '605432109876',
      amount: 75000,
      reason: 'Emergency cash withdrawal exceeding counter teller limit',
      status: 'pending',
      createdAt: new Date('2026-10-02T11:45:00')
    },
    {
      _id: 'req_004',
      requestId: 'CBK-5024',
      type: 'CHEQUE_BOOK',
      customerName: 'Rahul Sharma',
      customerEmail: 'customer@smartbank.com',
      accountNumber: '601928374651',
      leaves: 50,
      reason: 'Commercial Cheque Book - 50 Leaves',
      status: 'pending',
      createdAt: new Date('2026-10-02T13:20:00')
    },
    {
      _id: 'req_005',
      requestId: 'CHK-9019',
      type: 'CHEQUE_CLEARANCE',
      customerName: 'Priya Patel',
      customerEmail: 'priya@smartbank.com',
      accountNumber: '609876543210',
      chequeNumber: 'CHQ-772910',
      payeeName: 'Metro Infotech Services',
      amount: 32000,
      reason: 'Office maintenance advance cleared',
      status: 'approved',
      reviewedBy: 'Rajesh Malhotra (Branch Manager)',
      reviewNotes: 'Verified signature and drawer sufficient funds',
      reviewedAt: new Date('2026-09-30T16:00:00'),
      createdAt: new Date('2026-09-30T14:00:00')
    }
  ];

  // Populate memoryStore
  memoryStore.users = users;
  memoryStore.accounts = accounts;
  memoryStore.transactions = transactions;
  memoryStore.chequebooks = chequebooks;
  memoryStore.payments = payments;
  memoryStore.notifications = notifications;
  memoryStore.auditLogs = auditLogs;
  memoryStore.branches = branches;
  memoryStore.approvalRequests = approvalRequests;

  // Sync to MongoDB if connected
  if (!isMemoryFallback) {
    try {
      const adminUser = await User.findOne({ email: 'admin@smartbank.com' });
      if (!adminUser) {
        console.log('Seeding MongoDB database with initial SmartBank datasets...');
        await Branch.deleteMany({});
        await User.deleteMany({});
        await Account.deleteMany({});
        await Transaction.deleteMany({});
        await Chequebook.deleteMany({});
        await Payment.deleteMany({});
        await Notification.deleteMany({});
        await AuditLog.deleteMany({});
        await ApprovalRequest.deleteMany({});

        await Branch.insertMany(branches);
        await User.insertMany(users);
        await Account.insertMany(accounts);
        await Transaction.insertMany(transactions);
        await Chequebook.insertMany(chequebooks);
        await Payment.insertMany(payments);
        await Notification.insertMany(notifications);
        await AuditLog.insertMany(auditLogs);
        await ApprovalRequest.insertMany(approvalRequests);
        console.log('MongoDB Database Seeded Successfully!');
      } else {
        const reqCount = await ApprovalRequest.countDocuments();
        if (reqCount === 0) {
          await ApprovalRequest.insertMany(approvalRequests);
          console.log('ApprovalRequest collection seeded with sample data.');
        }
        console.log('MongoDB Database already seeded with admin user.');
      }
    } catch (err) {
      console.log('MongoDB Seed Note:', err.message, '- Active in Hybrid In-Memory storage mode.');
      setMemoryFallback(true);
    }
  }
};
