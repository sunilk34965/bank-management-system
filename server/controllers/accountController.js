import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { isMemoryFallback } from '../config/db.js';
import { memoryStore } from '../services/seedService.js';

export const getCustomerPassbook = async (req, res) => {
  try {
    const { startDate, endDate, type, search } = req.query;
    const userId = req.user._id;

    let account;
    if (isMemoryFallback) {
      account = memoryStore.accounts.find(a => a.userId === userId || a.userId.toString() === userId.toString());
    } else {
      account = await Account.findOne({ userId });
    }

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    let txns = [];
    if (isMemoryFallback) {
      txns = memoryStore.transactions.filter(t => 
        t.accountId === account._id || t.accountNumber === account.accountNumber
      );
    } else {
      txns = await Transaction.find({ 
        $or: [{ accountId: account._id }, { accountNumber: account.accountNumber }] 
      }).sort({ createdAt: -1 });
    }

    // Apply Filter
    if (type && type !== 'ALL') {
      txns = txns.filter(t => t.type === type);
    }

    if (search) {
      const q = search.toLowerCase();
      txns = txns.filter(t => 
        t.transactionId.toLowerCase().includes(q) || 
        t.description.toLowerCase().includes(q) ||
        (t.performedByName && t.performedByName.toLowerCase().includes(q))
      );
    }

    if (startDate) {
      const start = new Date(startDate);
      txns = txns.filter(t => new Date(t.createdAt) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      txns = txns.filter(t => new Date(t.createdAt) <= end);
    }

    // Sort descending by date
    txns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      account: {
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        balance: account.balance,
        branchId: account.branchId,
        status: account.status,
        customerName: req.user.name
      },
      totalTransactions: txns.length,
      transactions: txns
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAccountDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    let account;
    if (isMemoryFallback) {
      account = memoryStore.accounts.find(a => a.userId === userId || a.userId.toString() === userId.toString());
    } else {
      account = await Account.findOne({ userId });
    }

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    res.json({
      success: true,
      account
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const lookupBeneficiary = async (req, res) => {
  try {
    const rawTarget = req.params.accountNumber || '';
    const cleanTarget = rawTarget.toString().trim().replace(/[\s-]+/g, '');

    if (!cleanTarget || cleanTarget.length < 3) {
      return res.status(400).json({ success: false, message: 'Invalid beneficiary account number' });
    }

    let account, user;
    let allAccounts = [];
    let allUsers = [];

    if (isMemoryFallback) {
      allAccounts = memoryStore.accounts || [];
      allUsers = memoryStore.users || [];
    } else {
      allAccounts = await Account.find({ status: 'active' });
      allUsers = await User.find({ role: 'customer' });
    }

    // Match by account number first
    account = allAccounts.find(a => a.accountNumber === cleanTarget);
    if (account) {
      user = allUsers.find(u => u._id === account.userId || u._id?.toString() === account.userId?.toString());
    }

    // Match by phone or email if user entered customer contact info
    if (!account) {
      user = allUsers.find(u => {
        const uEmail = (u.email || '').toLowerCase();
        const uPhone = (u.phone || '').replace(/[^0-9]/g, '');

        return (
          cleanTarget.toLowerCase() === uEmail ||
          cleanTarget === uPhone ||
          cleanTarget === uPhone.slice(-10)
        );
      });

      if (user) {
        account = allAccounts.find(a => a.userId === user._id || a.userId?.toString() === user._id?.toString());
      }
    }

    if (!account) {
      return res.status(404).json({
        success: false,
        message: `Beneficiary account "${rawTarget}" not found in SmartBank`
      });
    }

    const currentUserId = req.user ? (req.user._id || req.user.id) : null;
    const isSameAsSender = currentUserId ? (account.userId === currentUserId || account.userId?.toString() === currentUserId?.toString()) : false;

    res.json({
      success: true,
      beneficiary: {
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        customerName: user ? user.name : 'SmartBank Valued Customer',
        email: user?.email || '',
        phone: user?.phone || '',
        status: account.status,
        isSameAsSender
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSuggestedBeneficiaries = async (req, res) => {
  try {
    const currentUserId = req.user ? (req.user._id || req.user.id) : null;
    let accounts = [], users = [];

    if (isMemoryFallback) {
      accounts = memoryStore.accounts || [];
      users = memoryStore.users || [];
    } else {
      accounts = await Account.find({ status: 'active' });
      users = await User.find({ role: 'customer' });
    }

    // Exclude current user's account
    const suggestions = accounts
      .filter(a => !currentUserId || (a.userId !== currentUserId && a.userId?.toString() !== currentUserId?.toString()))
      .map(acc => {
        const u = users.find(usr => usr._id === acc.userId || usr._id?.toString() === acc.userId?.toString());
        return {
          accountNumber: acc.accountNumber,
          accountType: acc.accountType,
          customerName: u ? u.name : 'Valued Customer',
          email: u ? u.email : '',
          phone: u ? u.phone : ''
        };
      });

    res.json({
      success: true,
      beneficiaries: suggestions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
