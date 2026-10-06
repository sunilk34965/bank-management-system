import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

const ChequeBookApprovals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const fetchCheques = async () => {
    setLoading(true);
    try {
      const res = await API.get('/manager/dashboard');
      if (res.data.success) {
        setRequests(res.data.pendingCheques || []);
      }
    } catch (err) {
      console.error('Fetch cheque error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheques();
  }, []);

  const handleStatusUpdate = async (chequeBookId, status) => {
    setMsg('');
    try {
      const res = await API.post('/manager/cheque/status', { chequeBookId, status });
      if (res.data.success) {
        setMsg(`Cheque Request ${chequeBookId} marked as ${status.toUpperCase()}`);
        fetchCheques();
      }
    } catch (err) {
      setMsg(err.response?.data?.message || 'Status update failed.');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)' }}>Cheque Book Approval Portal</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Review customer cheque book requests & approve or reject applications</p>
      </div>

      {msg && (
        <div style={{ padding: '12px', background: 'rgba(34,197,94,0.1)', border: '1px solid var(--success)', borderRadius: '8px', color: 'var(--success)', fontSize: '13px', marginBottom: '20px' }}>
          {msg}
        </div>
      )}

      <div className="card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Cheque Req ID</th>
                <th>Customer Name</th>
                <th>Account Number</th>
                <th>Requested Leaves</th>
                <th>Requested Date</th>
                <th style={{ textAlign: 'right' }}>Approval Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No pending cheque requests requiring manager approval.
                  </td>
                </tr>
              ) : (
                requests.map((c) => (
                  <tr key={c._id || c.chequeBookId}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.chequeBookId}</td>
                    <td style={{ fontWeight: 700 }}>{c.customerName}</td>
                    <td>{c.accountNumber}</td>
                    <td>{c.totalLeaves} Leaves</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(c.requestedAt).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleStatusUpdate(c.chequeBookId, 'approved')}
                        className="btn btn-success"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        <CheckCircle2 size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(c.chequeBookId, 'rejected')}
                        className="btn btn-danger"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        <XCircle size={14} /> Reject
                      </button>
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

export default ChequeBookApprovals;
