import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Search, 
  Filter, 
  RefreshCw, 
  Key, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Lock, 
  Unlock,
  Phone,
  Mail,
  MapPin,
  Calendar,
  X
} from 'lucide-react';

const ManageStaff = () => {
  const { user: currentUser } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // New staff form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'cashier',
    address: ''
  });

  // Password reset state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Alerts state
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/staff');
      if (res.data.success) {
        setStaffList(res.data.staff || []);
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
      // Fallback: try stats endpoint
      try {
        const statsRes = await API.get('/admin/stats');
        if (statsRes.data.recentUsers) {
          const staffOnly = statsRes.data.recentUsers.filter(u => ['cashier', 'manager', 'admin'].includes(u.role));
          setStaffList(staffOnly);
        }
      } catch (fallbackErr) {
        showAlert('error', 'Could not load staff directory. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert({ type: '', message: '' });
    }, 5000);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      showAlert('error', 'Please fill in all required fields.');
      return;
    }
    if (formData.password.length < 6) {
      showAlert('error', 'Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await API.post('/admin/staff', formData);
      if (res.data.success) {
        showAlert('success', `New ${formData.role.toUpperCase()} (${formData.name}) created successfully!`);
        setShowCreateModal(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: '',
          role: 'cashier',
          address: ''
        });
        fetchStaff();
      }
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to create staff member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (staff) => {
    const isSelf = currentUser && (currentUser.id === staff._id || currentUser._id === staff._id || currentUser.email === staff.email);
    if (isSelf) {
      showAlert('error', 'Security restriction: You cannot freeze your own admin account.');
      return;
    }

    const nextStatus = staff.status === 'frozen' ? 'active' : 'frozen';
    const actionName = nextStatus === 'frozen' ? 'freeze' : 'activate';

    if (!window.confirm(`Are you sure you want to ${actionName} the account of ${staff.name} (${staff.email})?`)) {
      return;
    }

    try {
      const res = await API.put(`/admin/staff/${staff._id}/status`, { status: nextStatus });
      if (res.data.success) {
        showAlert('success', `Account for ${staff.name} is now ${nextStatus.toUpperCase()}.`);
        setStaffList(prev => prev.map(s => s._id === staff._id ? { ...s, status: nextStatus } : s));
      }
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to update account status.');
    }
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showAlert('error', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('error', 'Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await API.put(`/admin/staff/${selectedStaff._id}/password`, { newPassword });
      if (res.data.success) {
        showAlert('success', `Password for ${selectedStaff.name} reset successfully!`);
        setShowPasswordModal(false);
        setNewPassword('');
        setConfirmPassword('');
        setSelectedStaff(null);
      }
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (staff) => {
    const isSelf = currentUser && (currentUser.id === staff._id || currentUser._id === staff._id || currentUser.email === staff.email);
    if (isSelf) {
      showAlert('error', 'Security restriction: You cannot delete your own admin account.');
      return;
    }

    if (staff.email === 'admin@smartbank.com') {
      showAlert('error', 'Security restriction: Master Administrator account cannot be deleted.');
      return;
    }

    if (!window.confirm(`⚠️ PERMANENT ACTION: Are you sure you want to permanently delete staff member ${staff.name} (${staff.email})?`)) {
      return;
    }

    try {
      const res = await API.delete(`/admin/staff/${staff._id}`);
      if (res.data.success) {
        showAlert('success', `Staff member ${staff.name} has been removed.`);
        setStaffList(prev => prev.filter(s => s._id !== staff._id));
      }
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to delete staff user.');
    }
  };

  // Filtered staff
  const filteredStaff = staffList.filter(s => {
    const matchesSearch = 
      (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.phone && s.phone.includes(searchTerm));

    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || (s.status || 'active') === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const cashiersCount = staffList.filter(s => s.role === 'cashier').length;
  const managersCount = staffList.filter(s => s.role === 'manager').length;
  const adminsCount = staffList.filter(s => s.role === 'admin').length;
  const activeCount = staffList.filter(s => (s.status || 'active') === 'active').length;

  return (
    <div>
      {/* Top Banner Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <Users size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)' }}>Staff Directory & RBAC Management</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Provision banking staff, configure role permissions, and control account security
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={fetchStaff} 
            className="btn btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            title="Refresh Directory"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button 
            onClick={() => setShowCreateModal(true)} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <UserPlus size={16} /> Add New Staff User
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {alert.message && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: alert.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
          border: `1px solid ${alert.type === 'error' ? 'var(--danger)' : 'var(--success)'}`,
          color: alert.type === 'error' ? 'var(--danger)' : 'var(--success)'
        }}>
          {alert.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Staff Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--primary)' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Staff Members
          </span>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: 'var(--primary)' }}>
            {staffList.length}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #F59E0B' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Cashiers / Tellers
          </span>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: '#F59E0B' }}>
            {cashiersCount}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #10B981' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Branch Managers
          </span>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: '#10B981' }}>
            {managersCount}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #8B5CF6' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            System Admins
          </span>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: '#8B5CF6' }}>
            {adminsCount}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--accent)' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Active Accounts
          </span>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: 'var(--accent)' }}>
            {activeCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '36px' }}
              placeholder="Search by staff name, email, or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Role Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Role:</span>
            <select 
              className="form-select" 
              style={{ width: '130px', padding: '8px 12px', fontSize: '13px' }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="cashier">Cashier</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
            <select 
              className="form-select" 
              style={{ width: '120px', padding: '8px 12px', fontSize: '13px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="frozen">Frozen</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)' }}>
            Registered Staff Members ({filteredStaff.length})
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing {filteredStaff.length} of {staffList.length} users
          </span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Contact Details</th>
                <th>Assigned Role</th>
                <th>Status</th>
                <th>Created / Joined</th>
                <th style={{ textAlign: 'right' }}>Administrative Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'inline-block', marginBottom: '8px' }}>
                      <RefreshCw size={24} className="animate-spin" />
                    </div>
                    <div>Loading staff directory...</div>
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No staff members match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const isCurrent = currentUser && (currentUser.id === staff._id || currentUser._id === staff._id || currentUser.email === staff.email);
                  const isFrozen = staff.status === 'frozen';

                  return (
                    <tr key={staff._id || staff.id}>
                      {/* Name & Avatar */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: staff.role === 'admin' ? '#8B5CF6' : staff.role === 'manager' ? '#10B981' : '#F59E0B',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '15px'
                          }}>
                            {(staff.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {staff.name}
                              {isCurrent && (
                                <span style={{ fontSize: '10px', background: 'rgba(0,168,150,0.15)', color: 'var(--accent)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                  YOU
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              ID: {staff._id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td>
                        <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={13} style={{ color: 'var(--text-muted)' }} />
                          <span style={{ fontWeight: 500 }}>{staff.email}</span>
                        </div>
                        {staff.phone && (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <Phone size={12} />
                            <span>{staff.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Role Badge */}
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          background: staff.role === 'admin' 
                            ? 'rgba(139,92,246,0.15)' 
                            : staff.role === 'manager' 
                            ? 'rgba(16,185,129,0.15)' 
                            : 'rgba(245,158,11,0.15)',
                          color: staff.role === 'admin' 
                            ? '#7C3AED' 
                            : staff.role === 'manager' 
                            ? '#059669' 
                            : '#D97706'
                        }}>
                          {staff.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: isFrozen ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                          color: isFrozen ? '#DC2626' : '#16A34A'
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: isFrozen ? '#DC2626' : '#16A34A'
                          }} />
                          {staff.status || 'active'}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : 'System Seed'}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          {/* Toggle Freeze / Unfreeze */}
                          <button
                            onClick={() => handleToggleStatus(staff)}
                            disabled={isCurrent}
                            title={isCurrent ? 'Cannot freeze your own account' : isFrozen ? 'Activate Account' : 'Freeze Account'}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: `1px solid ${isFrozen ? '#16A34A' : '#F59E0B'}`,
                              background: 'transparent',
                              color: isFrozen ? '#16A34A' : '#D97706',
                              cursor: isCurrent ? 'not-allowed' : 'pointer',
                              fontSize: '12px',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              opacity: isCurrent ? 0.4 : 1
                            }}
                          >
                            {isFrozen ? <Unlock size={13} /> : <Lock size={13} />}
                            {isFrozen ? 'Unfreeze' : 'Freeze'}
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => {
                              setSelectedStaff(staff);
                              setShowPasswordModal(true);
                            }}
                            title="Reset Staff Password"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-main)',
                              color: 'var(--primary)',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Key size={13} />
                            Reset Pass
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteStaff(staff)}
                            disabled={isCurrent || staff.email === 'admin@smartbank.com'}
                            title={isCurrent ? 'Cannot delete self' : staff.email === 'admin@smartbank.com' ? 'Cannot delete master admin' : 'Delete Staff'}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid rgba(239,68,68,0.3)',
                              background: 'rgba(239,68,68,0.05)',
                              color: 'var(--danger)',
                              cursor: (isCurrent || staff.email === 'admin@smartbank.com') ? 'not-allowed' : 'pointer',
                              fontSize: '12px',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              opacity: (isCurrent || staff.email === 'admin@smartbank.com') ? 0.4 : 1
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE STAFF MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(0,168,150,0.15)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UserPlus size={18} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>Create Bank Staff User</h3>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Ramesh Chandra"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="e.g. ramesh@smartbank.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Temporary Password *</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Staff Role *</label>
                  <select 
                    className="form-select"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                  >
                    <option value="cashier">Cashier (Cash Desk)</option>
                    <option value="manager">Manager (Branch Head)</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Branch / Office Location Address</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Mumbai Central Branch, Floor 2"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)} 
                  className="btn btn-outline" 
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {showPasswordModal && selectedStaff && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(245,158,11,0.15)',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Key size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--primary)' }}>Reset Staff Password</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedStaff.name} ({selectedStaff.email})</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPasswordModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePasswordResetSubmit}>
              <div className="form-group">
                <label className="form-label">New Password (min 6 chars)</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Confirm New Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowPasswordModal(false)} 
                  className="btn btn-outline" 
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                  disabled={submitting}
                >
                  {submitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStaff;
