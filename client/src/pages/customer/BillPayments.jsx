import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Zap, Droplet, Smartphone, Globe, GraduationCap, CreditCard, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

const BillPayments = () => {
  const { account, refreshAccount } = useAuth();
  const [category, setCategory] = useState('Electricity');
  const [merchantName, setMerchantName] = useState('Adani Electricity Mumbai');
  const [consumerNumber, setConsumerNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successPayment, setSuccessPayment] = useState(null);

  // Past payments history & selection state
  const [pastPayments, setPastPayments] = useState([]);
  const [selectedTxnIds, setSelectedTxnIds] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState('');

  const loadPastPayments = async () => {
    try {
      const res = await API.get('/accounts/passbook', { params: { type: 'PAYMENT' } });
      if (res.data?.success) {
        setPastPayments(res.data.transactions || []);
      }
    } catch (e) {
      console.warn('Failed to load past payments:', e.message);
    }
  };

  useEffect(() => {
    loadPastPayments();
  }, []);

  const handleToggleSelect = (id) => {
    setSelectedTxnIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTxnIds.length === pastPayments.length) {
      setSelectedTxnIds([]);
    } else {
      setSelectedTxnIds(pastPayments.map(p => p._id || p.transactionId));
    }
  };

  const handleDeleteSelected = async (targetId = null) => {
    let idsToDelete = targetId ? [targetId] : selectedTxnIds;

    // Default to the first (top/above) payment if none checked
    if ((!idsToDelete || idsToDelete.length === 0) && pastPayments.length > 0) {
      const topP = pastPayments[0];
      const topId = topP._id || topP.transactionId;
      idsToDelete = [topId];
      setSelectedTxnIds([topId]);
    }

    if (!idsToDelete || idsToDelete.length === 0) {
      alert('Please select a payment from your customer account to delete.');
      return;
    }

    const count = idsToDelete.length;
    if (!window.confirm(`Are you sure you want to delete ${count} selected payment(s)? This will refund the amount back to your account.`)) {
      return;
    }

    setDeleting(true);
    setDeleteMsg('');
    try {
      const res = await API.post('/transactions/delete-selected', {
        transactionIds: idsToDelete,
        restoreBalance: true
      });
      if (res.data?.success) {
        setDeleteMsg(`✓ ${res.data.message || 'Payment deleted successfully.'} Balance refreshed.`);
        setSelectedTxnIds([]);
        await loadPastPayments();
        if (refreshAccount) await refreshAccount();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete payment.');
    } finally {
      setDeleting(false);
    }
  };

  const categories = [
    { id: 'Electricity', label: 'Electricity', icon: Zap, defaultMerchant: 'Adani Electricity Mumbai' },
    { id: 'Water', label: 'Water Tax', icon: Droplet, defaultMerchant: 'Municipal Water Board' },
    { id: 'Mobile', label: 'Mobile Postpaid', icon: Smartphone, defaultMerchant: 'Jio / Airtel Prepaid' },
    { id: 'Internet', label: 'Broadband', icon: Globe, defaultMerchant: 'Airtel Xstream Fiber' },
    { id: 'Education', label: 'College Fees', icon: GraduationCap, defaultMerchant: 'University Board' }
  ];

  const handleCategorySelect = (cat) => {
    setCategory(cat.id);
    setMerchantName(cat.defaultMerchant);
    setError('');
  };

  const handlePayBill = async (e) => {
    e.preventDefault();
    setError('');
    if (!consumerNumber || !amount || Number(amount) <= 0) {
      setError('Please provide consumer number and amount');
      return;
    }

    setSubmitting(true);
    try {
      const res = await API.post('/transactions/payment', {
        category,
        merchantName,
        consumerNumber,
        amount: Number(amount)
      });

      if (res.data.success) {
        setSuccessPayment(res.data.payment);
        await refreshAccount();
        await loadPastPayments();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupee = (num) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num || 0);
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)' }}>Utility & Bill Payments</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Simulated instant bill payments with direct debit</p>
      </div>

      {/* Category Pills Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px', marginBottom: '24px' }}>
        {categories.map((c) => {
          const IconComp = c.icon;
          const isSelected = category === c.id;
          return (
            <button
              key={c.id}
              onClick={() => handleCategorySelect(c)}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '14px',
                borderColor: isSelected ? 'var(--accent)' : 'var(--border-color)',
                background: isSelected ? 'rgba(0,168,150,0.06)' : 'var(--bg-card)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <IconComp size={20} color={isSelected ? 'var(--accent)' : 'var(--text-muted)'} />
              <span style={{ fontSize: '12px', fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--accent)' : 'var(--text-main)' }}>
                {c.label}
              </span>
            </button>
          );
        })}
      </div>

      {successPayment ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(34,197,94,0.12)', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <CheckCircle2 size={36} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>Payment Successful!</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '8px 0 20px 0' }}>
            ₹{successPayment.amount} paid to <strong>{successPayment.merchantName}</strong>
          </p>

          <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '10px', fontSize: '13px', textAlign: 'left', marginBottom: '24px' }}>
            <div>Reference No: <strong style={{ fontFamily: 'monospace' }}>{successPayment.referenceNo}</strong></div>
            <div>Consumer No: <strong>{successPayment.consumerNumber}</strong></div>
            <div>Category: <strong>{successPayment.category}</strong></div>
          </div>

          <button onClick={() => { setSuccessPayment(null); setConsumerNumber(''); setAmount(''); }} className="btn btn-primary">
            Make Another Payment
          </button>
        </div>
      ) : (
        <div className="card">
          {error && (
            <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: '8px', color: 'var(--danger)', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handlePayBill}>
            <div className="form-group">
              <label className="form-label">Merchant / Biller Name</label>
              <input
                type="text"
                className="form-input"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Consumer / Account ID Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 102938475"
                value={consumerNumber}
                onChange={(e) => setConsumerNumber(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Bill Amount (₹)</label>
              <input
                type="number"
                className="form-input"
                placeholder="2500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-accent" disabled={submitting} style={{ width: '100%', padding: '12px', fontSize: '15px' }}>
              {submitting ? 'Processing Payment...' : `Pay ₹${amount || 0} Now`}
            </button>
          </form>
        </div>
      )}

      {/* Past Bill Payments Section with Delete Select Payment */}
      <div className="card" style={{ marginTop: '28px' }}>
        {deleteMsg && (
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
            <span>{deleteMsg}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
              Past Utility Payments
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              History of bill payments on your customer account
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              id="bill-delete-selected-payment-btn"
              type="button"
              onClick={() => handleDeleteSelected()}
              disabled={deleting || pastPayments.length === 0}
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
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '36px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={pastPayments.length > 0 && selectedTxnIds.length === pastPayments.length}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer' }}
                    title="Select all"
                  />
                </th>
                <th>Date</th>
                <th>Txn ID</th>
                <th>Biller / Description</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'center', width: '50px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pastPayments.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No utility bill payment records found.
                  </td>
                </tr>
              ) : (
                pastPayments.map((p, index) => {
                  const pId = p._id || p.transactionId;
                  const isSelected = selectedTxnIds.includes(pId);
                  return (
                    <tr key={pId} style={{ background: isSelected ? 'rgba(239,68,68,0.06)' : undefined }}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(pId)}
                          style={{ cursor: 'pointer' }}
                          title={`Select payment #${index + 1}`}
                        />
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(p.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.transactionId}</td>
                      <td style={{ fontWeight: 500 }}>{p.description}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }}>
                        -{formatRupee(p.amount)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteSelected(pId)}
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

export default BillPayments;
