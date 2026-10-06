import Account from '../models/Account.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Chequebook from '../models/Chequebook.js';
import ApprovalRequest from '../models/ApprovalRequest.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';
import { isMemoryFallback } from '../config/db.js';
import { memoryStore } from '../services/seedService.js';
import { generateTransactionId, generateChequeBookId, generateReferenceNo } from '../utils/accountGenerator.js';
import { logAudit } from '../utils/auditLogger.js';

export const transferMoney = async (req, res) => {
  try {
    const { toAccountNumber, amount, description, transferType = 'IMPS' } = req.body;
    const transferAmount = Number(amount);
    const targetIdentifier = (toAccountNumber || '').toString().trim();

    if (!targetIdentifier || !transferAmount || transferAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide valid beneficiary account number and amount' });
    }

    const currentUserId = req.user ? (req.user._id || req.user.id) : null;
    let senderAccount;

    if (!isMemoryFallback && currentUserId) {
      senderAccount = await Account.findOne({ userId: currentUserId });
    }
    if (!senderAccount && currentUserId) {
      senderAccount = (memoryStore.accounts || []).find(a => 
        a.userId === currentUserId || a.userId?.toString() === currentUserId.toString()
      );
    }

    if (!senderAccount) {
      return res.status(404).json({ success: false, message: 'Sender account not found for your profile. Please check your account status.' });
    }

    if (senderAccount.status === 'frozen') {
      return res.status(403).json({ success: false, message: 'Sender account is frozen by bank administration' });
    }

    if (senderAccount.balance < transferAmount) {
      return res.status(400).json({ success: false, message: `Insufficient balance. Available: ₹${senderAccount.balance}` });
    }

    const cleanTarget = targetIdentifier.replace(/[\s-]+/g, '');

    // Fetch all accounts and users to resolve receiver
    let allAccounts = [];
    let allUsers = [];

    if (isMemoryFallback) {
      allAccounts = memoryStore.accounts || [];
      allUsers = memoryStore.users || [];
    } else {
      allAccounts = await Account.find({ status: 'active' });
      allUsers = await User.find({ role: 'customer' });
    }

    let receiverAccount = null;
    let receiverUser = null;

    // 1. Try finding by account number
    receiverAccount = allAccounts.find(a => a.accountNumber === cleanTarget);
    if (receiverAccount) {
      receiverUser = allUsers.find(u => u._id === receiverAccount.userId || u._id?.toString() === receiverAccount.userId?.toString());
    }

    // 2. Try finding by phone or email if user entered customer contact info
    if (!receiverAccount) {
      receiverUser = allUsers.find(u => {
        const uEmail = (u.email || '').toLowerCase();
        const uPhone = (u.phone || '').replace(/[^0-9]/g, '');

        return (
          cleanTarget.toLowerCase() === uEmail ||
          cleanTarget === uPhone ||
          cleanTarget === uPhone.slice(-10)
        );
      });

      if (receiverUser) {
        receiverAccount = allAccounts.find(a => a.userId === receiverUser._id || a.userId?.toString() === receiverUser._id?.toString());
      }
    }

    // Check same account
    if (receiverAccount && senderAccount.accountNumber === receiverAccount.accountNumber) {
      return res.status(400).json({ success: false, message: 'Cannot transfer money to your own account' });
    }

    // Generate unique Bank Reference Number
    const refNumber = `REF/${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;
    const effectiveReceiverName = receiverUser ? receiverUser.name : (receiverAccount ? 'SmartBank Customer' : targetIdentifier);

    // Debit Sender
    const senderBalanceBefore = senderAccount.balance;
    senderAccount.balance -= transferAmount;
    const senderBalanceAfter = senderAccount.balance;

    const txnIdDebit = generateTransactionId();
    const debitTxn = {
      _id: 'txn_' + Date.now(),
      transactionId: txnIdDebit,
      accountId: senderAccount._id,
      accountNumber: senderAccount.accountNumber,
      type: 'TRANSFER',
      amount: transferAmount,
      balanceBefore: senderBalanceBefore,
      balanceAfter: senderBalanceAfter,
      description: `Transfer to ${receiverAccount?.accountNumber || targetIdentifier}${description ? ' - ' + description : ''}`,
      performedByName: req.user.name,
      paymentMethod: 'ONLINE',
      createdAt: new Date()
    };

    let creditTxn = null;
    if (receiverAccount) {
      const receiverBalanceBefore = receiverAccount.balance;
      receiverAccount.balance += transferAmount;
      const receiverBalanceAfter = receiverAccount.balance;

      const txnIdCredit = generateTransactionId();
      creditTxn = {
        _id: 'txn_' + (Date.now() + 1),
        transactionId: txnIdCredit,
        accountId: receiverAccount._id,
        accountNumber: receiverAccount.accountNumber,
        type: 'TRANSFER',
        amount: transferAmount,
        balanceBefore: receiverBalanceBefore,
        balanceAfter: receiverBalanceAfter,
        description: `Transfer received from ${req.user.name} (${senderAccount.accountNumber})`,
        performedByName: req.user.name,
        paymentMethod: 'ONLINE',
        createdAt: new Date()
      };
    }

    // Persist changes
    if (isMemoryFallback) {
      memoryStore.transactions.unshift(debitTxn);
      if (creditTxn) memoryStore.transactions.unshift(creditTxn);
      memoryStore.notifications.unshift({
        _id: 'notif_' + Date.now(),
        userId: currentUserId,
        title: 'Money Transfer Sent',
        message: `₹${transferAmount} sent to ${effectiveReceiverName}. Ref: ${refNumber}`,
        type: 'info',
        read: false,
        createdAt: new Date()
      });
      if (receiverAccount && receiverAccount.userId) {
        memoryStore.notifications.unshift({
          _id: 'notif_' + (Date.now() + 1),
          userId: receiverAccount.userId,
          title: 'Money Received',
          message: `₹${transferAmount} received from ${req.user.name} via ${transferType || 'Online Transfer'}.`,
          type: 'success',
          read: false,
          createdAt: new Date()
        });
      }
    } else {
      await senderAccount.save();
      if (receiverAccount) await receiverAccount.save();
      const txnsToCreate = [debitTxn];
      if (creditTxn) txnsToCreate.push(creditTxn);
      await Transaction.create(txnsToCreate);
      await Notification.create({
        userId: currentUserId,
        title: 'Money Transfer Sent',
        message: `₹${transferAmount} sent to ${effectiveReceiverName}. Ref: ${refNumber}`,
        type: 'info'
      });
      if (receiverAccount && receiverAccount.userId) {
        await Notification.create({
          userId: receiverAccount.userId,
          title: 'Money Received',
          message: `₹${transferAmount} received from ${req.user.name} via ${transferType || 'Online Transfer'}.`,
          type: 'success'
        });
      }
    }

    await logAudit({
      performedBy: req.user.name,
      userEmail: req.user.email,
      userRole: 'CUSTOMER',
      action: 'TRANSFER',
      targetAccount: senderAccount.accountNumber,
      amount: transferAmount,
      details: `Online transfer of ₹${transferAmount} to ${effectiveReceiverName} (${targetIdentifier}). Ref: ${refNumber}`
    });

    res.json({
      success: true,
      message: `Transfer of ₹${transferAmount} completed successfully`,
      transactionId: debitTxn.transactionId,
      refNumber,
      paymentMethod: 'ONLINE',
      amount: transferAmount,
      newBalance: senderAccount.balance,
      beneficiaryName: effectiveReceiverName,
      targetIdentifier,
      date: new Date()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const processPayment = async (req, res) => {
  try {
    const { category, merchantName, consumerNumber, amount } = req.body;
    const payAmount = Number(amount);

    if (!category || !merchantName || !consumerNumber || !payAmount || payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment parameters' });
    }

    let account;
    if (isMemoryFallback) {
      account = memoryStore.accounts.find(a => a.userId === req.user._id || a.userId.toString() === req.user._id.toString());
    } else {
      account = await Account.findOne({ userId: req.user._id });
    }

    if (!account || account.balance < payAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient account balance for this payment' });
    }

    const balBefore = account.balance;
    account.balance -= payAmount;
    const balAfter = account.balance;

    const refNo = generateReferenceNo();
    const txnId = generateTransactionId();

    const paymentRecord = {
      _id: 'pay_' + Date.now(),
      paymentId: 'PAY' + Date.now().toString().slice(-5),
      userId: req.user._id,
      accountId: account._id,
      accountNumber: account.accountNumber,
      category,
      merchantName,
      consumerNumber,
      amount: payAmount,
      status: 'SUCCESS',
      referenceNo: refNo,
      createdAt: new Date()
    };

    const txnRecord = {
      _id: 'txn_' + Date.now(),
      transactionId: txnId,
      accountId: account._id,
      accountNumber: account.accountNumber,
      type: 'PAYMENT',
      amount: payAmount,
      balanceBefore: balBefore,
      balanceAfter: balAfter,
      description: `${category} Payment - ${merchantName} (Ref: ${refNo})`,
      performedByName: req.user.name,
      paymentMethod: 'ONLINE',
      createdAt: new Date()
    };

    if (isMemoryFallback) {
      memoryStore.payments.unshift(paymentRecord);
      memoryStore.transactions.unshift(txnRecord);
    } else {
      await account.save();
      await Payment.create(paymentRecord);
      await Transaction.create(txnRecord);
    }

    await logAudit({
      performedBy: req.user.name,
      userEmail: req.user.email,
      userRole: 'CUSTOMER',
      action: 'PAYMENT',
      targetAccount: account.accountNumber,
      amount: payAmount,
      details: `Paid ₹${payAmount} for ${category} (${merchantName})`
    });

    res.json({
      success: true,
      message: 'Payment completed successfully',
      payment: paymentRecord,
      newBalance: account.balance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const requestChequeBook = async (req, res) => {
  try {
    const { leaves, deliveryMethod, deliveryAddress } = req.body;
    const totalLeaves = Number(leaves) || 25;
    const currentUserId = req.user ? (req.user._id || req.user.id) : null;

    let account;
    if (isMemoryFallback) {
      account = memoryStore.accounts.find(a => 
        (currentUserId && (a.userId === currentUserId || a.userId.toString() === currentUserId.toString())) ||
        (req.body.accountNumber && a.accountNumber === req.body.accountNumber)
      );
    } else {
      const orConditions = [];
      if (currentUserId) {
        orConditions.push({ userId: currentUserId });
        orConditions.push({ userId: req.user._id });
        orConditions.push({ userId: req.user.id });
      }
      if (req.body.accountNumber) {
        orConditions.push({ accountNumber: req.body.accountNumber });
      }

      account = await Account.findOne(orConditions.length > 0 ? { $or: orConditions } : {});
    }

    if (!account) {
      return res.status(404).json({ success: false, message: 'Active customer account not found for cheque book issue' });
    }

    const chqId = generateChequeBookId();
    const dispatchMode = deliveryMethod || 'Registered Speed Post';
    const address = deliveryAddress || req.user.address || 'Registered Residential Address on File';

    const chequeRecord = {
      _id: 'chq_' + Date.now(),
      chequeBookId: chqId,
      userId: currentUserId || account.userId,
      accountId: account._id,
      accountNumber: account.accountNumber,
      customerName: req.user.name,
      totalLeaves,
      usedLeaves: 0,
      remainingLeaves: totalLeaves,
      status: 'pending',
      requestedAt: new Date()
    };

    // Create ApprovalRequest so Manager can review and grant approval
    const approvalReq = {
      _id: 'req_chq_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      requestId: 'REQ_' + chqId,
      type: 'CHEQUE_BOOK',
      customerName: req.user.name,
      customerEmail: req.user.email,
      accountNumber: account.accountNumber,
      leaves: totalLeaves,
      reason: `${totalLeaves}-Leaf Cheque Book via ${dispatchMode}`,
      status: 'pending',
      createdAt: new Date()
    };

    // Create Notification for the customer
    const notifRecord = {
      _id: 'notif_' + Date.now(),
      userId: currentUserId || account.userId,
      title: 'Cheque Book Application Received',
      message: `Your application for a ${totalLeaves}-leaf Cheque Book (${chqId}) has been received and is pending Branch Manager approval.`,
      type: 'info',
      read: false,
      createdAt: new Date()
    };

    if (isMemoryFallback) {
      memoryStore.chequebooks.unshift(chequeRecord);
      memoryStore.approvalRequests = memoryStore.approvalRequests || [];
      memoryStore.approvalRequests.unshift(approvalReq);
      memoryStore.notifications = memoryStore.notifications || [];
      memoryStore.notifications.unshift(notifRecord);
    } else {
      await Chequebook.create(chequeRecord);
      await ApprovalRequest.create(approvalReq);
      await Notification.create(notifRecord);
    }

    await logAudit({
      performedBy: req.user.name,
      userEmail: req.user.email,
      userRole: 'CUSTOMER',
      action: 'CHEQUE_REQUEST',
      targetAccount: account.accountNumber,
      details: `Requested ${totalLeaves}-leaf Cheque Book (${chqId}) via ${dispatchMode}`
    });

    res.json({
      success: true,
      message: `Cheque book application for ${totalLeaves} leaves submitted successfully! Reference ID: ${chqId}. Awaiting Manager approval.`,
      chequebook: chequeRecord
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getChequeBookStatus = async (req, res) => {
  try {
    const currentUserId = req.user ? (req.user._id || req.user.id) : null;
    let account;
    
    if (isMemoryFallback) {
      account = memoryStore.accounts.find(a => 
        currentUserId && (a.userId === currentUserId || a.userId.toString() === currentUserId.toString())
      );
    } else {
      account = await Account.findOne({
        $or: [
          { userId: currentUserId },
          { userId: req.user?._id },
          { userId: req.user?.id }
        ]
      });
    }

    let requests = [];
    if (isMemoryFallback) {
      requests = (memoryStore.chequebooks || []).filter(c => 
        (currentUserId && (c.userId === currentUserId || c.userId.toString() === currentUserId.toString())) ||
        (account && c.accountNumber === account.accountNumber)
      );
    } else {
      const orList = [];
      if (currentUserId) {
        orList.push({ userId: currentUserId });
        orList.push({ userId: req.user._id });
        orList.push({ userId: req.user.id });
      }
      if (account) {
        orList.push({ accountNumber: account.accountNumber });
      }

      requests = await Chequebook.find(orList.length > 0 ? { $or: orList } : {}).sort({ requestedAt: -1 });
    }

    // Compute stats
    const approvedBooks = requests.filter(r => r.status === 'approved');
    const totalRemainingLeaves = approvedBooks.reduce((sum, r) => sum + (r.remainingLeaves || 0), 0);
    const totalUsedLeaves = approvedBooks.reduce((sum, r) => sum + (r.usedLeaves || 0), 0);

    res.json({
      success: true,
      account: account ? {
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        balance: account.balance,
        holderName: req.user.name
      } : null,
      summary: {
        activeBooksCount: approvedBooks.length,
        pendingBooksCount: requests.filter(r => r.status === 'pending').length,
        totalRemainingLeaves,
        totalUsedLeaves
      },
      chequebooks: requests
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSelectedTransactions = async (req, res) => {
  try {
    const { transactionIds, restoreBalance = true } = req.body;
    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one payment to delete' });
    }

    const currentUserId = req.user ? (req.user._id || req.user.id) : null;
    let customerAccount;

    if (!isMemoryFallback && currentUserId) {
      customerAccount = await Account.findOne({ userId: currentUserId });
    }
    if (!customerAccount && currentUserId) {
      customerAccount = (memoryStore.accounts || []).find(a => 
        a.userId === currentUserId || a.userId?.toString() === currentUserId.toString()
      );
    }

    if (!customerAccount) {
      return res.status(404).json({ success: false, message: 'Customer account not found' });
    }

    const cleanIds = transactionIds.map(id => id ? id.toString() : '');
    let deletedCount = 0;
    let totalRestoredAmount = 0;

    if (isMemoryFallback) {
      const allTxns = memoryStore.transactions || [];
      const txnsToDelete = allTxns.filter(t => 
        (cleanIds.includes(t._id?.toString()) || cleanIds.includes(t.transactionId?.toString())) &&
        (t.accountId === customerAccount._id || t.accountNumber === customerAccount.accountNumber)
      );

      for (const txn of txnsToDelete) {
        if (restoreBalance) {
          const isDebit = txn.type === 'PAYMENT' || txn.type === 'WITHDRAW' || 
            (txn.type === 'TRANSFER' && !txn.description.toLowerCase().includes('received'));
          if (isDebit && txn.amount > 0) {
            customerAccount.balance += txn.amount;
            totalRestoredAmount += txn.amount;
          }
        }
      }

      memoryStore.transactions = allTxns.filter(t => 
        !(cleanIds.includes(t._id?.toString()) || cleanIds.includes(t.transactionId?.toString()))
      );

      // Clean up corresponding payments if any
      memoryStore.payments = (memoryStore.payments || []).filter(p => 
        !(cleanIds.includes(p._id?.toString()) || cleanIds.includes(p.paymentId?.toString()) || cleanIds.includes(p.referenceNo?.toString()))
      );

      deletedCount = txnsToDelete.length;
    } else {
      const txnsToDelete = await Transaction.find({
        $and: [
          { $or: [{ _id: { $in: cleanIds } }, { transactionId: { $in: cleanIds } }] },
          { $or: [{ accountId: customerAccount._id }, { accountNumber: customerAccount.accountNumber }] }
        ]
      });

      for (const txn of txnsToDelete) {
        if (restoreBalance) {
          const isDebit = txn.type === 'PAYMENT' || txn.type === 'WITHDRAW' || 
            (txn.type === 'TRANSFER' && !txn.description.toLowerCase().includes('received'));
          if (isDebit && txn.amount > 0) {
            customerAccount.balance += txn.amount;
            totalRestoredAmount += txn.amount;
          }
        }
      }

      if (restoreBalance && totalRestoredAmount > 0) {
        await customerAccount.save();
      }

      await Transaction.deleteMany({
        $or: [{ _id: { $in: cleanIds } }, { transactionId: { $in: cleanIds } }]
      });

      await Payment.deleteMany({
        $or: [{ _id: { $in: cleanIds } }, { paymentId: { $in: cleanIds } }, { referenceNo: { $in: cleanIds } }]
      });

      // Synchronize in-memory fallback mirror
      memoryStore.transactions = (memoryStore.transactions || []).filter(t => 
        !(cleanIds.includes(t._id?.toString()) || cleanIds.includes(t.transactionId?.toString()))
      );
      memoryStore.payments = (memoryStore.payments || []).filter(p => 
        !(cleanIds.includes(p._id?.toString()) || cleanIds.includes(p.paymentId?.toString()) || cleanIds.includes(p.referenceNo?.toString()))
      );
      const memAcc = (memoryStore.accounts || []).find(a => a._id === customerAccount._id);
      if (memAcc) memAcc.balance = customerAccount.balance;

      deletedCount = txnsToDelete.length;
    }

    await logAudit({
      performedBy: req.user?.name || 'Customer',
      userEmail: req.user?.email || 'customer@smartbank.com',
      userRole: 'CUSTOMER',
      action: 'PAYMENT_DELETED',
      targetAccount: customerAccount.accountNumber,
      amount: totalRestoredAmount,
      details: `Customer deleted ${deletedCount} selected payment(s) from account ${customerAccount.accountNumber}. Restored: ₹${totalRestoredAmount}.`
    });

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} payment(s).`,
      deletedCount,
      restoredAmount: totalRestoredAmount,
      newBalance: customerAccount.balance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    req.body.transactionIds = [id];
    return deleteSelectedTransactions(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
