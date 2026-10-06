import User from '../models/User.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import Chequebook from '../models/Chequebook.js';
import AuditLog from '../models/AuditLog.js';
import ApprovalRequest from '../models/ApprovalRequest.js';
import Notification from '../models/Notification.js';
import { isMemoryFallback } from '../config/db.js';
import { memoryStore } from '../services/seedService.js';
import { generateTransactionId } from '../utils/accountGenerator.js';
import { logAudit } from '../utils/auditLogger.js';

export const getManagerDashboard = async (req, res) => {
  try {
    let users = [], accounts = [], txns = [], chequeRequests = [];

    if (isMemoryFallback) {
      users = memoryStore.users;
      accounts = memoryStore.accounts;
      txns = memoryStore.transactions;
      chequeRequests = memoryStore.chequebooks;
    } else {
      users = await User.find();
      accounts = await Account.find();
      txns = await Transaction.find();
      chequeRequests = await Chequebook.find();
    }

    const customerUsers = users.filter(u => u.role === 'customer');
    const totalCustomers = customerUsers.length;
    const activeAccountsList = accounts.filter(a => a.status === 'active');

    const totalDeposits = txns
      .filter(t => t.type === 'DEPOSIT')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalWithdrawals = txns
      .filter(t => t.type === 'WITHDRAW')
      .reduce((acc, t) => acc + t.amount, 0);

    const pendingCheques = chequeRequests.filter(c => c.status === 'pending');
    const pendingAccounts = accounts.filter(a => a.status === 'pending');

    // Build rich customer details list
    const customersList = customerUsers.map(user => {
      const acc = accounts.find(a => a.userId === user._id || a.userId.toString() === user._id.toString());
      return {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        accountNumber: acc ? acc.accountNumber : 'N/A',
        balance: acc ? acc.balance : 0,
        accountType: acc ? acc.accountType : 'Savings',
        openedAt: user.createdAt
      };
    });

    // Build rich active accounts list
    const enrichedActiveAccounts = activeAccountsList.map(acc => {
      const u = users.find(usr => usr._id === acc.userId || usr._id.toString() === acc.userId.toString());
      return {
        _id: acc._id,
        accountNumber: acc.accountNumber,
        customerName: u ? u.name : 'Valued Customer',
        customerEmail: u ? u.email : '',
        accountType: acc.accountType,
        balance: acc.balance,
        status: acc.status,
        openedAt: acc.openedAt
      };
    });

    // Build unified pending approvals list
    const pendingApprovals = [
      ...pendingAccounts.map(acc => {
        const u = users.find(usr => usr._id === acc.userId || usr._id.toString() === acc.userId.toString());
        return {
          id: acc._id,
          accountNumber: acc.accountNumber,
          type: 'ACCOUNT_APPROVAL',
          title: 'New Account Opening Request',
          customerName: u ? u.name : 'Applicant',
          accountType: acc.accountType,
          details: `Initial Deposit: ₹${acc.balance}`,
          requestedAt: acc.openedAt
        };
      }),
      ...pendingCheques.map(c => ({
        id: c._id || c.chequeBookId,
        chequeBookId: c.chequeBookId,
        type: 'CHEQUE_REQUEST',
        title: 'Cheque Book Application',
        customerName: c.customerName,
        accountNumber: c.accountNumber,
        details: `${c.totalLeaves} Leaves Cheque Book`,
        requestedAt: c.requestedAt
      }))
    ];

    // Monthly Analytics Mock Data / Grouped
    const analytics = [
      { month: 'Apr', deposits: 420000, withdrawals: 280000, transfers: 150000 },
      { month: 'May', deposits: 510000, withdrawals: 310000, transfers: 210000 },
      { month: 'Jun', deposits: 680000, withdrawals: 420000, transfers: 290000 },
      { month: 'Jul', deposits: 740000, withdrawals: 490000, transfers: 340000 },
      { month: 'Aug', deposits: 890000, withdrawals: 530000, transfers: 410000 },
      { month: 'Sep', deposits: totalDeposits, withdrawals: totalWithdrawals, transfers: 380000 }
    ];

    res.json({
      success: true,
      stats: {
        totalCustomers,
        activeAccounts: activeAccountsList.length,
        totalDeposits,
        totalWithdrawals,
        pendingChequesCount: pendingCheques.length,
        pendingApprovalsCount: pendingApprovals.length
      },
      analytics,
      customersList,
      activeAccountsList: enrichedActiveAccounts,
      pendingApprovals,
      pendingCheques,
      recentTransactions: txns.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomersList = async (req, res) => {
  try {
    let users = [], accounts = [];
    if (isMemoryFallback) {
      users = memoryStore.users.filter(u => u.role === 'customer');
      accounts = memoryStore.accounts;
    } else {
      users = await User.find({ role: 'customer' });
      accounts = await Account.find();
    }

    const customerList = users.map(user => {
      const acc = accounts.find(a => a.userId === user._id || a.userId.toString() === user._id.toString());
      return {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        accountNumber: acc ? acc.accountNumber : 'N/A',
        balance: acc ? acc.balance : 0,
        accountType: acc ? acc.accountType : 'Savings',
        openedAt: user.createdAt
      };
    });

    res.json({ success: true, customers: customerList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleAccountFreeze = async (req, res) => {
  try {
    const { accountNumber, status } = req.body; // status: 'active' or 'frozen'
    if (!accountNumber || !status) {
      return res.status(400).json({ success: false, message: 'Account number and status required' });
    }

    let account, user;
    if (isMemoryFallback) {
      account = memoryStore.accounts.find(a => a.accountNumber === accountNumber);
      if (account) {
        account.status = status;
        user = memoryStore.users.find(u => u._id === account.userId || u._id.toString() === account.userId.toString());
        if (user) user.status = status;
      }
    } else {
      account = await Account.findOne({ accountNumber });
      if (account) {
        account.status = status;
        await account.save();
        user = await User.findById(account.userId);
        if (user) {
          user.status = status;
          await user.save();
        }
      }
    }

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    await logAudit({
      performedBy: req.user.name,
      userEmail: req.user.email,
      userRole: 'MANAGER',
      action: status === 'frozen' ? 'FREEZE_ACCOUNT' : 'UNFREEZE_ACCOUNT',
      targetAccount: accountNumber,
      details: `Manager ${status === 'frozen' ? 'froze' : 'unfroze'} account ${accountNumber}`
    });

    res.json({
      success: true,
      message: `Account ${accountNumber} status updated to ${status.toUpperCase()}`,
      accountNumber,
      status
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAccountApprovalStatus = async (req, res) => {
  try {
    const { userId, accountNumber, status } = req.body; // status: 'active' or 'rejected'
    if ((!userId && !accountNumber) || !['active', 'rejected', 'approved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid userId/accountNumber and status required' });
    }
    const finalStatus = status === 'approved' ? 'active' : status;

    let account, user;
    if (isMemoryFallback) {
      account = memoryStore.accounts.find(a => a.accountNumber === accountNumber || a.userId === userId);
      if (account) {
        account.status = finalStatus;
        user = memoryStore.users.find(u => u._id === account.userId || u._id.toString() === account.userId.toString());
        if (user) user.status = finalStatus;
      }
    } else {
      account = await Account.findOne({ $or: [{ accountNumber }, { userId }] });
      if (account) {
        account.status = finalStatus;
        await account.save();
        user = await User.findById(account.userId);
        if (user) {
          user.status = finalStatus;
          await user.save();
        }
      }
    }

    await logAudit({
      performedBy: req.user.name,
      userEmail: req.user.email,
      userRole: 'MANAGER',
      action: finalStatus === 'active' ? 'APPROVE_ACCOUNT' : 'REJECT_ACCOUNT',
      targetAccount: account ? account.accountNumber : accountNumber,
      details: `Manager ${finalStatus === 'active' ? 'approved' : 'rejected'} account registration`
    });

    res.json({
      success: true,
      message: `Account status updated to ${finalStatus.toUpperCase()}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateChequeBookStatus = async (req, res) => {
  try {
    const { chequeBookId, status } = req.body; // status: 'approved' or 'rejected'
    if (!chequeBookId || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid chequeBookId and status (approved/rejected) required' });
    }

    let cheque;
    if (isMemoryFallback) {
      cheque = memoryStore.chequebooks.find(c => c.chequeBookId === chequeBookId || c._id === chequeBookId);
      if (cheque) {
        cheque.status = status;
        cheque.approvedAt = new Date();
      }
      const appReq = (memoryStore.approvalRequests || []).find(r => 
        r.requestId === 'REQ_' + chequeBookId || r.chequeNumber === chequeBookId || r.accountNumber === cheque?.accountNumber
      );
      if (appReq) {
        appReq.status = status;
        appReq.reviewedBy = `${req.user.name} (Manager)`;
        appReq.reviewedAt = new Date();
      }
      if (cheque) {
        memoryStore.notifications = memoryStore.notifications || [];
        memoryStore.notifications.unshift({
          _id: 'notif_' + Date.now(),
          userId: cheque.userId,
          title: status === 'approved' ? 'Cheque Book Approved' : 'Cheque Book Application Status',
          message: status === 'approved' 
            ? `Your application for a ${cheque.totalLeaves}-leaf Cheque Book (${cheque.chequeBookId}) has been approved by Branch Manager.`
            : `Your Cheque Book application (${cheque.chequeBookId}) could not be approved at this time.`,
          type: status === 'approved' ? 'success' : 'warning',
          read: false,
          createdAt: new Date()
        });
      }
    } else {
      cheque = await Chequebook.findOne({ $or: [{ chequeBookId }, { _id: chequeBookId }] });
      if (cheque) {
        cheque.status = status;
        cheque.approvedAt = new Date();
        await cheque.save();

        await ApprovalRequest.updateMany(
          { $or: [{ requestId: 'REQ_' + cheque.chequeBookId }, { accountNumber: cheque.accountNumber, type: 'CHEQUE_BOOK', status: 'pending' }] },
          { status, reviewedBy: `${req.user.name} (Manager)`, reviewedAt: new Date() }
        );

        await Notification.create({
          userId: cheque.userId,
          title: status === 'approved' ? 'Cheque Book Approved' : 'Cheque Book Application Status',
          message: status === 'approved'
            ? `Your application for a ${cheque.totalLeaves}-leaf Cheque Book (${cheque.chequeBookId}) has been approved by Branch Manager.`
            : `Your Cheque Book application (${cheque.chequeBookId}) could not be approved at this time.`,
          type: status === 'approved' ? 'success' : 'warning',
          read: false
        });
      }
    }

    if (!cheque) {
      return res.status(404).json({ success: false, message: 'Cheque request not found' });
    }

    await logAudit({
      performedBy: req.user.name,
      userEmail: req.user.email,
      userRole: 'MANAGER',
      action: 'CHEQUE_APPROVAL',
      targetAccount: cheque.accountNumber,
      details: `Manager ${status} Cheque Book request ${chequeBookId}`
    });

    res.json({
      success: true,
      message: `Cheque Book request ${status} successfully`,
      chequebook: cheque
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    let logs = [];
    if (isMemoryFallback) {
      logs = memoryStore.auditLogs;
    } else {
      logs = await AuditLog.find().sort({ timestamp: -1 });
    }

    res.json({
      success: true,
      totalLogs: logs.length,
      logs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getApprovalRequests = async (req, res) => {
  try {
    const { type, status, search } = req.query;
    let requests = [];

    if (isMemoryFallback) {
      requests = [...(memoryStore.approvalRequests || [])];
    } else {
      requests = await ApprovalRequest.find().sort({ createdAt: -1 });
    }

    const totalRequests = requests.length;
    const pendingCount = requests.filter(r => r.status === 'pending').length;
    const chequesCount = requests.filter(r => ['CHEQUE_CLEARANCE', 'CHEQUE_BOOK'].includes(r.type) && r.status === 'pending').length;
    const transfersCount = requests.filter(r => r.type === 'TRANSFER_APPROVAL' && r.status === 'pending').length;
    const withdrawalsCount = requests.filter(r => r.type === 'WITHDRAWAL_APPROVAL' && r.status === 'pending').length;

    let filtered = requests;
    if (type && type !== 'ALL') {
      if (type === 'CHECKS') {
        filtered = filtered.filter(r => ['CHEQUE_CLEARANCE', 'CHEQUE_BOOK'].includes(r.type));
      } else {
        filtered = filtered.filter(r => r.type === type);
      }
    }
    if (status && status !== 'ALL') {
      filtered = filtered.filter(r => r.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(r => 
        (r.requestId && r.requestId.toLowerCase().includes(q)) ||
        (r.customerName && r.customerName.toLowerCase().includes(q)) ||
        (r.accountNumber && r.accountNumber.toLowerCase().includes(q)) ||
        (r.chequeNumber && r.chequeNumber.toLowerCase().includes(q))
      );
    }

    res.json({
      success: true,
      stats: {
        totalRequests,
        pendingCount,
        chequesCount,
        transfersCount,
        withdrawalsCount
      },
      requests: filtered
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const processApprovalAction = async (req, res) => {
  try {
    const { requestId, action, notes } = req.body;
    if (!requestId || !['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Valid requestId and action (approved/rejected) required' });
    }

    let request;
    if (isMemoryFallback) {
      request = (memoryStore.approvalRequests || []).find(r => r.requestId === requestId || r._id === requestId);
    } else {
      request = await ApprovalRequest.findOne({ $or: [{ requestId }, { _id: requestId }] });
    }

    if (!request) {
      return res.status(404).json({ success: false, message: 'Approval request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Request is already ${request.status.toUpperCase()}` });
    }

    // Financial debit/credit execution on approval
    if (action === 'approved') {
      if (request.type === 'CHEQUE_CLEARANCE' || request.type === 'WITHDRAWAL_APPROVAL') {
        let account;
        if (isMemoryFallback) {
          account = memoryStore.accounts.find(a => a.accountNumber === request.accountNumber);
        } else {
          account = await Account.findOne({ accountNumber: request.accountNumber });
        }

        if (!account) {
          return res.status(404).json({ success: false, message: `Customer Account ${request.accountNumber} not found` });
        }

        if (account.status === 'frozen') {
          return res.status(403).json({ success: false, message: 'Cannot approve. Account is frozen.' });
        }

        if (account.balance < request.amount) {
          return res.status(400).json({
            success: false,
            message: `Insufficient balance for clearance. Required: ₹${request.amount}, Available: ₹${account.balance}`
          });
        }

        const balBefore = account.balance;
        account.balance -= request.amount;
        const balAfter = account.balance;

        const txnId = generateTransactionId();
        const txnRecord = {
          _id: 'txn_' + Date.now(),
          transactionId: txnId,
          accountId: account._id,
          accountNumber: account.accountNumber,
          type: 'WITHDRAW',
          amount: request.amount,
          balanceBefore: balBefore,
          balanceAfter: balAfter,
          description: request.type === 'CHEQUE_CLEARANCE'
            ? `Cheque Clearance (${request.chequeNumber || 'CHQ'}) - Payee: ${request.payeeName || 'Counterparty'}`
            : `Manager Approved Cash Withdrawal - ${request.reason || 'Counter'}`,
          performedByName: `${req.user.name} (Manager)`,
          paymentMethod: request.type === 'CHEQUE_CLEARANCE' ? 'CHEQUE' : 'CASH',
          createdAt: new Date()
        };

        if (isMemoryFallback) {
          memoryStore.transactions.unshift(txnRecord);
          memoryStore.notifications.unshift({
            _id: 'notif_' + Date.now(),
            userId: account.userId,
            title: request.type === 'CHEQUE_CLEARANCE' ? 'Cheque Cleared' : 'Withdrawal Approved',
            message: `₹${request.amount} debited from account ${account.accountNumber}. New balance: ₹${balAfter}.`,
            type: 'info',
            read: false,
            createdAt: new Date()
          });
        } else {
          await account.save();
          await Transaction.create(txnRecord);
          await Notification.create({
            userId: account.userId,
            title: request.type === 'CHEQUE_CLEARANCE' ? 'Cheque Cleared' : 'Withdrawal Approved',
            message: `₹${request.amount} debited from account ${account.accountNumber}. New balance: ₹${balAfter}.`,
            type: 'info'
          });
        }
      } else if (request.type === 'TRANSFER_APPROVAL') {
        let senderAccount, receiverAccount;
        if (isMemoryFallback) {
          senderAccount = memoryStore.accounts.find(a => a.accountNumber === request.accountNumber);
          receiverAccount = memoryStore.accounts.find(a => a.accountNumber === request.toAccountNumber);
        } else {
          senderAccount = await Account.findOne({ accountNumber: request.accountNumber });
          receiverAccount = await Account.findOne({ accountNumber: request.toAccountNumber });
        }

        if (!senderAccount) {
          return res.status(404).json({ success: false, message: `Sender account ${request.accountNumber} not found` });
        }
        if (!receiverAccount) {
          return res.status(404).json({ success: false, message: `Recipient account ${request.toAccountNumber} not found` });
        }
        if (senderAccount.balance < request.amount) {
          return res.status(400).json({ success: false, message: `Insufficient sender balance. Available: ₹${senderAccount.balance}` });
        }

        senderAccount.balance -= request.amount;
        receiverAccount.balance += request.amount;

        const debitTxn = {
          _id: 'txn_' + Date.now(),
          transactionId: generateTransactionId(),
          accountId: senderAccount._id,
          accountNumber: senderAccount.accountNumber,
          type: 'TRANSFER',
          amount: request.amount,
          balanceBefore: senderAccount.balance + request.amount,
          balanceAfter: senderAccount.balance,
          description: `Manager Authorized Transfer to ${request.toAccountNumber}`,
          performedByName: `${req.user.name} (Manager)`,
          paymentMethod: 'ONLINE',
          createdAt: new Date()
        };

        const creditTxn = {
          _id: 'txn_' + (Date.now() + 1),
          transactionId: generateTransactionId(),
          accountId: receiverAccount._id,
          accountNumber: receiverAccount.accountNumber,
          type: 'TRANSFER',
          amount: request.amount,
          balanceBefore: receiverAccount.balance - request.amount,
          balanceAfter: receiverAccount.balance,
          description: `Transfer received from ${senderAccount.accountNumber} (Auth by Manager)`,
          performedByName: `${req.user.name} (Manager)`,
          paymentMethod: 'ONLINE',
          createdAt: new Date()
        };

        if (isMemoryFallback) {
          memoryStore.transactions.unshift(debitTxn, creditTxn);
          memoryStore.notifications.unshift({
            _id: 'notif_' + Date.now(),
            userId: senderAccount.userId,
            title: 'Transfer Approved & Executed',
            message: `Your transfer of ₹${request.amount} to ${request.toAccountNumber} was approved and executed.`,
            type: 'success',
            read: false,
            createdAt: new Date()
          });
        } else {
          await senderAccount.save();
          await receiverAccount.save();
          await Transaction.create([debitTxn, creditTxn]);
          await Notification.create({
            userId: senderAccount.userId,
            title: 'Transfer Approved & Executed',
            message: `Your transfer of ₹${request.amount} to ${request.toAccountNumber} was approved and executed.`,
            type: 'success'
          });
        }
      } else if (request.type === 'CHEQUE_BOOK') {
        if (!isMemoryFallback) {
          await Chequebook.findOneAndUpdate(
            { accountNumber: request.accountNumber, status: 'pending' },
            { status: 'approved', approvedAt: new Date() }
          );
        } else {
          const chq = memoryStore.chequebooks.find(c => c.accountNumber === request.accountNumber && c.status === 'pending');
          if (chq) {
            chq.status = 'approved';
            chq.approvedAt = new Date();
          }
        }
      }
    }

    // Update the request status
    request.status = action;
    request.reviewedBy = `${req.user.name} (Manager)`;
    request.reviewNotes = notes || (action === 'approved' ? 'Approved by Branch Manager' : 'Rejected by Branch Manager');
    request.reviewedAt = new Date();

    if (!isMemoryFallback) {
      await request.save();
    }

    await logAudit({
      performedBy: req.user.name,
      userEmail: req.user.email,
      userRole: 'MANAGER',
      action: action === 'approved' ? 'APPROVE_' + request.type : 'REJECT_' + request.type,
      targetAccount: request.accountNumber,
      amount: request.amount,
      details: `Manager ${action.toUpperCase()} ${request.type} request ${request.requestId}. Notes: ${notes || 'None'}`
    });

    res.json({
      success: true,
      message: `Request ${request.requestId} has been ${action.toUpperCase()} successfully`,
      request
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitChequeForClearance = async (req, res) => {
  try {
    const { chequeNumber, accountNumber, payeeName, amount, reason } = req.body;
    if (!chequeNumber || !accountNumber || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Cheque number, account number, and valid amount required' });
    }

    let account;
    if (isMemoryFallback) {
      account = memoryStore.accounts.find(a => a.accountNumber === accountNumber);
    } else {
      account = await Account.findOne({ accountNumber });
    }

    if (!account) {
      return res.status(404).json({ success: false, message: `Account ${accountNumber} not found` });
    }

    let user;
    if (isMemoryFallback) {
      user = memoryStore.users.find(u => u._id === account.userId || u._id.toString() === account.userId.toString());
    } else {
      user = await User.findById(account.userId);
    }

    const newReq = {
      _id: 'req_' + Date.now(),
      requestId: 'CHK-' + Math.floor(1000 + Math.random() * 9000),
      type: 'CHEQUE_CLEARANCE',
      customerName: user ? user.name : 'Valued Customer',
      customerEmail: user ? user.email : '',
      accountNumber,
      chequeNumber,
      payeeName: payeeName || 'Bearer / Cashier Counter',
      amount: Number(amount),
      reason: reason || 'Cheque presented for clearance at counter',
      status: 'pending',
      createdAt: new Date()
    };

    if (isMemoryFallback) {
      memoryStore.approvalRequests.unshift(newReq);
    } else {
      await ApprovalRequest.create(newReq);
    }

    await logAudit({
      performedBy: req.user.name,
      userEmail: req.user.email,
      userRole: 'MANAGER',
      action: 'SUBMIT_CHEQUE_CLEARANCE',
      targetAccount: accountNumber,
      amount: Number(amount),
      details: `New Cheque ${chequeNumber} submitted for clearance against account ${accountNumber}`
    });

    res.status(201).json({
      success: true,
      message: `Cheque clearance request ${newReq.requestId} submitted successfully`,
      request: newReq
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
