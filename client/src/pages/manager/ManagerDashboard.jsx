import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import { 
  Users, 
  Wallet, 
  ArrowDownCircle, 
  CheckSquare, 
  BarChart2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Lock, 
  Unlock, 
  Search, 
  RefreshCw,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ManagerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('approvals'); // 'approvals', 'customers', 'accounts', 'analytics'
  const [search, setSearch] = useState('');
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });
  const [processingId, setProcessingId] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await API.get('/manager/dashboard');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Manager dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const formatRupee = (num) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num || 0);
  };

  // Handle Approve Action for Cheque Request or Account Opening
  const handleApproveItem = async (item) => {
    setProcessingId(item.id);
    setActionMsg({ type: '', text: '' });
    try {
      if (item.type === 'CHEQUE_REQUEST') {
        const res = await API.post('/manager/cheque/status', {
          chequeBookId: item.chequeBookId || item.id,
          status: 'approved'
        });
        if (res.data.success) {
          setActionMsg({ type: 'success', text: `✓ Cheque Book Request for ${item.customerName} approved successfully!` });
        }
      } else if (item.type === 'ACCOUNT_APPROVAL') {
        const res = await API.post('/manager/account/approval', {
          accountNumber: item.accountNumber,
          status: 'approved'
        });
        if (res.data.success) {
          setActionMsg({ type: 'success', text: `✓ Account ${item.accountNumber} for ${item.customerName} activated and approved!` });
        }
      }
      await fetchDashboard();
    } catch (err) {
      setActionMsg({ type: 'danger', text: err.response?.data?.message || 'Approval action failed.' });
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Reject Action
  const handleRejectItem = async (item) => {
    setProcessingId(item.id);
    setActionMsg({ type: '', text: '' });
    try {
      if (item.type === 'CHEQUE_REQUEST') {
        const res = await API.post('/manager/cheque/status', {
          chequeBookId: item.chequeBookId || item.id,
          status: 'rejected'
        });
        if (res.data.success) {
          setActionMsg({ type: 'warning', text: `Cheque Book Request for ${item.customerName} rejected.` });
        }
      } else if (item.type === 'ACCOUNT_APPROVAL') {
        const res = await API.post('/manager/account/approval', {
          accountNumber: item.accountNumber,
          status: 'rejected'
        });
        if (res.data.success) {
          setActionMsg({ type: 'warning', text: `Account opening for ${item.customerName} rejected.` });
        }
      }
      await fetchDashboard();
    } catch (err) {
      setActionMsg({ type: 'danger', text: err.response?.data?.message || 'Rejection action failed.' });
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Freeze/Unfreeze Account
  const handleToggleFreeze = async (accountNumber, currentStatus) => {
    const newStatus = currentStatus === 'frozen' ? 'active' : 'frozen';
    setActionMsg({ type: '', text: '' });
    try {
      const res = await API.post('/manager/account/freeze', {
        accountNumber,
        status: newStatus
      });
      if (res.data.success) {
        setActionMsg({ 
          type: 'success', 
          text: `Account ${accountNumber} has been ${newStatus.toUpperCase()}` 
        });
        await fetchDashboard();
      }
    } catch (err) {
      setActionMsg({ type: 'danger', text: err.response?.data?.message || 'Failed to update account status.' });
    }
  };

  // Data Selectors
  const pendingApprovals = data?.pendingApprovals || [];
  const customersList = (data?.customersList || []).filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.accountNumber && c.accountNumber.includes(search))
  );
  const activeAccountsList = (data?.activeAccountsList || []).filter(a => 
    a.accountNumber.includes(search) ||
    a.customerName.toLowerCase().includes(search.toLowerCase())
  );
  const filteredPending = pendingApprovals.filter(p => 
    p.customerName.toLowerCase().includes(search.toLowerCase()) ||
    p.accountNumber.includes(search) ||
    p.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        color: '#FFFFFF',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Branch Management Portal
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0' }}>Manager Executive Dashboard</h1>
          <p style={{ fontSize: '13px', opacity: 0.9 }}>
            Directly approve customer accounts, manage active accounts, and process cheque requests
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to="/manager/check-requests" className="btn btn-accent" style={{ fontSize: '13px', padding: '9px 16px' }}>
            <CheckSquare size={16} /> Check & Approvals Portal
          </Link>
          <button onClick={fetchDashboard} className="btn btn-outline" style={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.2)' }}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Action Notification Alert Banner */}
      {actionMsg.text && (
        <div style={{
          padding: '14px 18px',
          background: actionMsg.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : actionMsg.type === 'warning' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${actionMsg.type === 'success' ? 'var(--success)' : actionMsg.type === 'warning' ? 'var(--warning)' : 'var(--danger)'}`,
          borderRadius: 'var(--radius-md)',
          color: actionMsg.type === 'success' ? '#16A34A' : actionMsg.type === 'warning' ? '#D97706' : 'var(--danger)',
          fontSize: '14px',
          fontWeight: 600,
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {actionMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Stats Cards - Interactive Click to Filter Tab */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        
        {/* Pending Approvals Metric Card */}
        <div 
          onClick={() => setActiveTab('approvals')}
          className="card"
          style={{ 
            cursor: 'pointer',
            borderLeft: '4px solid var(--warning)',
            background: activeTab === 'approvals' ? 'rgba(245, 158, 11, 0.04)' : 'var(--bg-card)',
            boxShadow: activeTab === 'approvals' ? '0 0 0 2px var(--warning)' : 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Items Pending Approval</span>
            <CheckSquare size={20} color="var(--warning)" />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--warning)' }}>
            {data?.stats?.pendingApprovalsCount ?? pendingApprovals.length}
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--warning)', fontWeight: 700 }}>
            ⚡ Click to Grant Approvals
          </span>
        </div>

        {/* Total Customers Metric Card */}
        <div 
          onClick={() => setActiveTab('customers')}
          className="card"
          style={{ 
            cursor: 'pointer',
            borderLeft: '4px solid var(--primary)',
            background: activeTab === 'customers' ? 'rgba(11, 31, 58, 0.04)' : 'var(--bg-card)',
            boxShadow: activeTab === 'customers' ? '0 0 0 2px var(--primary)' : 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Customers</span>
            <Users size={20} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--primary)' }}>
            {data?.stats?.totalCustomers || (data?.customersList || []).length}
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}>
            👥 Click to View Customer List
          </span>
        </div>

        {/* Active Accounts Metric Card */}
        <div 
          onClick={() => setActiveTab('accounts')}
          className="card"
          style={{ 
            cursor: 'pointer',
            borderLeft: '4px solid var(--accent)',
            background: activeTab === 'accounts' ? 'rgba(0, 168, 150, 0.04)' : 'var(--bg-card)',
            boxShadow: activeTab === 'accounts' ? '0 0 0 2px var(--accent)' : 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Active Accounts</span>
            <Wallet size={20} color="var(--accent)" />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--accent)' }}>
            {data?.stats?.activeAccounts || (data?.activeAccountsList || []).length}
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700 }}>
            💳 Click to View Active Accounts
          </span>
        </div>

        {/* Branch Deposits Metric Card */}
        <div 
          onClick={() => setActiveTab('analytics')}
          className="card"
          style={{ 
            cursor: 'pointer',
            borderLeft: '4px solid var(--success)',
            background: activeTab === 'analytics' ? 'rgba(34, 197, 94, 0.04)' : 'var(--bg-card)',
            boxShadow: activeTab === 'analytics' ? '0 0 0 2px var(--success)' : 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Branch Deposits</span>
            <ArrowDownCircle size={20} color="var(--success)" />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--success)' }}>
            {formatRupee(data?.stats?.totalDeposits || 1850000)}
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 700 }}>
            📊 Click for Financial Analytics
          </span>
        </div>

      </div>

      {/* Main Content Area with Tab Controls */}
      <div className="card" style={{ padding: '24px' }}>
        
        {/* Navigation Tabs Header & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`btn ${activeTab === 'approvals' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '13px', position: 'relative' }}
            >
              <CheckSquare size={16} />
              Pending Approvals
              {pendingApprovals.length > 0 && (
                <span style={{
                  background: 'var(--warning)',
                  color: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 800,
                  marginLeft: '4px'
                }}>
                  {pendingApprovals.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`btn ${activeTab === 'customers' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '13px' }}
            >
              <Users size={16} />
              Total Customers ({(data?.customersList || []).length})
            </button>

            <button
              onClick={() => setActiveTab('accounts')}
              className={`btn ${activeTab === 'accounts' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '13px' }}
            >
              <Wallet size={16} />
              Active Accounts ({(data?.activeAccountsList || []).length})
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '13px' }}
            >
              <BarChart2 size={16} />
              Analytics & Charts
            </button>
          </div>

          {/* Search Box */}
          {activeTab !== 'analytics' && (
            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '34px', fontSize: '13px' }}
                placeholder={`Search ${activeTab}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

        </div>

        {/* TAB 1: ITEMS PENDING APPROVAL */}
        {activeTab === 'approvals' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)' }}>
                Items Pending Manager Approval
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Review customer applications, cheque requests, and new account registrations. Grant or reject approval directly.
              </p>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Item Type</th>
                    <th>Customer Name</th>
                    <th>Account Number</th>
                    <th>Request Details</th>
                    <th>Requested Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Manager Grant Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPending.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎉</div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>All catch-up complete!</div>
                        <div style={{ fontSize: '12px' }}>No items currently waiting for manager approval.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredPending.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <span className={`badge badge-${item.type === 'ACCOUNT_APPROVAL' ? 'info' : 'warning'}`}>
                            {item.type === 'ACCOUNT_APPROVAL' ? '🆕 Account Opening' : '📝 Cheque Request'}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.customerName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.title}</div>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.accountNumber}</td>
                        <td style={{ fontWeight: 500 }}>{item.details}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {item.requestedAt ? new Date(item.requestedAt).toLocaleDateString('en-IN') : 'Today'}
                        </td>
                        <td>
                          <span className="badge badge-warning">
                            <Clock size={12} /> PENDING
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleApproveItem(item)}
                              disabled={processingId === item.id}
                              className="btn btn-success"
                              style={{ padding: '6px 14px', fontSize: '12px' }}
                            >
                              <CheckCircle2 size={14} />
                              {processingId === item.id ? 'Approving...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleRejectItem(item)}
                              disabled={processingId === item.id}
                              className="btn btn-danger"
                              style={{ padding: '6px 14px', fontSize: '12px' }}
                            >
                              <XCircle size={14} />
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: TOTAL CUSTOMERS LIST */}
        {activeTab === 'customers' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)' }}>
                Registered Customer Directory
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                View complete list of registered customers, contact details, account links, and status.
              </p>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Email Address</th>
                    <th>Contact Phone</th>
                    <th>Account Number</th>
                    <th>Account Type</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Account Security</th>
                  </tr>
                </thead>
                <tbody>
                  {customersList.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        No customer records match search query.
                      </td>
                    </tr>
                  ) : (
                    customersList.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{c.name}</div>
                        </td>
                        <td style={{ fontSize: '13px' }}>{c.email}</td>
                        <td style={{ fontSize: '13px' }}>{c.phone}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.accountNumber}</td>
                        <td>{c.accountType}</td>
                        <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{formatRupee(c.balance)}</td>
                        <td>
                          <span className={`badge badge-${c.status}`}>
                            {c.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {c.status === 'frozen' ? (
                            <button
                              onClick={() => handleToggleFreeze(c.accountNumber, c.status)}
                              className="btn btn-success"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              <Unlock size={14} /> Unfreeze Account
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleFreeze(c.accountNumber, c.status)}
                              className="btn btn-danger"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              <Lock size={14} /> Freeze Account
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ACTIVE ACCOUNTS LIST */}
        {activeTab === 'accounts' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)' }}>
                Active Accounts Ledger
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Overview of all currently active savings & current accounts in the branch network.
              </p>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Account Number</th>
                    <th>Account Holder</th>
                    <th>Email Address</th>
                    <th>Account Type</th>
                    <th>Ledger Balance</th>
                    <th>Opened Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeAccountsList.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        No active accounts found matching search.
                      </td>
                    </tr>
                  ) : (
                    activeAccountsList.map((acc) => (
                      <tr key={acc._id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                          {acc.accountNumber}
                        </td>
                        <td style={{ fontWeight: 600 }}>{acc.customerName}</td>
                        <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{acc.customerEmail}</td>
                        <td>
                          <span className="badge badge-info">{acc.accountType}</span>
                        </td>
                        <td style={{ fontWeight: 800, color: 'var(--success)' }}>
                          {formatRupee(acc.balance)}
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {acc.openedAt ? new Date(acc.openedAt).toLocaleDateString('en-IN') : 'N/A'}
                        </td>
                        <td>
                          <span className="badge badge-active">● ACTIVE</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: FINANCIAL ANALYTICS */}
        {activeTab === 'analytics' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)' }}>
                Financial Transaction Analytics
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Monthly breakdown of deposits, withdrawals, and transfer volumes
              </p>
            </div>

            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <AreaChart data={data?.analytics || []}>
                  <defs>
                    <linearGradient id="colorDep" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorWith" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={12} />
                  <Tooltip formatter={(value) => formatRupee(value)} />
                  <Legend />
                  <Area type="monotone" dataKey="deposits" stroke="#22C55E" fillOpacity={1} fill="url(#colorDep)" name="Deposits (₹)" />
                  <Area type="monotone" dataKey="withdrawals" stroke="#EF4444" fillOpacity={1} fill="url(#colorWith)" name="Withdrawals (₹)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ManagerDashboard;
