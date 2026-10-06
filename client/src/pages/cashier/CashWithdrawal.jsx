import React, { useState, useEffect, useRef } from 'react';
import API from '../../services/api';
import {
  Search,
  ArrowUpCircle,
  Printer,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Calculator,
  User
} from 'lucide-react';

const CashWithdrawal = () => {
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Customer Directory & Verification State
  const [customersList, setCustomersList] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  // Cash Denomination Helper State
  const [showDenominations, setShowDenominations] = useState(false);
  const [denominations, setDenominations] = useState({
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0
  });

  const printReceiptRef = useRef(null);

  // Load customer directory on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        let res;
        try {
          res = await API.get('/cashier/customers');
        } catch {
          res = await API.get('/accounts/suggested-beneficiaries');
        }
        if (res.data?.success) {
          setCustomersList(res.data.customers || res.data.beneficiaries || []);
        }
      } catch (err) {
        console.warn('Could not load customer accounts:', err.message);
      }
    };
    fetchCustomers();
  }, []);

  // Update total amount from denominations
  const updateDenomination = (note, count) => {
    const newDenoms = { ...denominations, [note]: Math.max(0, parseInt(count, 10) || 0) };
    setDenominations(newDenoms);
    const total = Object.entries(newDenoms).reduce((sum, [val, qty]) => sum + Number(val) * qty, 0);
    if (total > 0) {
      setAmount(total.toString());
    }
  };

  const handleVerifyAccount = async (target = accountNumber) => {
    const clean = (target || '').toString().trim();
    if (!clean) return;

    setError('');
    setReceipt(null);
    setVerifying(true);

    try {
      const res = await API.get('/cashier/verify', { params: { accountNumber: clean } });
      if (res.data?.success) {
        setCustomer(res.data.account);
        setAccountNumber(res.data.account.accountNumber);
      }
    } catch (err) {
      setCustomer(null);
      setError(err.response?.data?.message || 'Customer account lookup failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSelectCustomer = (c) => {
    setAccountNumber(c.accountNumber);
    setCustomer(c);
    setError('');
    setReceipt(null);
  };

  const handleConfirmWithdrawal = async () => {
    setError('');
    const withdrawAmt = Number(amount);

    if (!withdrawAmt || withdrawAmt <= 0) {
      setError('Please enter a valid positive withdrawal amount.');
      return;
    }

    // Front-end Multi-Validation Guard
    if (customer.status !== 'active') {
      setError(`Withdrawal Rejected. Customer account status is ${customer.status.toUpperCase()}.`);
      return;
    }
    if (customer.balance < withdrawAmt) {
      setError(`Insufficient Account Balance. Current balance is ₹${customer.balance}.`);
      return;
    }
    if (withdrawAmt > 200000) {
      setError('Single transaction limit exceeded (Max ₹2,00,000). Manager authorization required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await API.post('/cashier/withdraw', {
        accountNumber: customer.accountNumber,
        amount: withdrawAmt,
        description: description || 'Cashier Counter Cash Withdrawal'
      });

      if (res.data?.success) {
        setReceipt(res.data.receipt);
        // Refresh customer balance locally
        setCustomer(prev => prev ? { ...prev, balance: res.data.receipt.balanceAfter } : null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Cash withdrawal failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const formatRupee = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ marginBottom: '24px' }} className="no-print">
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
          Cash Withdrawal System
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Teller counter cash disbursement with balance checks, limits & print receipt
        </p>
      </div>

      {receipt ? (
        <div className="card" style={{ padding: '32px', borderRadius: '16px' }}>
          {/* Printable Transaction Receipt */}
          <div ref={printReceiptRef} style={{ border: '2px dashed var(--danger)', borderRadius: '14px', padding: '24px', background: '#FFFFFF' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)' }}>🏦 SMARTBANK</div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-muted)', fontWeight: 700 }}>
                OFFICIAL CASH WITHDRAWAL RECEIPT
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Transaction ID:</span>
                <strong style={{ fontFamily: 'monospace' }}>{receipt.transactionId}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Customer Name:</span>
                <strong>{receipt.customerName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Account Number:</span>
                <strong style={{ fontFamily: 'monospace' }}>{receipt.accountNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Transaction Type:</span>
                <span className="badge badge-danger">CASH WITHDRAWAL</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Withdrawal Amount:</span>
                <strong style={{ fontSize: '18px', color: 'var(--danger)' }}>-{formatRupee(receipt.withdrawalAmount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Previous Balance:</span>
                <span>{formatRupee(receipt.balanceBefore)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>New Updated Balance:</span>
                <strong style={{ color: 'var(--accent)', fontSize: '15px' }}>{formatRupee(receipt.balanceAfter)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Authorized Cashier:</span>
                <span>{receipt.cashierName} (Cashier)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Date & Time:</span>
                <span>{new Date(receipt.date).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              Thank you for banking with SmartBank. Please count cash before leaving counter.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }} className="no-print">
            <button onClick={handlePrintReceipt} className="btn btn-primary" style={{ flex: 1, padding: '12px', fontWeight: 700 }}>
              <Printer size={16} /> Print Receipt
            </button>
            <button
              onClick={() => {
                setReceipt(null);
                setCustomer(null);
                setAccountNumber('');
                setAmount('');
                setDescription('');
                setDenominations({ 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0 });
              }}
              className="btn btn-outline"
              style={{ flex: 1, padding: '12px' }}
            >
              New Withdrawal
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '28px', borderRadius: '16px' }}>
          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid var(--danger)',
              borderRadius: '8px',
              color: 'var(--danger)',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <ShieldAlert size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Customers Directory Selector */}
          {customersList.length > 0 && !customer && (
            <div style={{ marginBottom: '22px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Quick Select Active Customer Account:
              </div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
                {customersList.slice(0, 5).map((c) => (
                  <button
                    key={c.accountNumber}
                    type="button"
                    onClick={() => handleSelectCustomer(c)}
                    style={{
                      padding: '8px 12px',
                      background: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '11px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{c.customerName}</div>
                    <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'monospace' }}>{c.accountNumber}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Account Lookup Input */}
          <form onSubmit={(e) => { e.preventDefault(); handleVerifyAccount(); }} style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ fontSize: '13px', fontWeight: 700 }}>
              Customer Account Number, Phone, or Email *
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Enter 12-digit Account (e.g. 609876543210)"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
                style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 600 }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={verifying}
                style={{ whiteSpace: 'nowrap', fontWeight: 700 }}
              >
                <Search size={16} /> {verifying ? 'Verifying...' : 'Verify Account'}
              </button>
            </div>
          </form>

          {/* Verified Customer Card & Withdrawal Actions */}
          {customer && (
            <div style={{ background: 'var(--bg-main)', padding: '22px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              
              {/* Account Info Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={13} /> Verified Customer Account
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)', margin: '4px 0 2px 0' }}>
                    {customer.customerName}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    Acc: {customer.accountNumber} • {customer.accountType || 'Savings'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Available Balance
                  </span>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--success)', marginTop: '2px' }}>
                    {formatRupee(customer.balance)}
                  </div>
                </div>
              </div>

              {/* Withdrawal Amount Input */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '13px', fontWeight: 700 }}>
                  Withdraw Cash Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  placeholder="Enter amount (e.g. 5000)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  style={{ fontSize: '16px', fontWeight: 700 }}
                />

                {/* Quick Presets */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {[1000, 2000, 5000, 10000, 20000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset.toString())}
                      style={{
                        padding: '4px 10px',
                        background: Number(amount) === preset ? 'var(--primary)' : '#FFFFFF',
                        color: Number(amount) === preset ? '#FFFFFF' : '#334155',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      +{formatRupee(preset)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Denomination Counter Toggle */}
              <div style={{ marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowDenominations(!showDenominations)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0
                  }}
                >
                  <Calculator size={14} />
                  <span>{showDenominations ? 'Hide Cash Denominations Counter ▲' : 'Open Cash Notes / Denomination Calculator ▼'}</span>
                </button>

                {showDenominations && (
                  <div style={{ marginTop: '10px', padding: '14px', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Currency Notes To Disburse
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      {[500, 200, 100, 50, 20, 10].map((note) => (
                        <div key={note} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, width: '42px' }}>₹{note}:</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            className="form-input"
                            style={{ padding: '4px 8px', fontSize: '12px', textAlign: 'center' }}
                            value={denominations[note] || ''}
                            onChange={(e) => updateDenomination(note, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Remarks */}
              <div className="form-group" style={{ marginBottom: '22px' }}>
                <label className="form-label" style={{ fontSize: '13px', fontWeight: 700 }}>
                  Cashier Remarks (Optional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Counter cash withdrawal, Self withdrawal"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Confirm CTA */}
              <button
                onClick={handleConfirmWithdrawal}
                className="btn btn-danger"
                disabled={submitting || !amount || Number(amount) <= 0}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <ArrowUpCircle size={18} />
                <span>
                  {submitting ? 'Processing Cash Disbursement...' : `PROCESS CASH WITHDRAWAL OF ${formatRupee(amount || 0)}`}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CashWithdrawal;
