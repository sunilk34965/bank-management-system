import React, { useState, useEffect, useRef } from 'react';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Search, Printer, Download, Filter, Calendar, ArrowDownLeft, ArrowUpRight, BookOpen, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Passbook = () => {
  const { user, refreshAccount } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [accountInfo, setAccountInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Selection & Deletion state
  const [selectedTxnIds, setSelectedTxnIds] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const printRef = useRef(null);

  const fetchPassbook = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (typeFilter !== 'ALL') params.type = typeFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await API.get('/accounts/passbook', { params });
      if (res.data.success) {
        setTransactions(res.data.transactions);
        setAccountInfo(res.data.account);
      }
    } catch (err) {
      console.error('Passbook fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassbook();
  }, [typeFilter, startDate, endDate]);

  const handleToggleSelect = (id) => {
    setSelectedTxnIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTxnIds.length === transactions.length) {
      setSelectedTxnIds([]);
    } else {
      setSelectedTxnIds(transactions.map(t => t._id || t.transactionId));
    }
  };

  const handleDeleteSelected = async (targetId = null) => {
    let idsToDelete = targetId ? [targetId] : selectedTxnIds;

    // If button clicked without manual checking, auto-target the top/above payment
    if ((!idsToDelete || idsToDelete.length === 0) && transactions.length > 0) {
      const topTxn = transactions[0];
      const topId = topTxn._id || topTxn.transactionId;
      idsToDelete = [topId];
      setSelectedTxnIds([topId]);
    }

    if (!idsToDelete || idsToDelete.length === 0) {
      alert('Please select a payment from the customer account to delete.');
      return;
    }

    const count = idsToDelete.length;
    const confirmText = count === 1 
      ? 'Are you sure you want to delete this payment from your account ledger?'
      : `Are you sure you want to delete ${count} selected payments from your account ledger?`;

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
        await fetchPassbook();
        if (refreshAccount) await refreshAccount();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete payment.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPassbook();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = printRef.current;
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`SmartBank_Statement_${accountInfo?.accountNumber || 'Account'}.pdf`);
    } catch (err) {
      alert('PDF generation error: ' + err.message);
    }
  };

  const formatRupee = (num) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num || 0);
  };

  return (
    <div>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }} className="no-print">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)' }}>Digital Passbook & Statement</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Official account statement, ledger search, and PDF exports</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handlePrint} className="btn btn-outline">
            <Printer size={16} /> Print Passbook
          </button>
          <button onClick={handleDownloadPDF} className="btn btn-accent">
            <Download size={16} /> Download PDF Statement
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card no-print" style={{ marginBottom: '24px', padding: '18px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Search Description / Txn ID</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '34px' }}
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Transaction Type</label>
            <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="ALL">All Transactions</option>
              <option value="DEPOSIT">Cash / Credit Deposits</option>
              <option value="WITHDRAW">Cash Withdrawals</option>
              <option value="TRANSFER">Money Transfers</option>
              <option value="PAYMENT">Bill Payments</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">From Date</label>
            <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">To Date</label>
            <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <button type="submit" className="btn btn-primary">
            Apply Filters
          </button>
        </form>
      </div>

      {/* Printable Statement Container */}
      <div ref={printRef} className="card" style={{ padding: '32px' }}>
        {/* Statement Bank Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--primary)', paddingBottom: '20px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>
              <span>🏦</span> SMARTBANK
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
              Official Account Statement
            </span>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Branch: Central Branch, Mumbai (IFSC: SMRT0000101)
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: '13px' }}>
            <div style={{ fontWeight: 700, color: 'var(--primary)' }}>Customer: {accountInfo?.customerName || user?.name}</div>
            <div>Account No: <strong>{accountInfo?.accountNumber}</strong></div>
            <div>Account Type: <strong>{accountInfo?.accountType}</strong></div>
            <div>Statement Date: <strong>{new Date().toLocaleDateString('en-IN')}</strong></div>
          </div>
        </div>

        {/* Current Balance Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(18,60,105,0.04)', padding: '16px 20px', borderRadius: '8px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Account Status</span>
            <div style={{ fontWeight: 700, color: 'var(--success)' }}>● ACTIVE & OPERATIONAL</div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Current Ledger Balance</span>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)' }}>{formatRupee(accountInfo?.balance)}</div>
          </div>
        </div>

        {/* Feedback Alert */}
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

        {/* Action Toolbar with Delete Select Payment */}
        <div className="no-print" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
          background: '#F8FAFC',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid #E2E8F0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#334155' }}>
              <input
                type="checkbox"
                checked={transactions.length > 0 && selectedTxnIds.length === transactions.length}
                onChange={handleSelectAll}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span>Select All ({transactions.length})</span>
            </label>
            {selectedTxnIds.length > 0 && (
              <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700 }}>
                • {selectedTxnIds.length} payment(s) selected
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {selectedTxnIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTxnIds([])}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
              >
                Clear Selection
              </button>
            )}

            <button
              id="delete-selected-payment-btn"
              type="button"
              onClick={() => handleDeleteSelected()}
              disabled={deleting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(220,38,38,0.25)',
                transition: 'all 0.15s ease'
              }}
              title="Delete Select Payment from customer's account"
            >
              <Trash2 size={15} />
              <span>{deleting ? 'Deleting...' : (selectedTxnIds.length > 0 ? `Delete Select Payment (${selectedTxnIds.length})` : 'Delete Select Payment')}</span>
            </button>
          </div>
        </div>

        {/* Passbook Transactions Table */}
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '36px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={transactions.length > 0 && selectedTxnIds.length === transactions.length}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer' }}
                    title="Select all payments"
                  />
                </th>
                <th>Date</th>
                <th>Txn ID</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Debit (-)</th>
                <th style={{ textAlign: 'right' }}>Credit (+)</th>
                <th style={{ textAlign: 'right' }}>Balance</th>
                <th className="no-print" style={{ textAlign: 'center', width: '60px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No transaction records match the specified filters.
                  </td>
                </tr>
              ) : (
                transactions.map((t, index) => {
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
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(t.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '12px' }}>{t.transactionId}</td>
                      <td style={{ fontWeight: 500 }}>{t.description}</td>
                      <td style={{ textAlign: 'right', color: 'var(--danger)', fontWeight: 600 }}>
                        {!isCredit ? formatRupee(t.amount) : '-'}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 600 }}>
                        {isCredit ? formatRupee(t.amount) : '-'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatRupee(t.balanceAfter)}</td>
                      <td className="no-print" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteSelected(tId)}
                          title="Delete this payment"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            padding: '4px 6px',
                            borderRadius: '4px'
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Statement Footer */}
        <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px dashed var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span>Computer generated electronic passbook statement. No physical signature required.</span>
          <span>SmartBank Security Verified ✓</span>
        </div>
      </div>
    </div>
  );
};

export default Passbook;
