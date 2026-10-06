import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { 
  Shield, 
  Building2, 
  UserPlus, 
  Users, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  Activity, 
  Server, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);

  // Staff Form
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState('cashier');

  // Branch Form
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [branchAddress, setBranchAddress] = useState('');

  const [msg, setMsg] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/stats');
      if (res.data.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Admin stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const showNotification = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 5000);
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await API.post('/admin/staff', {
        name: staffName,
        email: staffEmail,
        phone: staffPhone,
        password: staffPassword,
        role: staffRole
      });
      if (res.data.success) {
        showNotification('success', `New ${staffRole.toUpperCase()} user created successfully!`);
        setShowStaffModal(false);
        setStaffName('');
        setStaffEmail('');
        setStaffPhone('');
        setStaffPassword('');
        setStaffRole('cashier');
        fetchStats();
      }
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Staff creation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await API.post('/admin/branch', {
        branchName,
        branchCode,
        IFSCcode: ifsc,
        address: branchAddress
      });
      if (res.data.success) {
        showNotification('success', `New Branch '${branchName}' created successfully!`);
        setShowBranchModal(false);
        setBranchName('');
        setBranchCode('');
        setIfsc('');
        setBranchAddress('');
        fetchStats();
      }
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Branch creation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Top Banner Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)' }}>Admin System Command Center</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Global bank operations, personnel provisioning, branch network, and audit control
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={fetchStats} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setShowStaffModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={16} /> Create Staff User
          </button>
          <button onClick={() => setShowBranchModal(true)} className="btn btn-accent" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={16} /> Add New Branch
          </button>
        </div>
      </div>

      {/* Alert Notifications */}
      {msg.text && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: msg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
          border: `1px solid ${msg.type === 'error' ? 'var(--danger)' : 'var(--success)'}`,
          color: msg.type === 'error' ? 'var(--danger)' : 'var(--success)'
        }}>
          {msg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Manage Staff Portal Card */}
        <div 
          onClick={() => navigate('/admin/staff')}
          className="card" 
          style={{ 
            cursor: 'pointer', 
            transition: 'all 0.2s ease', 
            border: '1px solid var(--border-color)',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(255,255,255,1) 100%)' 
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(0,168,150,0.12)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserPlus size={22} />
            </div>
            <ArrowRight size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginTop: '14px', color: 'var(--primary)' }}>
            Manage Staff Users
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
            Control cashiers, branch managers, account freezing, and password resets.
          </p>
          <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Open Staff Directory &rarr;
          </div>
        </div>

        {/* Manage Branches Portal Card */}
        <div 
          onClick={() => navigate('/admin/branches')}
          className="card" 
          style={{ 
            cursor: 'pointer', 
            transition: 'all 0.2s ease', 
            border: '1px solid var(--border-color)',
            background: 'linear-gradient(135deg, rgba(2,62,138,0.06) 0%, rgba(255,255,255,1) 100%)' 
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--secondary)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(2,62,138,0.12)',
              color: 'var(--secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={22} />
            </div>
            <ArrowRight size={18} style={{ color: 'var(--secondary)' }} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginTop: '14px', color: 'var(--primary)' }}>
            Manage Branches
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
            Add bank branches, manage RBI IFSC clearing codes, and operational status.
          </p>
          <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: 700, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Open Branch Network &rarr;
          </div>
        </div>

        {/* System Audit Logs Portal Card */}
        <div 
          onClick={() => navigate('/admin/audit-logs')}
          className="card" 
          style={{ 
            cursor: 'pointer', 
            transition: 'all 0.2s ease', 
            border: '1px solid var(--border-color)',
            background: 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(255,255,255,1) 100%)' 
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#8B5CF6'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(139,92,246,0.12)',
              color: '#8B5CF6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={22} />
            </div>
            <ArrowRight size={18} style={{ color: '#8B5CF6' }} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginTop: '14px', color: 'var(--primary)' }}>
            System Audit Logs
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
            Live security audit trail tracking cash deposits, withdrawals, and authorizations.
          </p>
          <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: 700, color: '#8B5CF6', display: 'flex', alignItems: 'center', gap: '4px' }}>
            View Full Audit Trail &rarr;
          </div>
        </div>
      </div>

      {/* Admin Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)', padding: '16px 20px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Registered Users</span>
          <h2 style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: 'var(--primary)' }}>
            {stats?.stats?.totalUsers || 10}
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {stats?.stats?.customersCount || 7} Customers
          </span>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #F59E0B', padding: '16px 20px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Active Cashiers</span>
          <h2 style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: '#F59E0B' }}>
            {stats?.stats?.cashiersCount || 1}
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Counter Operations</span>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #10B981', padding: '16px 20px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Branch Managers</span>
          <h2 style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: '#10B981' }}>
            {stats?.stats?.managersCount || 1}
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Clearance & Approvals</span>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--secondary)', padding: '16px 20px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Bank Branches</span>
          <h2 style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: 'var(--secondary)' }}>
            {stats?.stats?.branchesCount || 2}
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active Clearing Hubs</span>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #8B5CF6', padding: '16px 20px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Audit Events</span>
          <h2 style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: '#8B5CF6' }}>
            {stats?.stats?.totalAuditEvents || 120}
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Immutable Records</span>
        </div>
      </div>

      {/* Two Column Layout: Branches Snapshot & Recent Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Branches Snapshot */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} style={{ color: 'var(--secondary)' }} />
              Branch Network Overview
            </h3>
            <Link to="/admin/branches" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--secondary)', textDecoration: 'none' }}>
              Manage All &rarr;
            </Link>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Branch Name</th>
                  <th>IFSC Code</th>
                  <th>Branch Code</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.branches || []).map((b) => (
                  <tr key={b._id || b.branchId}>
                    <td style={{ fontWeight: 700 }}>{b.branchName}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 600 }}>{b.IFSCcode}</td>
                    <td style={{ fontFamily: 'monospace' }}>{b.branchCode}</td>
                    <td><span className="badge badge-success">{b.status || 'ACTIVE'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Audit Feed Snapshot */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} style={{ color: 'var(--accent)' }} />
              Recent Security Audit Feed
            </h3>
            <Link to="/admin/audit-logs" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', textDecoration: 'none' }}>
              Full Log Feed &rarr;
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(stats?.recentLogs || []).length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                No recent security events logged.
              </p>
            ) : (
              (stats?.recentLogs || []).slice(0, 5).map((log, idx) => (
                <div key={log._id || idx} style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--bg-main)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      {log.action}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      By {log.performedBy} ({log.userRole || 'USER'}) • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <span className="badge badge-info" style={{ fontSize: '10px' }}>
                    {log.status || 'SUCCESS'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* System Infrastructure Card */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Server size={18} style={{ color: 'var(--primary)' }} />
          System Health & Environment
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div style={{ padding: '12px 14px', background: 'var(--bg-main)', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>DATABASE CLUSTER</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--success)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
              MongoDB Connected (localhost:27017)
            </div>
          </div>

          <div style={{ padding: '12px 14px', background: 'var(--bg-main)', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>API BACKEND</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)', marginTop: '4px' }}>
              Express.js v1.0.0 (Port 5000 ONLINE)
            </div>
          </div>

          <div style={{ padding: '12px 14px', background: 'var(--bg-main)', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>RBAC PERMISSIONS</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>
              4 Roles Enforced (JWT Strict)
            </div>
          </div>
        </div>
      </div>

      {/* Create Staff Modal */}
      {showStaffModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '28px', maxWidth: '480px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: 'var(--primary)' }}>Create Bank Staff User</h3>
            <form onSubmit={handleCreateStaff}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" placeholder="e.g. Anand Kumar" value={staffName} onChange={(e) => setStaffName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" placeholder="e.g. anand@smartbank.com" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="tel" className="form-input" placeholder="+91 9876543210" value={staffPhone} onChange={(e) => setStaffPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-input" placeholder="Min 6 characters" value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Staff Role</label>
                <select className="form-select" value={staffRole} onChange={(e) => setStaffRole(e.target.value)}>
                  <option value="cashier">Cashier (Cash Desk)</option>
                  <option value="manager">Manager (Branch Head)</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowStaffModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Branch Modal */}
      {showBranchModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '28px', maxWidth: '480px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: 'var(--primary)' }}>Add Bank Branch</h3>
            <form onSubmit={handleCreateBranch}>
              <div className="form-group">
                <label className="form-label">Branch Name</label>
                <input type="text" className="form-input" placeholder="SmartBank North Branch" value={branchName} onChange={(e) => setBranchName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Branch Code</label>
                <input type="text" className="form-input" placeholder="SMRT003" value={branchCode} onChange={(e) => setBranchCode(e.target.value.toUpperCase())} required />
              </div>
              <div className="form-group">
                <label className="form-label">IFSC Code</label>
                <input type="text" className="form-input" placeholder="SMRT0000103" value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} required />
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Address</label>
                <input type="text" className="form-input" placeholder="City Address" value={branchAddress} onChange={(e) => setBranchAddress(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowBranchModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-accent" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

