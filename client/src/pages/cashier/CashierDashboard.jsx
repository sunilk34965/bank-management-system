import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { Link } from 'react-router-dom';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  Layers,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  DollarSign
} from 'lucide-react';

const CashierDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await API.get('/cashier/summary');
      if (res.data?.success) {
        setSummary(res.data);
      }
    } catch (err) {
      console.error('Cashier summary error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const formatRupee = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num ?? 0);
  };

  // Filter transactions
  const transactions = (summary?.recentTransactions || []).filter((t) => {
    const matchesSearch =
      !searchTerm ||
      (t.transactionId && t.transactionId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.accountNumber && t.accountNumber.includes(searchTerm));

    const matchesType =
      typeFilter === 'ALL' || t.type === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
            Cashier Counter Dashboard
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Daily cash ledger summary, teller counter transactions, and disbursements
          </p>
        </div>
        <button
          onClick={fetchSummary}
          className="btn btn-outline"
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--success)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Today's Deposits
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowDownCircle size={20} color="var(--success)" />
            </div>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, marginTop: '10px', color: 'var(--success)' }}>
            {formatRupee(summary?.todayDeposits ?? 0)}
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cash received at teller</span>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--danger)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Today's Withdrawals
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpCircle size={20} color="var(--danger)" />
            </div>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, marginTop: '10px', color: 'var(--danger)' }}>
            {formatRupee(summary?.todayWithdrawals ?? 0)}
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cash disbursed to customers</span>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--accent)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Net Counter Flow
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0,168,150,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} color="var(--accent)" />
            </div>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, marginTop: '10px', color: (summary?.netCashFlow ?? 0) >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
            {formatRupee(summary?.netCashFlow ?? 0)}
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Deposits minus Withdrawals</span>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--primary)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Counter Transactions
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(18,60,105,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={20} color="var(--primary)" />
            </div>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, marginTop: '10px', color: 'var(--primary)' }}>
            {summary?.totalCounterTransactions ?? 0}
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Operations processed</span>
        </div>
      </div>

      {/* Action Shortcut Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <Link
          to="/cashier/deposit"
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #123C69 0%, #0B1F3A 100%)',
            color: '#FFFFFF',
            padding: '24px',
            textDecoration: 'none',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-md)',
            transition: 'transform 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowDownCircle size={30} color="var(--success)" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Deposit Cash</h3>
              <p style={{ fontSize: '12px', opacity: 0.8, margin: '4px 0 0 0' }}>Verify customer account & deposit cash</p>
            </div>
          </div>
          <ArrowRight size={22} />
        </Link>

        <Link
          to="/cashier/withdraw"
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #0B1F3A 0%, #123C69 100%)',
            color: '#FFFFFF',
            padding: '24px',
            textDecoration: 'none',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-md)',
            transition: 'transform 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpCircle size={30} color="var(--danger)" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Withdraw Cash</h3>
              <p style={{ fontSize: '12px', opacity: 0.8, margin: '4px 0 0 0' }}>Validate balance, limits & withdraw cash</p>
            </div>
          </div>
          <ArrowRight size={22} />
        </Link>
      </div>

      {/* Counter Ledger Activity */}
      <div className="card" style={{ padding: '24px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
              Counter Activity Log
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Recent counter cash transactions
            </span>
          </div>

          {/* Search & Filters */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search account or txn..."
                className="form-input"
                style={{ padding: '7px 10px 7px 32px', fontSize: '12px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '8px', padding: '3px' }}>
              {['ALL', 'DEPOSIT', 'WITHDRAW'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTypeFilter(type)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: typeFilter === type ? '#FFFFFF' : 'transparent',
                    color: typeFilter === type ? 'var(--primary)' : '#64748B',
                    fontWeight: typeFilter === type ? 700 : 500,
                    fontSize: '11px',
                    cursor: 'pointer',
                    boxShadow: typeFilter === type ? '0 1px 4px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  {type === 'ALL' ? 'All' : type === 'DEPOSIT' ? 'Deposits' : 'Withdrawals'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Txn ID</th>
                <th>Account</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Processed By</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No counter transactions found. Process a deposit or withdrawal above to view activity.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t._id || t.transactionId}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{t.transactionId}</td>
                    <td style={{ fontFamily: 'monospace' }}>{t.accountNumber}</td>
                    <td>
                      <span className={`badge badge-${t.type === 'DEPOSIT' ? 'success' : 'danger'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: t.type === 'DEPOSIT' ? 'var(--success)' : 'var(--danger)' }}>
                      {t.type === 'DEPOSIT' ? '+' : '-'}{formatRupee(t.amount)}
                    </td>
                    <td style={{ fontSize: '13px' }}>{t.performedByName || 'Cashier Counter'}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(t.createdAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CashierDashboard;
