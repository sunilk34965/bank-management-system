import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Account from '../models/Account.js';
import { isMemoryFallback } from '../config/db.js';
import { memoryStore } from '../services/seedService.js';
import { generateAccountNumber } from '../utils/accountGenerator.js';
import { logAudit } from '../utils/auditLogger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'smartbank_jwt_secret_key_2026_secure_bank_app';

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const cleanEmail = (email || '').toLowerCase().trim();
    let user = null;
    if (!isMemoryFallback) {
      try {
        user = await User.findOne({ email: cleanEmail });
      } catch (e) {
        console.warn('DB findUser error, checking memoryStore:', e.message);
      }
    }
    if (!user) {
      user = memoryStore.users.find(u => u.email.toLowerCase().trim() === cleanEmail);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    if (user.status === 'frozen') {
      return res.status(403).json({ success: false, message: 'Your account has been frozen by administration.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    // Role-specific login portal validation
    const requestedRole = (role || '').toLowerCase().trim();
    const validRoles = ['customer', 'cashier', 'manager', 'admin'];

    if (!requestedRole) {
      return res.status(400).json({
        success: false,
        message: 'Login portal role is required (customer, cashier, manager, admin).'
      });
    }

    if (!validRoles.includes(requestedRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid portal role '${requestedRole}'. Allowed roles: ${validRoles.join(', ')}.`
      });
    }

    // Strictly enforce role login portal: e.g. a cashier cannot log in via the customer portal
    if (requestedRole !== user.role.toLowerCase().trim()) {
      const roleTitles = {
        customer: 'Customer',
        cashier: 'Cashier / Teller',
        manager: 'Branch Manager',
        admin: 'System Admin'
      };
      const userRoleTitle = roleTitles[user.role] || user.role;
      const requestedRoleTitle = roleTitles[requestedRole] || requestedRole;

      await logAudit({
        performedBy: user.name,
        userEmail: user.email,
        userRole: user.role.toUpperCase(),
        action: 'LOGIN_BLOCKED_ROLE_MISMATCH',
        details: `Blocked login attempt: ${userRoleTitle} account (${user.email}) attempted login via ${requestedRoleTitle} portal.`,
        status: 'WARNING'
      });

      return res.status(403).json({
        success: false,
        code: 'ROLE_MISMATCH',
        userRole: user.role,
        requestedRole: requestedRole,
        message: `Access denied. A ${userRoleTitle} account cannot log in using the ${requestedRoleTitle} portal. Please switch to the ${userRoleTitle} portal.`
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Fetch account details if customer
    let account = null;
    if (user.role === 'customer') {
      if (!isMemoryFallback) {
        try {
          account = await Account.findOne({ userId: user._id });
        } catch (e) {
          console.warn('DB findAccount error, checking memoryStore:', e.message);
        }
      }
      if (!account) {
        account = memoryStore.accounts.find(a => a.userId === user._id || a.userId.toString() === user._id.toString());
      }
    }

    await logAudit({
      performedBy: user.name,
      userEmail: user.email,
      userRole: user.role.toUpperCase(),
      action: 'LOGIN',
      details: `Successful user login as ${user.role}`
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        address: user.address
      },
      account
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const registerCustomer = async (req, res) => {
  try {
    const { name, email, phone, password, address, accountType } = req.body;
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields' });
    }

    const cleanEmail = (email || '').toLowerCase().trim();
    let existingUser;
    if (isMemoryFallback) {
      existingUser = memoryStore.users.find(u => u.email.toLowerCase().trim() === cleanEmail);
    } else {
      existingUser = await User.findOne({ email: cleanEmail });
    }

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email address already registered. Please login.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userId = 'usr_' + Date.now();
    const newUser = {
      _id: userId,
      name,
      email: cleanEmail,
      phone,
      password: hashedPassword,
      role: 'customer',
      address: address || '',
      status: 'active',
      createdAt: new Date()
    };

    const accNo = generateAccountNumber();
    const newAccount = {
      _id: 'acc_' + Date.now(),
      accountNumber: accNo,
      userId: userId,
      accountType: accountType || 'Savings',
      balance: 1000, // Initial bonus welcome deposit
      branchId: 'BR001',
      status: 'active',
      openedAt: new Date(),
      updatedAt: new Date()
    };

    if (isMemoryFallback) {
      memoryStore.users.push(newUser);
      memoryStore.accounts.push(newAccount);
    } else {
      await User.create(newUser);
      await Account.create(newAccount);
      memoryStore.users.push(newUser);
      memoryStore.accounts.push(newAccount);
    }

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logAudit({
      performedBy: newUser.name,
      userEmail: newUser.email,
      userRole: 'CUSTOMER',
      action: 'REGISTER',
      targetAccount: accNo,
      amount: 1000,
      details: 'New Customer Self Registration'
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        status: newUser.status
      },
      account: newAccount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    let user = req.user;
    let account = null;

    if (user.role === 'customer') {
      if (!isMemoryFallback) {
        try {
          account = await Account.findOne({ userId: user._id });
        } catch (e) {
          console.warn('DB findAccount error in getMe:', e.message);
        }
      }
      if (!account) {
        account = memoryStore.accounts.find(a => a.userId === user._id || a.userId.toString() === user._id.toString());
      }
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        address: user.address
      },
      account
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
