import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  FileCheck,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  AlertCircle,
  Truck,
  Building,
  CreditCard,
  Copy,
  Check,
  RefreshCw,
  FileText,
  Sparkles,
  Info,
  Ban,
  ArrowRight
} from 'lucide-react';

const ChequeBook = () => {
  const { user, account, refreshAccount } = useAuth();
  const [chequebooks, setChequebooks] = useState([]);
  const [summary, setSummary] = useState({
    activeBooksCount: 0,
    pendingBooksCount: 0,
    totalRemainingLeaves: 0,
    totalUsedLeaves: 0
  });
  const [leaves, setLeaves] = useState(25);
  const [deliveryMethod, setDeliveryMethod] = useState('Registered Speed Post');
  const [deliveryAddress, setDeliveryAddress] = useState(
    user?.address || 'Flat 402, Skyline Towers, Andheri East, Mumbai, MH - 400069'
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('REQUEST'); // 'REQUEST', 'HISTORY', 'STOP_CHEQUE'
  const [stopChequeNumber, setStopChequeNumber] = useState('');
  const [stopReason, setStopReason] = useState('Lost or Misplaced');
  const [stopSuccessMsg, setStopSuccessMsg] = useState('');

  const fetchChequeStatus = async () => {
    setLoading(true);
    try {
      const res = await API.get('/transactions/chequebook/status');
      if (res.data?.success) {
        setChequebooks(res.data.chequebooks || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err) {
      console.error('Cheque status error:', err);
      showToast(err.response?.data?.message || 'Could not load cheque books.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChequeStatus();
    if (user?.address) {
      setDeliveryAddress(user.address);
    }
  }, [user]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleCopyAccount = () => {
    if (account?.accountNumber) {
      navigator.clipboard.writeText(account.accountNumber);
      setCopiedAcc(true);
      setTimeout(() => setCopiedAcc(false), 2000);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!account?.accountNumber) {
      showToast('No active account linked for cheque book request.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await API.post('/transactions/chequebook/request', {
        leaves: Number(leaves),
        deliveryMethod,
        deliveryAddress: deliveryMethod === 'Registered Speed Post' ? deliveryAddress : 'Central Branch Counter Collection',
        accountNumber: account.accountNumber
      });

      if (res.data?.success) {
        showToast(res.data.message || 'Cheque book request submitted successfully!', 'success');
        await fetchChequeStatus();
        await refreshAccount();
        setActiveTab('HISTORY');
      } else {
        throw new Error(res.data?.message || 'Request failed');
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to submit cheque book request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStopChequeSubmit = (e) => {
    e.preventDefault();
    if (!stopChequeNumber.trim()) {
      showToast('Please enter a valid Cheque Number to stop.', 'error');
      return;
    }
    setStopSuccessMsg(`Stop Payment Order registered for Cheque #${stopChequeNumber}. Reason: ${stopReason}. Our branch clearing desk has blocked clearance.`);
    setStopChequeNumber('');
    showToast(`Stop Payment registered for Cheque #${stopChequeNumber}`, 'success');
  };

  // Find most recent approved cheque book for the interactive preview
  const primaryChequeBook = chequebooks.find(c => c.status === 'approved') || chequebooks[0];

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '50px' }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          background: toast.type === 'success' ? '#10B981' : '#EF4444',
          color: '#FFFFFF',
          padding: '14px 20px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          fontWeight: 600,
          animation: 'fadeIn 0.3s ease'
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        color: '#FFFFFF',
        marginBottom: '28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div>
          <span style={{
            fontSize: '12px',
            color: 'var(--accent)',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '4px'
          }}>
            <ShieldCheck size={14} /> CTS-2010 Compliant
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '2px 0 6px 0', letterSpacing: '-0.5px' }}>
            Cheque Book Services
          </h1>
          <p style={{ fontSize: '13px', opacity: 0.9, margin: 0 }}>
            Request personalized cheque books, track leaf balances, and manage clearing security
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={fetchChequeStatus}
            className="btn btn-outline"
            style={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.25)', fontSize: '13px' }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Summary Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '18px',
        marginBottom: '28px'
      }}>
        {/* Linked Account Card */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>LINKED ACCOUNT</span>
            <button
              onClick={handleCopyAccount}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
              title="Copy account number"
            >
              {copiedAcc ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
            </button>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '1px', color: 'var(--primary)' }}>
            {account?.accountNumber ? account.accountNumber.replace(/(\d{4})/g, '$1 ').trim() : '6019 2837 4651'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {account?.accountType || 'Savings'} Account • IFSC: SMRT0000101
          </div>
        </div>

        {/* Active Cheque Books */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE BOOKS</span>
            <FileCheck size={18} color="var(--accent)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)' }}>
            {summary.activeBooksCount} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>Issued</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 600, marginTop: '4px' }}>
            ✓ Verified with Branch Central Vault
          </div>
        </div>

        {/* Remaining Leaves */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>AVAILABLE LEAVES</span>
            <FileText size={18} color="#10B981" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10B981' }}>
            {summary.totalRemainingLeaves || 0} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>Leaves Ready</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {summary.totalUsedLeaves || 0} leaves cleared so far
          </div>
        </div>

        {/* Pending Requests */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>PENDING APPROVAL</span>
            <Clock size={18} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: summary.pendingBooksCount > 0 ? '#F59E0B' : 'var(--text-main)' }}>
            {summary.pendingBooksCount} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>In Review</span>
          </div>
          <div style={{ fontSize: '11px', color: summary.pendingBooksCount > 0 ? '#F59E0B' : 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
            {summary.pendingBooksCount > 0 ? '⚡ Under Branch Manager check' : '✓ No pending requests'}
          </div>
        </div>
      </div>

      {/* Interactive Visual Cheque Mockup Card */}
      <div className="card" style={{
        padding: '24px',
        marginBottom: '28px',
        background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 50%, #F8FAFC 100%)',
        border: '1.5px dashed #A7F3D0',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Cheque Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                background: 'var(--primary)',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '4px',
                letterSpacing: '0.5px'
              }}>
                SMARTBANK
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>
                SMARTBANK OF INDIA
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Central Branch (00101) • Andheri East, Mumbai 400069 • IFSC: SMRT0000101
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: '1px solid #CBD5E1',
            padding: '4px 10px',
            borderRadius: '6px',
            background: '#FFFFFF',
            fontSize: '11px',
            fontFamily: 'monospace'
          }}>
            <span>VALID FOR 3 MONTHS</span>
            <span style={{ color: '#94A3B8' }}>|</span>
            <strong>DATE: DD / MM / YYYY</strong>
          </div>
        </div>

        {/* Cheque Body Lines */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '16px',
          alignItems: 'center',
          marginBottom: '16px',
          fontSize: '12px',
          color: '#334155'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', borderBottom: '1px dotted #94A3B8', paddingBottom: '4px', marginBottom: '8px' }}>
              <span style={{ fontWeight: 700, minWidth: '40px' }}>PAY:</span>
              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Self / Any Beneficiary or Bearer</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', borderBottom: '1px dotted #94A3B8', paddingBottom: '4px' }}>
              <span style={{ fontWeight: 700, minWidth: '40px' }}>RUPEES:</span>
              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Payable at par at all branch locations of SmartBank</span>
            </div>
          </div>

          {/* Amount Box */}
          <div style={{
            border: '2px solid #64748B',
            borderRadius: '6px',
            background: '#FFFFFF',
            padding: '8px 16px',
            fontWeight: 800,
            fontSize: '16px',
            minWidth: '130px',
            textAlign: 'center',
            color: 'var(--primary)'
          }}>
            ₹&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/-
          </div>
        </div>

        {/* Cheque Footer: Account & Signatory */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          paddingTop: '8px',
          borderTop: '1px dashed #CBD5E1',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Account Number
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary)' }}>
              {account?.accountNumber ? account.accountNumber.replace(/(\d{4})/g, '$1 ').trim() : '6019 2837 4651'}
            </div>
            <div style={{ fontSize: '10px', color: '#64748B' }}>
              CTS-2010 Standard Security Paper • Watermarked
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '14px', fontFamily: 'cursive', color: '#1E293B', fontStyle: 'italic' }}>
                {user?.name || 'Rahul Sharma'}
              </span>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', borderTop: '1px solid #64748B', paddingTop: '2px' }}>
              Authorised Account Holder
            </div>
          </div>
        </div>

        {/* Bottom MICR Band */}
        <div style={{
          marginTop: '16px',
          paddingTop: '10px',
          borderTop: '1px solid #E2E8F0',
          textAlign: 'center',
          fontFamily: 'monospace',
          fontSize: '13px',
          letterSpacing: '2px',
          color: '#475569',
          fontWeight: 600,
          background: 'rgba(255,255,255,0.7)',
          borderRadius: '4px',
          padding: '6px'
        }}>
          ⑈ {primaryChequeBook?.chequeBookId ? primaryChequeBook.chequeBookId.replace('CHQ', '') : '881920'} ⑈ 400024015 ⑆ 000101 ⑈ 10
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '8px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setActiveTab('REQUEST')}
          className={`btn ${activeTab === 'REQUEST' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '13px', padding: '8px 18px' }}
        >
          <Plus size={15} /> Apply for New Cheque Book
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`btn ${activeTab === 'HISTORY' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '13px', padding: '8px 18px', position: 'relative' }}
        >
          <FileText size={15} /> Cheque Books & History
          {summary.pendingBooksCount > 0 && (
            <span style={{
              background: '#F59E0B',
              color: '#FFFFFF',
              borderRadius: '10px',
              padding: '1px 6px',
              fontSize: '11px',
              marginLeft: '6px',
              fontWeight: 800
            }}>
              {summary.pendingBooksCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('STOP_CHEQUE')}
          className={`btn ${activeTab === 'STOP_CHEQUE' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '13px', padding: '8px 18px' }}
        >
          <Ban size={15} /> Stop Cheque Payment
        </button>
      </div>

      {/* Tab 1: Apply for Cheque Book */}
      {activeTab === 'REQUEST' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Form Card */}
          <div className="card" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)', marginBottom: '4px' }}>
              Request New Cheque Book
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Choose your preferred leaf quantity and delivery method. Requests are forwarded directly to the Branch Manager.
            </p>

            <form onSubmit={handleRequestSubmit}>
              {/* Linked Account (Readonly) */}
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Linked Customer Account</label>
                <div style={{
                  padding: '12px 14px',
                  background: 'var(--bg-main)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary)' }}>
                      {account?.accountNumber || '601928374651'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {account?.accountType || 'Savings'} • {user?.name || 'Rahul Sharma'}
                    </div>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '11px' }}>
                    Active & Eligible
                  </span>
                </div>
              </div>

              {/* Total Leaves Selector Pills */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Select Cheque Leaves</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {[
                    { count: 25, title: 'Personal', cost: '₹0 (Free)' },
                    { count: 50, title: 'Standard', cost: '₹150' },
                    { count: 100, title: 'Commercial', cost: '₹250' }
                  ].map(item => (
                    <div
                      key={item.count}
                      onClick={() => setLeaves(item.count)}
                      style={{
                        padding: '14px 10px',
                        borderRadius: 'var(--radius-md)',
                        border: leaves === item.count ? '2px solid var(--accent)' : '1px solid var(--border)',
                        background: leaves === item.count ? 'rgba(0,168,150,0.06)' : 'var(--bg-card)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ fontSize: '18px', fontWeight: 800, color: leaves === item.count ? 'var(--accent)' : 'var(--text-main)' }}>
                        {item.count}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Leaves</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>
                        {item.cost}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Method Selection */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Delivery Preference</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div
                    onClick={() => setDeliveryMethod('Registered Speed Post')}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      border: deliveryMethod === 'Registered Speed Post' ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: deliveryMethod === 'Registered Speed Post' ? 'rgba(18,60,105,0.05)' : 'var(--bg-card)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13px', color: 'var(--primary)', marginBottom: '4px' }}>
                      <Truck size={16} /> Speed Post
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Dispatched to your registered residence (3-5 days)
                    </div>
                  </div>

                  <div
                    onClick={() => setDeliveryMethod('Central Branch Collection')}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      border: deliveryMethod === 'Central Branch Collection' ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: deliveryMethod === 'Central Branch Collection' ? 'rgba(18,60,105,0.05)' : 'var(--bg-card)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13px', color: 'var(--primary)', marginBottom: '4px' }}>
                      <Building size={16} /> Branch Counter
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Pick up in person at Central Branch (Mumbai)
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Address (if Speed Post selected) */}
              {deliveryMethod === 'Registered Speed Post' && (
                <div className="form-group" style={{ marginBottom: '22px' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Delivery Mailing Address</label>
                  <textarea
                    rows={2}
                    className="form-input"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter complete shipping address with pincode..."
                    style={{ resize: 'vertical', fontSize: '13px' }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Note: A secure OTP signature will be required upon postal courier delivery.
                  </span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-accent"
                disabled={submitting}
                style={{ width: '100%', padding: '14px', fontSize: '14px', fontWeight: 700 }}
              >
                {submitting ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    Submitting Application...
                  </>
                ) : (
                  <>
                    <FileCheck size={16} />
                    Confirm & Submit Application ({leaves} Leaves)
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Guidelines & Terms Info Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(0,168,150,0.12)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>SmartBank Cheque Features</h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bank-grade payment security</span>
                </div>
              </div>

              <ul style={{ paddingLeft: '18px', fontSize: '13px', color: '#475569', lineHeight: '1.8', margin: 0 }}>
                <li><strong>CTS-2010 Standard:</strong> Fast electronic clearing via National Grid.</li>
                <li><strong>Invisible UV Ink:</strong> Protected against chemical alteration and forgery.</li>
                <li><strong>Multi-City At Par:</strong> Payable across all branch locations nationwide without clearing charges.</li>
                <li><strong>Instant Notifications:</strong> Real-time SMS and in-app alerts whenever any cheque leaf is presented.</li>
              </ul>
            </div>

            <div className="card" style={{ padding: '24px', background: 'rgba(18,60,105,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px', color: 'var(--primary)', marginBottom: '10px' }}>
                <Info size={16} /> Approval & Issuance Process
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                Once submitted, your application is reviewed by the Branch Manager. After approval, the personalized cheque book is minted and dispatched within 24 hours. You can monitor the real-time status under the <strong>Cheque Books & History</strong> tab.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Cheque Books & History */}
      {activeTab === 'HISTORY' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--primary)' }}>
                Cheque Book Issue Ledger
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Record of all issued, pending, and approved cheque books for your account
              </p>
            </div>
            <button onClick={fetchChequeStatus} className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 14px' }}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Ledger
            </button>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Cheque Book ID</th>
                  <th>Total Leaves</th>
                  <th>Leaf Usage Meter</th>
                  <th>Status</th>
                  <th>Application Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {chequebooks.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>📂</div>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>No Cheque Books Found</div>
                      <div style={{ fontSize: '12px', marginTop: '4px' }}>
                        You haven't requested any cheque books yet. Click <strong>Apply for New Cheque Book</strong> above to order one.
                      </div>
                    </td>
                  </tr>
                ) : (
                  chequebooks.map((c) => {
                    const pctRemaining = c.totalLeaves > 0 ? Math.round(((c.remainingLeaves ?? c.totalLeaves) / c.totalLeaves) * 100) : 0;
                    return (
                      <tr key={c._id || c.chequeBookId}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                          {c.chequeBookId}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {c.totalLeaves} Leaves
                        </td>
                        <td style={{ minWidth: '160px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                            <span><strong>{c.remainingLeaves ?? c.totalLeaves}</strong> left</span>
                            <span style={{ color: 'var(--text-muted)' }}>{c.usedLeaves || 0} cleared</span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${pctRemaining}%`,
                              height: '100%',
                              background: c.status === 'approved' ? 'var(--accent)' : '#CBD5E1',
                              borderRadius: '3px'
                            }} />
                          </div>
                        </td>
                        <td>
                          {c.status === 'approved' && (
                            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={12} /> Approved & Active
                            </span>
                          )}
                          {c.status === 'pending' && (
                            <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} /> Pending Manager Approval
                            </span>
                          )}
                          {c.status === 'rejected' && (
                            <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <XCircle size={12} /> Declined
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {c.requestedAt ? new Date(c.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                        </td>
                        <td>
                          {c.status === 'approved' ? (
                            <button
                              onClick={() => {
                                setActiveTab('STOP_CHEQUE');
                                setStopChequeNumber(c.chequeBookId.replace('CHQ', ''));
                              }}
                              className="btn btn-outline"
                              style={{ padding: '4px 10px', fontSize: '11px', color: '#EF4444', borderColor: '#EF4444' }}
                            >
                              Manage Leaves
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Awaiting Verification
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Stop Cheque Payment */}
      {activeTab === 'STOP_CHEQUE' && (
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Ban size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
                  Stop Cheque Payment
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                  Instantly block clearing of any lost, stolen, or misplaced cheque leaf
                </p>
              </div>
            </div>

            {stopSuccessMsg && (
              <div style={{
                padding: '14px 18px',
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid var(--success)',
                borderRadius: '8px',
                color: '#15803D',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '20px'
              }}>
                ✓ {stopSuccessMsg}
              </div>
            )}

            <form onSubmit={handleStopChequeSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Cheque Leaf Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 881920 or 6-digit cheque number"
                  value={stopChequeNumber}
                  onChange={(e) => setStopChequeNumber(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '15px' }}
                  required
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Locate the 6-digit number printed on the bottom MICR band of your cheque leaf.
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Reason for Stop Payment</label>
                <select
                  className="form-select"
                  value={stopReason}
                  onChange={(e) => setStopReason(e.target.value)}
                >
                  <option value="Lost or Misplaced">Lost or Misplaced Cheque</option>
                  <option value="Stolen Leaf">Stolen Cheque Leaf</option>
                  <option value="Incorrect Amount Written">Incorrect Amount or Payee Written</option>
                  <option value="Commercial Dispute">Commercial or Vendor Dispute</option>
                  <option value="Duplicate Cheque Issued">Duplicate Cheque Issued</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-danger"
                style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 700 }}
              >
                <Ban size={16} /> Place Stop Payment Order
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChequeBook;
