import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import {
  CheckSquare,
  FileCheck,
  ArrowRightLeft,
  ArrowDownCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Plus,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  User,
  CreditCard,
  Building,
  Info,
  DollarSign
} from 'lucide-react';

const CheckRequests = () => {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingCount: 0,
    chequesCount: 0,
    transfersCount: 0,
    withdrawalsCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, CHECKS, TRANSFER_APPROVAL, WITHDRAWAL_APPROVAL, HISTORY
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Action Modal State (Approve / Reject)
  const [actionModal, setActionModal] = useState({
    open: false,
    request: null,
    action: 'approved', // 'approved' | 'rejected'
    notes: ''
  });
  const [submittingAction, setSubmittingAction] = useState(false);

  // New Check Clearance Modal State
  const [showNewCheckModal, setShowNewCheckModal] = useState(false);
  const [newCheckData, setNewCheckData] = useState({
    accountNumber: '',
    chequeNumber: '',
    payeeName: '',
    amount: '',
    reason: ''
  });
  const [submittingNewCheck, setSubmittingNewCheck] = useState(false);

  // Toast / Feedback message
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4500);
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await API.get('/manager/approvals');
      if (res.data.success) {
        setRequests(res.data.requests || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error('Fetch approvals error:', err);
      showToast('Failed to load check and authorization requests', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleOpenActionModal = (request, action) => {
    setActionModal({
      open: true,
      request,
      action,
      notes: action === 'approved' ? 'Verified signature and drawer sufficient funds.' : ''
    });
  };

  const handleExecuteAction = async () => {
    if (!actionModal.request) return;
    setSubmittingAction(true);
    try {
      const res = await API.post('/manager/approvals/action', {
        requestId: actionModal.request.requestId || actionModal.request._id,
        action: actionModal.action,
        notes: actionModal.notes
      });

      if (res.data.success) {
        showToast(
          res.data.message || `Request ${actionModal.action.toUpperCase()} successfully`,
          actionModal.action === 'approved' ? 'success' : 'warning'
        );
        setActionModal({ open: false, request: null, action: 'approved', notes: '' });
        fetchRequests();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Action execution failed.', 'danger');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCreateNewCheck = async (e) => {
    e.preventDefault();
    if (!newCheckData.accountNumber || !newCheckData.chequeNumber || !newCheckData.amount) {
      showToast('Please fill in Account Number, Cheque Number, and Amount', 'warning');
      return;
    }

    setSubmittingNewCheck(true);
    try {
      const res = await API.post('/manager/approvals/create-cheque', newCheckData);
      if (res.data.success) {
        showToast(res.data.message || 'Cheque submitted for clearance successfully', 'success');
        setShowNewCheckModal(false);
        setNewCheckData({
          accountNumber: '',
          chequeNumber: '',
          payeeName: '',
          amount: '',
          reason: ''
        });
        fetchRequests();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit cheque.', 'danger');
    } finally {
      setSubmittingNewCheck(false);
    }
  };

  const formatRupee = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  // Filter logic
  const filteredRequests = requests.filter((r) => {
    // Tab filter
    if (activeTab === 'CHECKS' && !['CHEQUE_CLEARANCE', 'CHEQUE_BOOK'].includes(r.type)) return false;
    if (activeTab === 'TRANSFER_APPROVAL' && r.type !== 'TRANSFER_APPROVAL') return false;
    if (activeTab === 'WITHDRAWAL_APPROVAL' && r.type !== 'WITHDRAWAL_APPROVAL') return false;
    if (activeTab === 'HISTORY' && r.status === 'pending') return false;

    // Status filter
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = (r.requestId || '').toLowerCase().includes(q);
      const matchName = (r.customerName || '').toLowerCase().includes(q);
      const matchAcc = (r.accountNumber || '').includes(q);
      const matchToAcc = (r.toAccountNumber || '').includes(q);
      const matchChq = (r.chequeNumber || '').toLowerCase().includes(q);
      const matchPayee = (r.payeeName || '').toLowerCase().includes(q);
      if (!matchId && !matchName && !matchAcc && !matchToAcc && !matchChq && !matchPayee) return false;
    }

    return true;
  });

  const getTypeBadge = (type) => {
    switch (type) {
      case 'CHEQUE_CLEARANCE':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            background: 'rgba(99, 102, 241, 0.12)',
            color: '#4F46E5',
            border: '1px solid rgba(99, 102, 241, 0.25)'
          }}>
            <CheckSquare size={13} /> Check Clearance
          </span>
        );
      case 'CHEQUE_BOOK':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            background: 'rgba(14, 165, 233, 0.12)',
            color: '#0284C7',
            border: '1px solid rgba(14, 165, 233, 0.25)'
          }}>
            <FileCheck size={13} /> Cheque Book Request
          </span>
        );
      case 'TRANSFER_APPROVAL':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#059669',
            border: '1px solid rgba(16, 185, 129, 0.25)'
          }}>
            <ArrowRightLeft size={13} /> Money Transfer Auth
          </span>
        );
      case 'WITHDRAWAL_APPROVAL':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            background: 'rgba(245, 158, 11, 0.12)',
            color: '#D97706',
            border: '1px solid rgba(245, 158, 11, 0.25)'
          }}>
            <ArrowDownCircle size={13} /> Cash Withdrawal Auth
          </span>
        );
      default:
        return (
          <span style={{
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 600,
            background: '#F1F5F9',
            color: '#475569'
          }}>
            {type}
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            background: 'rgba(34, 197, 94, 0.12)',
            color: '#16A34A',
            border: '1px solid rgba(34, 197, 94, 0.3)'
          }}>
            <CheckCircle2 size={12} /> APPROVED
          </span>
        );
      case 'rejected':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#DC2626',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            <XCircle size={12} /> REJECTED
          </span>
        );
      case 'pending':
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            background: 'rgba(245, 158, 11, 0.12)',
            color: '#B45309',
            border: '1px solid rgba(245, 158, 11, 0.3)'
          }}>
            <Clock size={12} className="animate-spin-slow" /> PENDING REVIEW
          </span>
        );
    }
  };

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Toast Alert */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 1000,
          padding: '14px 20px',
          borderRadius: '12px',
          background: toast.type === 'success' ? '#065F46' : toast.type === 'warning' ? '#92400E' : '#991B1B',
          color: '#FFFFFF',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px',
          fontWeight: 600,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0B1F3A 0%, #123C69 100%)',
              color: '#00A896',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(11,31,58,0.15)'
            }}>
              <CheckSquare size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px' }}>
                Check & Authorization Requests
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Handle incoming customer checks, clearance workflows, and authorize high-value transfers or withdrawals
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchRequests}
            className="btn btn-outline"
            style={{ fontSize: '13px', padding: '9px 14px' }}
            title="Refresh Requests"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowNewCheckModal(true)}
            className="btn btn-accent"
            style={{ fontSize: '13px', padding: '9px 16px' }}
          >
            <Plus size={16} />
            <span>Process New Check</span>
          </button>
        </div>
      </div>

      {/* Metrics Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* Card 1: Total Pending */}
        <div className="card" style={{
          padding: '20px',
          borderTop: '4px solid #00A896',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Pending Approvals
              </span>
              <h3 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                {stats.pendingCount}
              </h3>
            </div>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(0, 168, 150, 0.1)',
              color: '#00A896',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={20} />
            </div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Action required from Branch Manager
          </p>
        </div>

        {/* Card 2: Checks Pending Clearance */}
        <div className="card" style={{
          padding: '20px',
          borderTop: '4px solid #6366F1',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Check Clearance & Books
              </span>
              <h3 style={{ fontSize: '28px', fontWeight: 800, color: '#4F46E5', marginTop: '4px' }}>
                {stats.chequesCount}
              </h3>
            </div>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.1)',
              color: '#6366F1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckSquare size={20} />
            </div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Cheques awaiting fund clearance
          </p>
        </div>

        {/* Card 3: Money Transfers */}
        <div className="card" style={{
          padding: '20px',
          borderTop: '4px solid #10B981',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Transfer Approvals
              </span>
              <h3 style={{ fontSize: '28px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                {stats.transfersCount}
              </h3>
            </div>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ArrowRightLeft size={20} />
            </div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            High-value transfer authorizations
          </p>
        </div>

        {/* Card 4: Cash Withdrawals */}
        <div className="card" style={{
          padding: '20px',
          borderTop: '4px solid #F59E0B',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Withdrawal Approvals
              </span>
              <h3 style={{ fontSize: '28px', fontWeight: 800, color: '#D97706', marginTop: '4px' }}>
                {stats.withdrawalsCount}
              </h3>
            </div>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.1)',
              color: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ArrowDownCircle size={20} />
            </div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Counter cash withdrawals sign-off
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="card" style={{ padding: '0px', overflow: 'hidden' }}>
        {/* Navigation Tabs & Search Controls */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          background: 'rgba(248, 250, 252, 0.5)'
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('ALL')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'ALL' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'ALL' ? '#FFFFFF' : 'var(--text-muted)',
                transition: 'all 0.2s ease'
              }}
            >
              All Requests ({stats.totalRequests})
            </button>
            <button
              onClick={() => setActiveTab('CHECKS')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'CHECKS' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'CHECKS' ? '#FFFFFF' : 'var(--text-muted)',
                transition: 'all 0.2s ease'
              }}
            >
              Checks & Clearing ({stats.chequesCount})
            </button>
            <button
              onClick={() => setActiveTab('TRANSFER_APPROVAL')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'TRANSFER_APPROVAL' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'TRANSFER_APPROVAL' ? '#FFFFFF' : 'var(--text-muted)',
                transition: 'all 0.2s ease'
              }}
            >
              Transfers ({stats.transfersCount})
            </button>
            <button
              onClick={() => setActiveTab('WITHDRAWAL_APPROVAL')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'WITHDRAWAL_APPROVAL' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'WITHDRAWAL_APPROVAL' ? '#FFFFFF' : 'var(--text-muted)',
                transition: 'all 0.2s ease'
              }}
            >
              Withdrawals ({stats.withdrawalsCount})
            </button>
            <button
              onClick={() => setActiveTab('HISTORY')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'HISTORY' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'HISTORY' ? '#FFFFFF' : 'var(--text-muted)',
                transition: 'all 0.2s ease'
              }}
            >
              Review History
            </button>
          </div>

          {/* Search & Status Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={15} style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                type="text"
                placeholder="Search check #, acc, customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '32px', height: '36px', fontSize: '12px' }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input"
              style={{ height: '36px', fontSize: '12px', width: '130px', padding: '6px 10px' }}
            >
              <option value="ALL">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        <div className="table-responsive">
          <table className="custom-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Req ID & Date</th>
                <th>Request Type</th>
                <th>Customer / Account</th>
                <th>Target Details / Check #</th>
                <th>Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', minWidth: '180px' }}>Manager Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
                    <p>Loading check & authorization requests from live MongoDB database...</p>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    <CheckSquare size={36} style={{ color: '#CBD5E1', marginBottom: '8px' }} />
                    <h4 style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>No Requests Found</h4>
                    <p style={{ fontSize: '13px' }}>
                      There are no pending requests matching your current filter criteria.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.requestId || req._id} style={{ transition: 'background 0.15s ease' }}>
                    {/* Req ID & Date */}
                    <td>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', fontSize: '13px' }}>
                        {req.requestId}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {new Date(req.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>

                    {/* Request Type */}
                    <td>
                      {getTypeBadge(req.type)}
                      {req.reason && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={req.reason}>
                          {req.reason}
                        </div>
                      )}
                    </td>

                    {/* Customer Info */}
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '13px' }}>
                        {req.customerName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        Acc: {req.accountNumber}
                      </div>
                    </td>

                    {/* Target / Cheque Info */}
                    <td>
                      {req.type === 'CHEQUE_CLEARANCE' && (
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '12px', color: '#4F46E5', fontFamily: 'monospace' }}>
                            {req.chequeNumber || 'N/A'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Payee: {req.payeeName || 'Counterparty'}
                          </div>
                        </div>
                      )}

                      {req.type === 'TRANSFER_APPROVAL' && (
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>To Beneficiary:</div>
                          <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-main)', fontFamily: 'monospace' }}>
                            {req.toAccountNumber}
                          </div>
                        </div>
                      )}

                      {req.type === 'WITHDRAWAL_APPROVAL' && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Counter Cash Withdrawal
                        </div>
                      )}

                      {req.type === 'CHEQUE_BOOK' && (
                        <div style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 600 }}>
                          {req.leaves || 25} Leaves Book
                        </div>
                      )}
                    </td>

                    {/* Amount */}
                    <td>
                      {req.type === 'CHEQUE_BOOK' ? (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Free Issuance</span>
                      ) : (
                        <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--primary)' }}>
                          {formatRupee(req.amount)}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td>
                      {getStatusBadge(req.status)}
                      {req.reviewedBy && (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          By: {req.reviewedBy.split(' ')[0]}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      {req.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleOpenActionModal(req, 'approved')}
                            className="btn btn-success"
                            style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px' }}
                            title="Approve & Execute Transaction"
                          >
                            <CheckCircle2 size={13} /> Approve
                          </button>
                          <button
                            onClick={() => handleOpenActionModal(req, 'rejected')}
                            className="btn btn-danger"
                            style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px' }}
                            title="Reject / Bounce Check"
                          >
                            <XCircle size={13} /> Reject
                          </button>
                        </div>
                      ) : (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {req.reviewNotes || 'Reviewed'}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Approval / Rejection Confirmation */}
      {actionModal.open && actionModal.request && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            animation: 'scaleIn 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              background: actionModal.action === 'approved' ? 'linear-gradient(135deg, #065F46 0%, #047857 100%)' : 'linear-gradient(135deg, #991B1B 0%, #B91C1C 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {actionModal.action === 'approved' ? <ShieldCheck size={22} /> : <AlertTriangle size={22} />}
                <h3 style={{ fontSize: '17px', fontWeight: 800 }}>
                  {actionModal.action === 'approved' ? 'Approve & Execute Request' : 'Reject / Bounce Request'}
                </h3>
              </div>
              <button
                onClick={() => setActionModal({ open: false, request: null, action: 'approved', notes: '' })}
                style={{ background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              <div style={{
                background: '#F8FAFC',
                borderRadius: '10px',
                padding: '16px',
                border: '1px solid var(--border-color)',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Request ID:</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{actionModal.request.requestId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Customer:</span>
                  <span style={{ fontWeight: 600 }}>{actionModal.request.customerName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Account Number:</span>
                  <span style={{ fontFamily: 'monospace' }}>{actionModal.request.accountNumber}</span>
                </div>
                {actionModal.request.chequeNumber && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cheque Number:</span>
                    <span style={{ fontWeight: 700, color: '#4F46E5', fontFamily: 'monospace' }}>
                      {actionModal.request.chequeNumber}
                    </span>
                  </div>
                )}
                {actionModal.request.amount > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '1px dashed var(--border-color)',
                    marginTop: '8px'
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Authorization Amount:</span>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)' }}>
                      {formatRupee(actionModal.request.amount)}
                    </span>
                  </div>
                )}
              </div>

              {actionModal.action === 'approved' ? (
                <div style={{
                  padding: '12px 14px',
                  background: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                  borderRadius: '8px',
                  marginBottom: '18px',
                  fontSize: '12px',
                  color: '#15803D'
                }}>
                  <strong>Notice:</strong> Approving will immediately debit/credit the customer account, record an official ledger transaction in MongoDB, and dispatch a notification to the customer.
                </div>
              ) : (
                <div style={{
                  padding: '12px 14px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '8px',
                  marginBottom: '18px',
                  fontSize: '12px',
                  color: '#B91C1C'
                }}>
                  <strong>Warning:</strong> Rejecting will bounce or deny the request. Please provide a clear reason for audit and customer notification.
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '13px', fontWeight: 600 }}>
                  Manager Notes / Remarks
                </label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder={actionModal.action === 'approved' ? 'e.g. Signature verified against KYC records, cleared.' : 'e.g. Insufficient drawer funds or signature mismatch.'}
                  value={actionModal.notes}
                  onChange={(e) => setActionModal({ ...actionModal, notes: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setActionModal({ open: false, request: null, action: 'approved', notes: '' })}
                  className="btn btn-outline"
                  disabled={submittingAction}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteAction}
                  className={actionModal.action === 'approved' ? 'btn btn-success' : 'btn btn-danger'}
                  disabled={submittingAction}
                >
                  {submittingAction ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" /> Processing...
                    </>
                  ) : actionModal.action === 'approved' ? (
                    <>
                      <CheckCircle2 size={16} /> Confirm Approval
                    </>
                  ) : (
                    <>
                      <XCircle size={16} /> Confirm Rejection
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Process New Cheque for Clearance */}
      {showNewCheckModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '540px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            animation: 'scaleIn 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #0B1F3A 0%, #123C69 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckSquare size={22} color="#00A896" />
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Process New Check for Clearance</h3>
              </div>
              <button
                onClick={() => setShowNewCheckModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateNewCheck} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>
                    Drawer Account Number *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 601928374651"
                    value={newCheckData.accountNumber}
                    onChange={(e) => setNewCheckData({ ...newCheckData, accountNumber: e.target.value })}
                    required
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Demo: 601928374651 or 609876543210</span>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>
                    Cheque Leaf Number *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. CHQ-994821"
                    value={newCheckData.chequeNumber}
                    onChange={(e) => setNewCheckData({ ...newCheckData, chequeNumber: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>
                    Cheque Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    placeholder="e.g. 25000"
                    value={newCheckData.amount}
                    onChange={(e) => setNewCheckData({ ...newCheckData, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>
                    Beneficiary / Payee Name
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Apex Corporation"
                    value={newCheckData.payeeName}
                    onChange={(e) => setNewCheckData({ ...newCheckData, payeeName: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>
                  Reason / Cheque Purpose
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Commercial invoice settlement or vendor clearance"
                  value={newCheckData.reason}
                  onChange={(e) => setNewCheckData({ ...newCheckData, reason: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewCheckModal(false)}
                  className="btn btn-outline"
                  disabled={submittingNewCheck}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-accent"
                  disabled={submittingNewCheck}
                >
                  {submittingNewCheck ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <CheckSquare size={16} /> Submit for Clearance
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckRequests;
