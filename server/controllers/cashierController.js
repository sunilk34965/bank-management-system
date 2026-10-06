import Account from '../models/Account.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { isMemoryFallback } from '../config/db.js';
import { memoryStore } from '../services/seedService.js';
import { generateTransactionId } from '../utils/accountGenerator.js';
import { logAudit } from '../utils/auditLogger.js';

export const verifyCustomerAccount = async (req, res) => {
  try {
    const rawTarget = req.query.accountNumber || '';
    const cleanAccount = rawTarget.toString().trim().replace(/[\s-]+/g, '');

    if (!cleanAccount) {
      return res.status(400).json({ success: false, message: 'Account number is required' });
    }

    let account, user;
    if (isMemoryFallback) {
      // Match by account number
      account = (memoryStore.accounts || []).find(a => a.accountNumber === cleanAccount);
      if (account) {
        user = (memoryStore.users || []).find(u => u._id === account.userId || u._id?.toString() === account.userId?.toString());
      }

      // Fallback search by phone or email
      if (!account) {
        user = (memoryStore.users || []).find(u => 
          (u.phone && (u.phone.replace(/[^0-9]/g, '') === cleanAccount || u.phone.replace(/[^0-9]/g, '').slice(-10) === cleanAccount)) ||
          (u.email && u.email.toLowerCase() === cleanAccount.toLowerCase())
        );
        if (user) {
          account = (memoryStore.accounts || []).find(a => a.userId === user._id || a.userId?.toString() === user._id?.toString());
        }
      }
    } else {
      account = await Account.findOne({ accountNumber: cleanAccount });
      if (account) {
        user = await User.findById(account.userId);
      } else {
        user = await User.findOne({
          $or: [
            { phone: cleanAccount },
            { email: cleanAccount.toLowerCase() }
          ]
        });
        if (user) {
          account = await Account.findOne({ userId: user._id });
        }
      }
    }

    if (!account || !user) {
      return res.status(404).json({ success: false, message: `No active customer account found for "${rawTarget}"` });
    }

    res.json({
      success: true,
      account: {
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        balance: account.balance,
        status: account.status,
        branchId: account.branchId,
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomerAccounts = async (req, res) => {
  try {
    let accounts = [], users = [];
    if (isMemoryFallback) {
      accounts = memoryStore.accounts || [];
      users = memoryStore.users || [];
    } else {
      accounts = await Account.find({ status: 'active' });
      users = await User.find({ role: 'customer' });
    }

    const customerList = accounts.map(acc => {
      const u = users.find(usr => usr._id === acc.userId || usr._id?.toString() === acc.userId?.toString());
      return {
        accountNumber: acc.accountNumber,
        accountType: acc.accountType,
        balance: acc.balance,
        status: acc.status,
        customerName: u ? u.name : 'Valued Customer',
        customerPhone: u ? u.phone : '',
        customerEmail: u ? u.email : ''
      };
    });

    res.json({
      success: true,
      customers: customerList
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const depositCash = async (req, res) => {
  try {
    const { accountNumber, amount, description } = req.body;
    const depositAmount = Number(amount);
    const cleanAccount = (accountNumber || '').toString().trim().replace(/[\s-]+/g, '');

    if (!cleanAccount || !depositAmount || depositAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid account number and positive deposit amount required' });
    }

    let account, user;
    if (isMemoryFallback) {
      account = (memoryStore.accounts || []).find(a => a.accountNumber === cleanAccount);
      if (account) {
        user = (memoryStore.users || []).find(u => u._id === account.userId || u._id?.toString() === account.userId?.toString());
      }
    } else {
      account = await Account.findOne({ accountNumber: cleanAccount });
      if (account) user = await User.findById(account.userId);
    }

    if (!account) {
      return res.status(404).json({ success: false, message: 'Customer account not found' });
    }

    if (account.status === 'frozen') {
      return res.status(403).json({ success: false, message: 'Cannot process deposit. Customer account is frozen.' });
    }

    const balBefore = account.balance;
    account.balance += depositAmount;
    const balAfter = account.balance;

    const txnId = generateTransactionId();
    const transaction = {
      _id: 'txn_' + Date.now(),
      transactionId: txnId,
      accountId: account._id,
      accountNumber: account.accountNumber,
      type: 'DEPOSIT',
      amount: depositAmount,
      balanceBefore: balBefore,
      balanceAfter: balAfter,
      description: description ? `Cashier Counter Deposit (${description})` : 'Cashier Counter Cash Deposit',
      performedByName: `${req.user.name} (Cashier)`,
      paymentMethod: 'CASH',
      createdAt: new Date()
    };

    if (isMemoryFallback) {
      memoryStore.transactions.unshift(transaction);
      memoryStore.notifications.unshift({
        _id: 'notif_' + Date.now(),
        userId: user ? user._id : account.userId,
        title: 'Cash Deposit Received',
        message: `₹${depositAmount} deposited into your account by Cashier counter. New Balance: ₹${balAfter}.`,
        type: 'success',
        read: false,
        createdAt: new Date()
      });
    } else {
      await account.save();
      await Transaction.create(transaction);
    }

    await logAudit({
      performedBy: req.user.name,
      userEmail: req.user.email,
      userRole: 'CASHIER',
      action: 'DEPOSIT',
      targetAccount: cleanAccount,
      amount: depositAmount,
      details: `Cashier processed ₹${depositAmount} cash deposit`
    });

    res.json({
      success: true,
      message: 'Cash deposited successfully',
      receipt: {
        transactionId: txnId,
        accountNumber: account.accountNumber,
        customerName: user ? user.name : 'Valued Customer',
        depositAmount,
        balanceBefore: balBefore,
        balanceAfter: balAfter,
        cashierName: req.user.name,
        date: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const withdrawCash = async (req, res) => {
  try {
    const { accountNumber, amount, description } = req.body;
    const withdrawAmount = Number(amount);
    const cleanAccount = (accountNumber || '').toString().trim().replace(/[\s-]+/g, '');

    if (!cleanAccount || !withdrawAmount || withdrawAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid account number and positive withdrawal amount required' });
    }

    let account, user;
    if (isMemoryFallback) {
      account = (memoryStore.accounts || []).find(a => a.accountNumber === cleanAccount);
      if (account) {
        user = (memoryStore.users || []).find(u => u._id === account.userId || u._id?.toString() === account.userId?.toString());
      }
    } else {
      account = await Account.findOne({ accountNumber: cleanAccount });
      if (account) user = await User.findById(account.userId);
    }

    // Validations: 1. Account exists? 2. Account active? 3. Sufficient balance? 4. Daily limit check
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    if (account.status !== 'active') {
      return res.status(403).json({ success: false, message: `Withdrawal rejected. Account is currently ${account.status.toUpperCase()}.` });
    }

    if (account.balance < withdrawAmount) {
      return res.status(400).json({ success: false, message: `Insufficient balance. Current balance is ₹${account.balance}.` });
    }

    if (withdrawAmount > 200000) {
      return res.status(400).json({ success: false, message: 'Single cash withdrawal limit exceeded (Max limit: ₹2,00,000). Manager authorization required.' });
    }

    const balBefore = account.balance;
    account.balance -= withdrawAmount;
    const balAfter = account.balance;

    const txnId = generateTransactionId();
    const transaction = {
      _id: 'txn_' + Date.now(),
      transactionId: txnId,
      accountId: account._id,
      accountNumber: account.accountNumber,
      type: 'WITHDRAW',
      amount: withdrawAmount,
      balanceBefore: balBefore,
      balanceAfter: balAfter,
      description: description ? `Cashier Cash Withdrawal (${description})` : 'Cashier Counter Cash Withdrawal',
      performedByName: `${req.user.name} (Cashier)`,
      paymentMethod: 'CASH',
      createdAt: new Date()
    };

    if (isMemoryFallback) {
      memoryStore.transactions.unshift(transaction);
      memoryStore.notifications.unshift({
        _id: 'notif_' + Date.now(),
        userId: user ? user._id : account.userId,
        title: 'Cash Withdrawal Alert',
        message: `₹${withdrawAmount} withdrawn from your account at counter. New Balance: ₹${balAfter}.`,
        type: 'warning',
        read: false,
        createdAt: new Date()
      });
    } else {
      await account.save();
      await Transaction.create(transaction);
    }

    await logAudit({
      performedBy: req.user.name,
      userEmail: req.user.email,
      userRole: 'CASHIER',
      action: 'WITHDRAWAL',
      targetAccount: cleanAccount,
      amount: withdrawAmount,
      details: `Cashier processed ₹${withdrawAmount} cash withdrawal`
    });

    res.json({
      success: true,
      message: 'Cash withdrawal processed successfully',
      receipt: {
        transactionId: txnId,
        accountNumber: account.accountNumber,
        customerName: user ? user.name : 'Valued Customer',
        withdrawalAmount: withdrawAmount,
        balanceBefore: balBefore,
        balanceAfter: balAfter,
        cashierName: req.user.name,
        date: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCashierSummary = async (req, res) => {
  try {
    let txns = [];
    if (isMemoryFallback) {
      txns = memoryStore.transactions || [];
    } else {
      txns = await Transaction.find().sort({ createdAt: -1 });
    }

    const today = new Date().toDateString();
    const todayTxns = txns.filter(t => new Date(t.createdAt).toDateString() === today);

    const todayDeposits = todayTxns
      .filter(t => t.type === 'DEPOSIT')
      .reduce((sum, t) => sum + t.amount, 0);

    const todayWithdrawals = todayTxns
      .filter(t => t.type === 'WITHDRAW')
      .reduce((sum, t) => sum + t.amount, 0);

    const counterTxns = txns.filter(t => t.type === 'DEPOSIT' || t.type === 'WITHDRAW');

    res.json({
      success: true,
      todayDeposits,
      todayWithdrawals,
      netCashFlow: todayDeposits - todayWithdrawals,
      totalCounterTransactions: todayTxns.length > 0 ? todayTxns.length : counterTxns.length,
      recentTransactions: (todayTxns.length > 0 ? todayTxns : counterTxns).slice(0, 25)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
