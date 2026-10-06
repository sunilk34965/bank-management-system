import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import { Wallet, ArrowUpRight, ArrowDownLeft, Send, CreditCard, BookOpen, FileCheck, ArrowRight, RefreshCw, ShieldCheck, Trash2, CheckCircle2 } from 'lucide-react';

const CustomerDashboard = () => {
  const { user, account, refreshAccount } = useAuth();
  const [recentTxns, setRecentTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTxnIds, setSelectedTxnIds] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    try {
      await refreshAccount();
      const res = await API.get('/accounts/passbook');
      if (res.data.success) {
        setRecentTxns(res.data.transactions.slice(0, 5));
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedTxnIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTxnIds.length === recentTxns.length) {
      setSelectedTxnIds([]);
    } else {
      setSelectedTxnIds(recentTxns.map(t => t._id || t.transactionId));
    }
  };

  const handleDeleteSelected = async (targetId = null) => {
    let idsToDelete = targetId ? [targetId] : selectedTxnIds;

    // Default to the first (top/above) payment if none checked
    if ((!idsToDelete || idsToDelete.length === 0) && recentTxns.length > 0) {
      const topTxn = recentTxns[0];
      const topId = topTxn._id || topTxn.transactionId;
      idsToDelete = [topId];
      setSelectedTxnIds([topId]);
    }

    if (!idsToDelete || idsToDelete.length === 0) {
      alert('Please select a payment from your customer account to delete.');
      return;
    }

    const count = idsToDelete.length;
    const confirmText = count === 1 
      ? 'Are you sure you want to delete this payment from your account?'
      : `Are you sure you want to delete ${count} selected payments from your account?`;

    if (!window.confirm(confirmText)) {
      return;
    }

    setDeleting(true);
    setFeedbackMsg('');
    try {
      const res = await API.post('/transactions/delete-selected', {
        transactionIds: idsToDelete,
        restoreBalance: true
      });
      if (res.data?.success) {
        setFeedbackMsg(`✓ ${res.data.message || 'Payment deleted successfully.'} Balance refreshed.`);
        setSelectedTxnIds([]);
        await loadDashboard();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete payment.');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const formatRupee = (num) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num || 0);
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        color: '#FFFFFF',
        marginBottom: '28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div>
          <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Customer Banking Dashboard
          </span>
          <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '4px 0 8px 0' }}>
            Welcome back, {user?.name || 'Valued Customer'} 👋
          </h1>
          <div style={{ display: 'flex', gap: '20px', fontSize: '13px', opacity: 0.9 }}>
            <span>Account: <strong style={{ letterSpacing: '1px' }}>{account?.accountNumber || 'XXXX XXXX 1234'}</strong></span>
            <span>Type: <strong>{account?.accountType || 'Savings'}</strong></span>
            <span>IFSC: <strong>SMRT0000101</strong></span>
          </div>
        </div>
        <button onClick={loadDashboard} className="btn btn-outline" style={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.2)' }}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Balance Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #123C69 0%, #0B1F3A 100%)', color: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Total Balance</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={20} color="var(--accent)" />
            </div>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            {formatRupee(account?.balance)}
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
            <ShieldCheck size={14} /> Active & Secured Account
          </span>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Available Balance</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0,168,150,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={20} color="var(--accent)" />
            </div>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            {formatRupee((account?.balance || 0) * 0.96)}
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Min Balance Hold: {formatRupee((account?.balance || 0) * 0.04)}
          </span>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(0,168,150,0.08) 0%, rgba(18,60,105,0.05) 100%)', border: '1.5px solid rgba(0,168,150,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>Primary Account</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0,168,150,0.15)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={20} />
            </div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace' }}>
            {account?.accountNumber || 'N/A'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={13} /> {account?.accountType || 'Savings'} • Active
            </span>
            <Link to="/customer/transfer" className="btn btn-accent" style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 700 }}>
              Transfer &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions Shortcuts */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>Quick Banking Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>

          <Link to="/customer/transfer" className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px', cursor: 'pointer', transition: 'transform 0.2s ease' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(18, 60, 105, 0.12)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={22} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700 }}>Bank Transfer</div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>IMPS / NEFT</span>
            </div>
          </Link>

          <Link to="/customer/passbook" className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px', cursor: 'pointer' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(18, 60, 105, 0.12)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={22} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700 }}>Digital Passbook</div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Search & Print</span>
            </div>
          </Link>

          <Link to="/customer/payments" className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px', cursor: 'pointer' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.12)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={22} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700 }}>Bill Payments</div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Utilities & Recharges</span>
            </div>
          </Link>

          <Link to="/customer/chequebook" className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px', cursor: 'pointer' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.12)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileCheck size={22} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700 }}>Cheque Book</div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Request new leaves</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="card">
        {feedbackMsg && (
          <div style={{
            padding: '10px 16px',
            background: '#DCFCE7',
            border: '1px solid #22C55E',
            borderRadius: '8px',
            color: '#15803D',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} />
            <span>{feedbackMsg}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Recent Transactions</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Latest updates on your account ledger</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              id="dashboard-delete-selected-payment-btn"
              type="button"
              onClick={() => handleDeleteSelected()}
              disabled={deleting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                background: '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(220,38,38,0.25)',
                transition: 'all 0.15s ease'
              }}
              title="Delete Select Payment from customer's account"
            >
              <Trash2 size={14} />
              <span>{deleting ? 'Deleting...' : (selectedTxnIds.length > 0 ? `Delete Select Payment (${selectedTxnIds.length})` : 'Delete Select Payment')}</span>
            </button>

            <Link to="/customer/passbook" className="btn btn-outline" style={{ fontSize: '12px' }}>
              View Full Passbook <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '36px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={recentTxns.length > 0 && selectedTxnIds.length === recentTxns.length}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer' }}
                    title="Select all"
                  />
                </th>
                <th>Date & Time</th>
                <th>Txn ID</th>
                <th>Description</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Balance After</th>
                <th style={{ textAlign: 'center', width: '50px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentTxns.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No recent transactions found.
                  </td>
                </tr>
              ) : (
                recentTxns.map((t, index) => {
                  const tId = t._id || t.transactionId;
                  const isSelected = selectedTxnIds.includes(tId);
                  const isCredit = t.type === 'DEPOSIT' || (t.type === 'TRANSFER' && t.description.includes('received'));
                  return (
                    <tr key={tId} style={{ background: isSelected ? 'rgba(239,68,68,0.06)' : undefined }}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(tId)}
                          style={{ cursor: 'pointer' }}
                          title={`Select payment #${index + 1}`}
                        />
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(t.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{t.transactionId}</td>
                      <td style={{ fontWeight: 500 }}>{t.description}</td>
                      <td>
                        <span className={`badge badge-${isCredit ? 'success' : 'danger'}`}>
                          {isCredit ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                          {t.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: isCredit ? 'var(--success)' : 'var(--danger)' }}>
                        {isCredit ? '+' : '-'}{formatRupee(t.amount)}
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatRupee(t.balanceAfter)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteSelected(tId)}
                          title="Delete this payment"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
