import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { Search, Lock, Unlock, ShieldAlert, CheckCircle2 } from 'lucide-react';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await API.get('/manager/customers');
      if (res.data.success) {
        setCustomers(res.data.customers);
      }
    } catch (err) {
      console.error('Fetch customers error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleToggleFreeze = async (accountNumber, currentStatus) => {
    const newStatus = currentStatus === 'frozen' ? 'active' : 'frozen';
    setActionMsg('');

    try {
      const res = await API.post('/manager/account/freeze', {
        accountNumber,
        status: newStatus
      });

      if (res.data.success) {
        setActionMsg(`Account ${accountNumber} has been ${newStatus.toUpperCase()}`);
        fetchCustomers();
      }
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Failed to update account status.');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.accountNumber.includes(search)
  );

  const formatRupee = (num) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num || 0);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)' }}>Customer & Account Management</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Search customers, audit balances, and freeze/unfreeze accounts</p>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '34px' }}
            placeholder="Search customer, account, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {actionMsg && (
        <div style={{ padding: '12px', background: 'rgba(0,168,150,0.1)', border: '1px solid var(--accent)', borderRadius: '8px', color: 'var(--accent)', fontSize: '13px', marginBottom: '20px' }}>
          {actionMsg}
        </div>
      )}

      <div className="card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Account Number</th>
                <th>Type</th>
                <th>Balance</th>
                <th>Contact Phone</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No customer accounts found matching search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{c.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.email}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.accountNumber}</td>
                    <td>{c.accountType}</td>
                    <td style={{ fontWeight: 700 }}>{formatRupee(c.balance)}</td>
                    <td style={{ fontSize: '12px' }}>{c.phone}</td>
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
    </div>
  );
};

export default CustomerManagement;
