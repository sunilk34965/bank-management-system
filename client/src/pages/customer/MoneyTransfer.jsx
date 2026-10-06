import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Send,
  Building,
  CheckCircle2,
  AlertCircle,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  User,
  Zap,
  Check
} from 'lucide-react';

const MoneyTransfer = () => {
  const { user, account, refreshAccount } = useAuth();

  // Form State
  const [toAccountNumber, setToAccountNumber] = useState('');
  const [transferType, setTransferType] = useState('IMPS');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Beneficiary Lookup State
  const [beneficiaryInfo, setBeneficiaryInfo] = useState(null);
  const [checkingBeneficiary, setCheckingBeneficiary] = useState(false);
  const [beneficiaryError, setBeneficiaryError] = useState('');
  const [customersList, setCustomersList] = useState([]);

  // Status & Success Receipt State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successReceipt, setSuccessReceipt] = useState(null);

  // Fetch all registered customers on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await API.get('/accounts/suggested-beneficiaries');
        if (res.data?.success) {
          setCustomersList(res.data.beneficiaries || []);
        }
      } catch (err) {
        console.warn('Could not load customer directory:', err.message);
      }
    };
    fetchCustomers();
  }, []);

  // Live lookup beneficiary when account number changes
  useEffect(() => {
    const clean = (toAccountNumber || '').toString().trim().replace(/[\s-]+/g, '');
    if (!clean || clean.length < 3) {
      setBeneficiaryInfo(null);
      setBeneficiaryError('');
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingBeneficiary(true);
      setBeneficiaryError('');
      try {
        const res = await API.get(`/accounts/beneficiary/${encodeURIComponent(clean)}`);
        if (res.data?.success) {
          if (res.data.beneficiary.isSameAsSender) {
            setBeneficiaryInfo(null);
            setBeneficiaryError('Cannot transfer money to your own account');
          } else {
            setBeneficiaryInfo(res.data.beneficiary);
            setBeneficiaryError('');
          }
        }
      } catch (err) {
        setBeneficiaryInfo(null);
        setBeneficiaryError(err.response?.data?.message || 'Beneficiary account not found in SmartBank');
      } finally {
        setCheckingBeneficiary(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [toAccountNumber]);

  // Quick Select Customer from Directory
  const handleSelectCustomer = (customer) => {
    setToAccountNumber(customer.accountNumber);
    setError('');
    setBeneficiaryError('');

    const formElem = document.getElementById('payment-action-form');
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 1-Click Direct Pay with Amount Preset
  const handleOneClickPayPreset = (customer, presetAmount) => {
    setToAccountNumber(customer.accountNumber);
    setAmount(presetAmount.toString());
    setError('');
    setBeneficiaryError('');
    setBeneficiaryInfo({
      customerName: customer.customerName,
      accountNumber: customer.accountNumber
    });
    setShowConfirmModal(true);
  };

  // Validate and open payment confirmation modal
  const handleInitiatePayment = (e) => {
    e.preventDefault();
    setError('');

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid amount greater than ₹0.');
      return;
    }

    if (numAmount > (account?.balance || 0)) {
      setError(`Insufficient account balance. Available: ₹${account?.balance || 0}`);
      return;
    }

    const cleanAcc = toAccountNumber.toString().trim().replace(/[\s-]+/g, '');
    if (!cleanAcc || cleanAcc.length < 5) {
      setError('Please enter a valid beneficiary account number.');
      return;
    }

    setShowConfirmModal(true);
  };

  // Execute Account Transfer
  const executePayment = async () => {
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        toAccountNumber: toAccountNumber.trim().replace(/[\s-]+/g, ''),
        amount: Number(amount),
        description: description || `${transferType} Transfer`,
        transferType,
        paymentMethod: 'ONLINE'
      };

      const res = await API.post('/transactions/transfer', payload);

      if (res.data?.success) {
        setSuccessReceipt({
          ...res.data,
          senderAccount: account?.accountNumber,
          senderName: user?.name,
          recipientTarget: toAccountNumber.trim(),
          recipientName: res.data.beneficiaryName || beneficiaryInfo?.customerName || toAccountNumber,
          transferType
        });
        await refreshAccount();
        setShowConfirmModal(false);
      } else {
        throw new Error(res.data?.message || 'Transfer failed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Transfer failed. Please verify details.';
      setError(msg);
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupee = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', paddingBottom: '48px' }}>
      
      {/* Top Header & Verification Bar */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', padding: '3px 8px', borderRadius: '6px', background: 'rgba(0,168,150,0.12)', color: 'var(--accent)' }}>
              RBI & SmartBank Verified Banking
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px', margin: 0 }}>
            Account Money Transfer
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Transfer funds securely to registered SmartBank customers or any account via IMPS, NEFT, or RTGS.
          </p>
        </div>

        {/* Account Badge */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Source Account
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>
              {account?.accountNumber || 'Loading...'}
            </div>
          </div>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(0,168,150,0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={16} />
          </div>
        </div>
      </div>

      {/* Success Transaction Receipt View */}
      {successReceipt ? (
        <div className="card" style={{ padding: '36px', textAlign: 'center', borderRadius: '18px' }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: 'rgba(34,197,94,0.12)',
            color: '#16A34A',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <CheckCircle2 size={40} />
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
            Transfer Completed Successfully!
          </h2>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)', margin: '12px 0 4px 0' }}>
            {formatRupee(successReceipt.amount)}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Transferred to <strong>{successReceipt.recipientName}</strong> (Account: {successReceipt.recipientTarget})
          </p>

          <div style={{
            background: 'var(--bg-main)',
            borderRadius: '12px',
            padding: '20px',
            fontSize: '13px',
            textAlign: 'left',
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            border: '1px solid var(--border-color)'
          }}>
            {successReceipt.refNumber && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Bank Reference (UTR):</span>
                <strong style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>
                  {successReceipt.refNumber}
                </strong>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Transaction ID:</span>
              <span style={{ fontFamily: 'monospace' }}>{successReceipt.transactionId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>From Account:</span>
              <span style={{ fontFamily: 'monospace' }}>{account?.accountNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Transfer Channel:</span>
              <span style={{ fontWeight: 600 }}>{successReceipt.transferType || 'IMPS 24x7'}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '10px',
              borderTop: '1px dashed var(--border-color)'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Updated Balance:</span>
              <strong style={{ color: 'var(--accent)', fontSize: '15px' }}>
                {formatRupee(successReceipt.newBalance)}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => {
                setSuccessReceipt(null);
                setAmount('');
                setDescription('');
                setToAccountNumber('');
                setBeneficiaryInfo(null);
              }}
              className="btn btn-primary"
              style={{ padding: '12px 24px' }}
            >
              Make Another Transfer
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Account Balance Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #0B1F3A 0%, #123C69 100%)',
            color: '#FFFFFF',
            padding: '18px 24px',
            borderRadius: '16px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 700 }}>
                Debit Account
              </span>
              <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'monospace', marginTop: '2px' }}>
                {account?.accountNumber || 'Loading...'}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                {account?.accountType || 'Savings'} • Active
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 700 }}>
                Available Balance
              </span>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#00A896', marginTop: '2px' }}>
                {formatRupee(account?.balance)}
              </div>
            </div>
          </div>

          {/* Quick Select Registered Customers Directory */}
          {customersList.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="var(--accent)" />
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Registered Beneficiaries (1-Click Select)
                  </h3>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {customersList.length} Verified Accounts
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '12px'
              }}>
                {customersList.map((c) => {
                  const isSelected = toAccountNumber === c.accountNumber;
                  return (
                    <div
                      key={c.accountNumber}
                      style={{
                        background: isSelected ? 'rgba(0,168,150,0.06)' : '#FFFFFF',
                        border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                        borderRadius: '14px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '10px',
                        boxShadow: isSelected ? '0 4px 16px rgba(0,168,150,0.15)' : 'var(--shadow-sm)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {/* Customer Info Header */}
                      <div
                        onClick={() => handleSelectCustomer(c)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                        title="Click to select this customer"
                      >
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          background: isSelected ? 'var(--accent)' : 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '15px',
                          flexShrink: 0
                        }}>
                          {c.customerName[0]}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {c.customerName}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700, fontFamily: 'monospace' }}>
                            Acc: {c.accountNumber}
                          </div>
                          <div style={{ fontSize: '10px', color: '#94A3B8' }}>
                            {c.accountType || 'Savings Account'}
                          </div>
                        </div>
                      </div>

                      {/* 1-Click Select Button */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleSelectCustomer(c)}
                          style={{
                            flex: 1,
                            padding: '7px 8px',
                            background: isSelected ? 'var(--accent)' : '#0B1F3A',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          <Zap size={13} /> {isSelected ? 'Selected' : 'Select Account'}
                        </button>
                      </div>

                      {/* 1-Click Direct Transfer Presets */}
                      <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '8px' }}>
                        <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                          Direct Transfer:
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {[500, 1000, 2000].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleOneClickPayPreset(c, preset)}
                              title={`Directly transfer ₹${preset} to ${c.customerName}`}
                              style={{
                                flex: 1,
                                padding: '4px 2px',
                                background: '#F8FAFC',
                                border: '1px solid #CBD5E1',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontWeight: 700,
                                color: '#0F172A',
                                cursor: 'pointer',
                                transition: 'all 0.1s ease'
                              }}
                            >
                              ₹{preset}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main Transfer Card */}
          <div id="payment-action-form" className="card" style={{ padding: '28px', borderRadius: '16px' }}>
            
            {/* Transfer Channel Mode Options */}
            <div style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', display: 'block' }}>
                Transfer Method
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                background: '#F1F5F9',
                borderRadius: '12px',
                padding: '5px',
                gap: '6px'
              }}>
                {[
                  { id: 'IMPS', label: 'IMPS', desc: 'Instant 24x7' },
                  { id: 'NEFT', label: 'NEFT', desc: 'Standard Transfer' },
                  { id: 'RTGS', label: 'RTGS', desc: 'High Value' }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setTransferType(mode.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '10px 8px',
                      borderRadius: '9px',
                      border: 'none',
                      background: transferType === mode.id ? '#FFFFFF' : 'transparent',
                      color: transferType === mode.id ? 'var(--primary)' : '#64748B',
                      boxShadow: transferType === mode.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 800 }}>{mode.label}</span>
                    <span style={{ fontSize: '10px', color: transferType === mode.id ? 'var(--accent)' : '#94A3B8', fontWeight: 600 }}>
                      {mode.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

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
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleInitiatePayment}>
              
              {/* Beneficiary Account Input */}
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label" style={{ fontSize: '13px', fontWeight: 700 }}>
                  Beneficiary Account Number *
                </label>
                <div style={{ position: 'relative' }}>
                  <Building size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '38px', fontSize: '14px', fontWeight: 600, fontFamily: 'monospace' }}
                    placeholder="Enter 12-digit account number (e.g. 609876543210)"
                    value={toAccountNumber}
                    onChange={(e) => setToAccountNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Beneficiary Live Verification Badge */}
              {checkingBeneficiary && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Search size={14} className="spin" /> Verifying beneficiary account in SmartBank...
                </div>
              )}

              {beneficiaryInfo && (
                <div style={{
                  marginBottom: '18px',
                  padding: '10px 14px',
                  background: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.25)',
                  borderRadius: '10px',
                  fontSize: '12px',
                  color: '#15803D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#16A34A" />
                    <span>
                      Verified Payee: <strong>{beneficiaryInfo.customerName}</strong>
                      <span style={{ marginLeft: '6px', color: '#16A34A' }}>({beneficiaryInfo.accountNumber})</span>
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', background: '#DCFCE7', padding: '2px 8px', borderRadius: '10px' }}>
                    Active Account
                  </span>
                </div>
              )}

              {beneficiaryError && (
                <div style={{
                  marginBottom: '18px',
                  padding: '10px 14px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '10px',
                  fontSize: '12px',
                  color: '#B91C1C',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} />
                  <span>{beneficiaryError}</span>
                </div>
              )}

              {/* Amount Input */}
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>
                    Transfer Amount (₹) *
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Available: {formatRupee(account?.balance)}
                  </span>
                </div>
                <input
                  id="transfer-amount-input"
                  type="number"
                  min="1"
                  className="form-input"
                  placeholder="Enter amount (e.g. 2500)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  style={{ fontSize: '16px', fontWeight: 700 }}
                />

                {/* Quick Presets */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {[500, 1000, 2000, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset.toString())}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: Number(amount) === preset ? 'var(--primary)' : '#F1F5F9',
                        color: Number(amount) === preset ? '#FFFFFF' : 'var(--text-muted)',
                        border: 'none',
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

              {/* Note / Remarks */}
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ fontSize: '13px', fontWeight: 700 }}>
                  Payment Remark / Note
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rent, Vendor Payment, Personal"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="btn btn-accent"
                disabled={submitting}
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
                <Send size={18} />
                <span>Confirm Bank Transfer ({amount ? formatRupee(amount) : '₹0'})</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </>
      )}

      {/* Account Transfer Confirm Modal */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(11,31,58,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '16px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '440px',
            padding: '28px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)', marginBottom: '16px' }}>
              Confirm Bank Transfer
            </h3>

            <div style={{
              background: '#F8FAFC',
              borderRadius: '10px',
              padding: '14px',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: '20px',
              border: '1px solid #E2E8F0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Beneficiary Account:</span>
                <strong style={{ fontFamily: 'monospace' }}>{toAccountNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Beneficiary Name:</span>
                <span>{beneficiaryInfo?.customerName || 'SmartBank Customer'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Transfer Channel:</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{transferType}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Amount:</span>
                <strong style={{ color: 'var(--accent)', fontSize: '15px' }}>{formatRupee(amount)}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="btn btn-outline"
                style={{ flex: 1 }}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executePayment}
                className="btn btn-primary"
                style={{ flex: 2, fontWeight: 700 }}
                disabled={submitting}
              >
                {submitting ? 'Transferring...' : 'Confirm Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MoneyTransfer;
