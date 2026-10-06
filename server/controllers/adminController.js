import User from '../models/User.js';
import Branch from '../models/Branch.js';
import AuditLog from '../models/AuditLog.js';
import bcrypt from 'bcryptjs';
import { isMemoryFallback } from '../config/db.js';
import { memoryStore } from '../services/seedService.js';
import { logAudit } from '../utils/auditLogger.js';

export const getAdminStats = async (req, res) => {
  try {
    let users = [], branches = [], logs = [];
    if (isMemoryFallback) {
      users = memoryStore.users || [];
      branches = memoryStore.branches || [];
      logs = memoryStore.auditLogs || [];
    } else {
      users = await User.find().select('-password');
      branches = await Branch.find();
      logs = await AuditLog.find().sort({ timestamp: -1 });
    }

    const staffUsers = users.filter(u => ['cashier', 'manager', 'admin'].includes(u.role));

    res.json({
      success: true,
      stats: {
        totalUsers: users.length,
        customersCount: users.filter(u => u.role === 'customer').length,
        cashiersCount: users.filter(u => u.role === 'cashier').length,
        managersCount: users.filter(u => u.role === 'manager').length,
        adminsCount: users.filter(u => u.role === 'admin').length,
        staffCount: staffUsers.length,
        branchesCount: branches.length,
        activeBranchesCount: branches.filter(b => b.status === 'ACTIVE').length,
        totalAuditEvents: logs.length
      },
      branches,
      recentUsers: users.slice(-8),
      recentLogs: logs.slice(0, 8)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStaffList = async (req, res) => {
  try {
    let users = [];
    if (isMemoryFallback) {
      users = (memoryStore.users || []).map(u => {
        const { password, ...rest } = u;
        return rest;
      });
    } else {
      users = await User.find().select('-password').sort({ createdAt: -1 });
    }

    const staff = users.filter(u => ['cashier', 'manager', 'admin'].includes(u.role));

    res.json({
      success: true,
      count: staff.length,
      staff
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createStaffUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, address } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and role are required' });
    }

    if (!['cashier', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid staff role specified' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    if (isMemoryFallback) {
      const existing = (memoryStore.users || []).find(u => u.email === cleanEmail);
      if (existing) {
        return res.status(400).json({ success: false, message: 'User with this email already exists' });
      }
    } else {
      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(400).json({ success: false, message: 'User with this email already exists' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUserObj = {
      _id: 'usr_' + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      phone: phone || '+91 9876543210',
      password: hashedPassword,
      role,
      address: address || '',
      status: 'active',
      createdAt: new Date()
    };

    let createdUser;
    if (isMemoryFallback) {
      memoryStore.users.push(newUserObj);
      createdUser = newUserObj;
    } else {
      createdUser = await User.create(newUserObj);
    }

    await logAudit({
      performedBy: req.user?.name || 'Admin',
      userEmail: req.user?.email || 'admin@smartbank.com',
      userRole: 'ADMIN',
      action: 'CREATE_STAFF',
      details: `Admin created new ${role.toUpperCase()} account for ${cleanEmail}`
    });

    res.status(201).json({
      success: true,
      message: `New ${role} created successfully`,
      user: {
        id: createdUser._id || createdUser.id,
        _id: createdUser._id || createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        phone: createdUser.phone,
        role: createdUser.role,
        status: createdUser.status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStaffStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !['active', 'frozen', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid status (active, frozen, pending) is required' });
    }

    // Prevent admin from modifying their own account
    const currentUserId = req.user?._id || req.user?.id;
    if (currentUserId && (currentUserId === id || req.user?.email === 'admin@smartbank.com' && id.includes('admin'))) {
      // Allow only if target is not the active logged in admin
      if (currentUserId === id) {
        return res.status(400).json({ success: false, message: 'You cannot change your own admin account status' });
      }
    }

    let updatedUser;
    if (isMemoryFallback) {
      const u = (memoryStore.users || []).find(x => x._id === id || x.id === id);
      if (!u) return res.status(404).json({ success: false, message: 'Staff user not found' });
      u.status = status;
      updatedUser = u;
    } else {
      updatedUser = await User.findByIdAndUpdate(id, { status }, { new: true }).select('-password');
      if (!updatedUser) {
        return res.status(404).json({ success: false, message: 'Staff user not found' });
      }
    }

    await logAudit({
      performedBy: req.user?.name || 'Admin',
      userEmail: req.user?.email || 'admin@smartbank.com',
      userRole: 'ADMIN',
      action: 'STAFF_STATUS_UPDATE',
      details: `Admin changed status of staff user (${updatedUser.email}) to ${status.toUpperCase()}`
    });

    res.json({
      success: true,
      message: `Staff status updated to ${status}`,
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetStaffPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    let targetEmail = '';
    if (isMemoryFallback) {
      const u = (memoryStore.users || []).find(x => x._id === id || x.id === id);
      if (!u) return res.status(404).json({ success: false, message: 'Staff user not found' });
      u.password = hashedPassword;
      targetEmail = u.email;
    } else {
      const u = await User.findByIdAndUpdate(id, { password: hashedPassword }, { new: true });
      if (!u) return res.status(404).json({ success: false, message: 'Staff user not found' });
      targetEmail = u.email;
    }

    await logAudit({
      performedBy: req.user?.name || 'Admin',
      userEmail: req.user?.email || 'admin@smartbank.com',
      userRole: 'ADMIN',
      action: 'STAFF_PASSWORD_RESET',
      details: `Admin reset password for staff member (${targetEmail})`
    });

    res.json({
      success: true,
      message: 'Staff password has been reset successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteStaffUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?._id || req.user?.id;
    if (currentUserId && currentUserId === id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account' });
    }

    let deletedEmail = '';
    if (isMemoryFallback) {
      const idx = (memoryStore.users || []).findIndex(x => x._id === id || x.id === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Staff user not found' });
      if (memoryStore.users[idx].role === 'admin' && memoryStore.users[idx].email === 'admin@smartbank.com') {
        return res.status(400).json({ success: false, message: 'Master admin account cannot be deleted' });
      }
      deletedEmail = memoryStore.users[idx].email;
      memoryStore.users.splice(idx, 1);
    } else {
      const targetUser = await User.findById(id);
      if (!targetUser) return res.status(404).json({ success: false, message: 'Staff user not found' });
      if (targetUser.role === 'admin' && targetUser.email === 'admin@smartbank.com') {
        return res.status(400).json({ success: false, message: 'Master admin account cannot be deleted' });
      }
      await User.findByIdAndDelete(id);
      deletedEmail = targetUser.email;
    }

    await logAudit({
      performedBy: req.user?.name || 'Admin',
      userEmail: req.user?.email || 'admin@smartbank.com',
      userRole: 'ADMIN',
      action: 'DELETE_STAFF',
      details: `Admin deleted staff user ${deletedEmail}`
    });

    res.json({
      success: true,
      message: `Staff user (${deletedEmail}) has been deleted successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBranchesList = async (req, res) => {
  try {
    let branches = [];
    if (isMemoryFallback) {
      branches = memoryStore.branches || [];
    } else {
      branches = await Branch.find().sort({ branchName: 1 });
    }

    res.json({
      success: true,
      count: branches.length,
      branches
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createBranch = async (req, res) => {
  try {
    const { branchName, branchCode, IFSCcode, address, phone } = req.body;
    if (!branchName || !branchCode || !IFSCcode) {
      return res.status(400).json({ success: false, message: 'Branch Name, Code, and IFSC code are required' });
    }

    const cleanCode = branchCode.trim().toUpperCase();
    const cleanIfsc = IFSCcode.trim().toUpperCase();

    // Check duplicate code
    if (isMemoryFallback) {
      const exists = (memoryStore.branches || []).find(b => b.branchCode === cleanCode);
      if (exists) return res.status(400).json({ success: false, message: 'Branch with this code already exists' });
    } else {
      const exists = await Branch.findOne({ branchCode: cleanCode });
      if (exists) return res.status(400).json({ success: false, message: 'Branch with this code already exists' });
    }

    const newBranch = {
      _id: 'br_' + Date.now(),
      branchId: 'BR' + Math.floor(100 + Math.random() * 900),
      branchName: branchName.trim(),
      branchCode: cleanCode,
      IFSCcode: cleanIfsc,
      address: address?.trim() || 'Central Banking Hub, Capital City',
      phone: phone?.trim() || '+91 1800-123-0000',
      status: 'ACTIVE'
    };

    let createdBranch;
    if (isMemoryFallback) {
      memoryStore.branches.push(newBranch);
      createdBranch = newBranch;
    } else {
      createdBranch = await Branch.create(newBranch);
    }

    await logAudit({
      performedBy: req.user?.name || 'Admin',
      userEmail: req.user?.email || 'admin@smartbank.com',
      userRole: 'ADMIN',
      action: 'CREATE_BRANCH',
      details: `Admin added new bank branch: ${newBranch.branchName} (${newBranch.branchCode})`
    });

    res.status(201).json({
      success: true,
      message: 'Branch created successfully',
      branch: createdBranch
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBranchStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be ACTIVE or INACTIVE' });
    }

    let updatedBranch;
    if (isMemoryFallback) {
      const b = (memoryStore.branches || []).find(x => x._id === id || x.branchId === id);
      if (!b) return res.status(404).json({ success: false, message: 'Branch not found' });
      b.status = status;
      updatedBranch = b;
    } else {
      updatedBranch = await Branch.findOneAndUpdate(
        { $or: [{ _id: id }, { branchId: id }] },
        { status },
        { new: true }
      );
      if (!updatedBranch) return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    await logAudit({
      performedBy: req.user?.name || 'Admin',
      userEmail: req.user?.email || 'admin@smartbank.com',
      userRole: 'ADMIN',
      action: 'BRANCH_STATUS_UPDATE',
      details: `Admin updated status of branch ${updatedBranch.branchName} (${updatedBranch.branchCode}) to ${status}`
    });

    res.json({
      success: true,
      message: `Branch status updated to ${status}`,
      branch: updatedBranch
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    let deletedName = '';
    if (isMemoryFallback) {
      const idx = (memoryStore.branches || []).findIndex(x => x._id === id || x.branchId === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Branch not found' });
      deletedName = memoryStore.branches[idx].branchName;
      memoryStore.branches.splice(idx, 1);
    } else {
      const b = await Branch.findOneAndDelete({ $or: [{ _id: id }, { branchId: id }] });
      if (!b) return res.status(404).json({ success: false, message: 'Branch not found' });
      deletedName = b.branchName;
    }

    await logAudit({
      performedBy: req.user?.name || 'Admin',
      userEmail: req.user?.email || 'admin@smartbank.com',
      userRole: 'ADMIN',
      action: 'DELETE_BRANCH',
      details: `Admin deleted branch: ${deletedName}`
    });

    res.json({
      success: true,
      message: `Branch '${deletedName}' has been deleted successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

