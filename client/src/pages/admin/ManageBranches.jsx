import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  MapPin, 
  Phone, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  Power, 
  Copy, 
  Check, 
  X,
  CreditCard,
  Building
} from 'lucide-react';

const ManageBranches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedIfsc, setCopiedIfsc] = useState('');

  // New branch form state
  const [formData, setFormData] = useState({
    branchName: '',
    branchCode: '',
    IFSCcode: '',
    address: '',
    phone: ''
  });

  // Alerts
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/branches');
      if (res.data.success) {
        setBranches(res.data.branches || []);
      }
    } catch (err) {
      console.error('Failed to fetch branches:', err);
      // Fallback: try stats endpoint
      try {
        const statsRes = await API.get('/admin/stats');
        if (statsRes.data.branches) {
          setBranches(statsRes.data.branches);
        }
      } catch (fallbackErr) {
        showAlert('error', 'Could not load branch network. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert({ type: '', message: '' });
    }, 5000);
  };

  const handleCopyIfsc = (ifsc) => {
    navigator.clipboard.writeText(ifsc);
    setCopiedIfsc(ifsc);
    setTimeout(() => setCopiedIfsc(''), 2000);
  };

  const handleCreateBranchSubmit = async (e) => {
    e.preventDefault();
    if (!formData.branchName || !formData.branchCode || !formData.IFSCcode) {
      showAlert('error', 'Please fill in Branch Name, Branch Code, and IFSC code.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await API.post('/admin/branch', {
        branchName: formData.branchName.trim(),
        branchCode: formData.branchCode.trim().toUpperCase(),
        IFSCcode: formData.IFSCcode.trim().toUpperCase(),
        address: formData.address.trim() || 'Central Banking Hub',
        phone: formData.phone.trim() || '+91 1800-123-4567'
      });

      if (res.data.success) {
        showAlert('success', `Branch '${formData.branchName}' added to the network successfully!`);
        setShowCreateModal(false);
        setFormData({
          branchName: '',
          branchCode: '',
          IFSCcode: '',
          address: '',
          phone: ''
        });
        fetchBranches();
      }
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to create branch.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (branch) => {
    const nextStatus = branch.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionDesc = nextStatus === 'ACTIVE' ? 'activate' : 'mark as inactive/maintenance';

    if (!window.confirm(`Are you sure you want to ${actionDesc} branch ${branch.branchName}?`)) {
      return;
    }

    try {
      const res = await API.put(`/admin/branches/${branch._id || branch.branchId}/status`, { status: nextStatus });
      if (res.data.success) {
        showAlert('success', `Branch status updated to ${nextStatus}.`);
        setBranches(prev => prev.map(b => (b._id === branch._id || b.branchId === branch.branchId) ? { ...b, status: nextStatus } : b));
      }
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to update branch status.');
    }
  };

  const handleDeleteBranch = async (branch) => {
    if (branches.length <= 1) {
      showAlert('error', 'Cannot delete the only remaining bank branch.');
      return;
    }

    if (!window.confirm(`⚠️ PERMANENT ACTION: Are you sure you want to remove branch '${branch.branchName}' (${branch.branchCode})?`)) {
      return;
    }

    try {
      const res = await API.delete(`/admin/branches/${branch._id || branch.branchId}`);
      if (res.data.success) {
        showAlert('success', `Branch '${branch.branchName}' has been removed.`);
        setBranches(prev => prev.filter(b => (b._id !== branch._id && b.branchId !== branch.branchId)));
      }
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to delete branch.');
    }
  };

  const filteredBranches = branches.filter(b => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (b.branchName && b.branchName.toLowerCase().includes(term)) ||
      (b.branchCode && b.branchCode.toLowerCase().includes(term)) ||
      (b.IFSCcode && b.IFSCcode.toLowerCase().includes(term)) ||
      (b.address && b.address.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'all' || (b.status || 'ACTIVE') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = branches.filter(b => (b.status || 'ACTIVE') === 'ACTIVE').length;
  const inactiveCount = branches.filter(b => b.status === 'INACTIVE').length;

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
              background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <Building2 size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)' }}>Bank Branch Network</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Configure branch locations, IFSC clearing codes, and operational status
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={fetchBranches} 
            className="btn btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            title="Refresh Branches"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button 
            onClick={() => setShowCreateModal(true)} 
            className="btn btn-accent"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} /> Add New Branch
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

      {/* Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--primary)' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Bank Branches
          </span>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: 'var(--primary)' }}>
            {branches.length}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--success)' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Operational / Active
          </span>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: 'var(--success)' }}>
            {activeCount}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #F59E0B' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Inactive / Maintenance
          </span>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: '#F59E0B' }}>
            {inactiveCount}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--accent)' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Clearing IFSCs Registered
          </span>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: 'var(--accent)' }}>
            {branches.length}
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
              placeholder="Search branches by name, IFSC code, or branch code..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
            <select 
              className="form-select" 
              style={{ width: '130px', padding: '8px 12px', fontSize: '13px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Branches List Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)' }}>
            Branch Network Directory ({filteredBranches.length})
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing {filteredBranches.length} of {branches.length} branches
          </span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Branch ID</th>
                <th>Branch Details</th>
                <th>IFSC Clearing Code</th>
                <th>Branch Code</th>
                <th>Contact & Location</th>
                <th>Operational Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'inline-block', marginBottom: '8px' }}>
                      <RefreshCw size={24} className="animate-spin" />
                    </div>
                    <div>Loading branches...</div>
                  </td>
                </tr>
              ) : filteredBranches.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No branches found matching your search.
                  </td>
                </tr>
              ) : (
                filteredBranches.map((branch) => {
                  const isActive = (branch.status || 'ACTIVE') === 'ACTIVE';

                  return (
                    <tr key={branch._id || branch.branchId}>
                      {/* Branch ID */}
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '13px', color: 'var(--primary)' }}>
                        {branch.branchId}
                      </td>

                      {/* Name */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            background: 'rgba(0,168,150,0.1)',
                            color: 'var(--accent)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Building size={16} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '14px' }}>
                              {branch.branchName}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              Official RBI Clearing Branch
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* IFSC Code */}
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0,168,150,0.08)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(0,168,150,0.2)' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)', fontSize: '13px' }}>
                            {branch.IFSCcode}
                          </span>
                          <button
                            onClick={() => handleCopyIfsc(branch.IFSCcode)}
                            title="Copy IFSC Code"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', color: copiedIfsc === branch.IFSCcode ? 'var(--success)' : 'var(--text-muted)' }}
                          >
                            {copiedIfsc === branch.IFSCcode ? <Check size={13} /> : <Copy size={13} />}
                          </button>
                        </div>
                      </td>

                      {/* Branch Code */}
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '13px' }}>
                          {branch.branchCode}
                        </span>
                      </td>

                      {/* Location & Contact */}
                      <td>
                        <div style={{ fontSize: '12px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <span style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={branch.address}>
                            {branch.address}
                          </span>
                        </div>
                        {branch.phone && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                            <Phone size={11} />
                            <span>{branch.phone}</span>
                          </div>
                        )}
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
                          background: isActive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                          color: isActive ? '#16A34A' : '#DC2626'
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: isActive ? '#16A34A' : '#DC2626'
                          }} />
                          {branch.status || 'ACTIVE'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          {/* Toggle Active / Inactive */}
                          <button
                            onClick={() => handleToggleStatus(branch)}
                            title={isActive ? 'Mark branch as Inactive' : 'Activate Branch'}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: `1px solid ${isActive ? '#F59E0B' : '#16A34A'}`,
                              background: 'transparent',
                              color: isActive ? '#D97706' : '#16A34A',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Power size={13} />
                            {isActive ? 'Deactivate' : 'Activate'}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteBranch(branch)}
                            disabled={branches.length <= 1}
                            title={branches.length <= 1 ? 'Cannot delete only branch' : 'Delete Branch'}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid rgba(239,68,68,0.3)',
                              background: 'rgba(239,68,68,0.05)',
                              color: 'var(--danger)',
                              cursor: branches.length <= 1 ? 'not-allowed' : 'pointer',
                              fontSize: '12px',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              opacity: branches.length <= 1 ? 0.4 : 1
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

      {/* CREATE BRANCH MODAL */}
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
                  <Building2 size={18} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>Add Bank Branch</h3>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateBranchSubmit}>
              <div className="form-group">
                <label className="form-label">Branch Official Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. SmartBank Cyber Hub Branch (Gurugram)"
                  value={formData.branchName}
                  onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Branch Code *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. SMRT003"
                    value={formData.branchCode}
                    onChange={(e) => setFormData({ ...formData, branchCode: e.target.value.toUpperCase() })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">IFSC Clearing Code *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. SMRT0000103"
                    value={formData.IFSCcode}
                    onChange={(e) => setFormData({ ...formData, IFSCcode: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Branch Contact Phone</label>
                <input 
                  type="tel" 
                  className="form-input" 
                  placeholder="e.g. +91 1800-123-0103"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Physical Address</label>
                <textarea 
                  className="form-input" 
                  rows={3}
                  placeholder="Complete postal address with pin code..."
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
                  className="btn btn-accent" 
                  style={{ flex: 1 }}
                  disabled={submitting}
                >
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

export default ManageBranches;
