import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { 
  ShieldCheck, 
  FileText, 
  Filter, 
  Search, 
  RefreshCw, 
  Download, 
  Printer, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Clock,
  UserCheck
} from 'lucide-react';

const AuditLogsView = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await API.get('/manager/audit-logs');
      if (res.data.success) {
        setLogs(res.data.logs || []);
      }
    } catch (err) {
      console.error('Audit logs fetch error:', err);
      // Fallback: try admin stats if available
      try {
        const adminRes = await API.get('/admin/stats');
        if (adminRes.data.recentLogs) {
          setLogs(adminRes.data.recentLogs);
        }
      } catch (fallbackErr) {
        console.error('Fallback fetch error:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const exportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Log ID', 'Timestamp', 'Performed By', 'Email', 'Role', 'Action', 'Target Account', 'Amount', 'Details', 'Status'];
    const rows = logs.map(l => [
      `"${l.logId || l._id || ''}"`,
      `"${new Date(l.timestamp).toISOString()}"`,
      `"${l.performedBy || ''}"`,
      `"${l.userEmail || ''}"`,
      `"${l.userRole || ''}"`,
      `"${l.action || ''}"`,
      `"${l.targetAccount || 'N/A'}"`,
      l.amount || 0,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${l.status || 'SUCCESS'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartbank_audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered logs
  const filteredLogs = logs.filter(l => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (l.action && l.action.toLowerCase().includes(term)) ||
      (l.performedBy && l.performedBy.toLowerCase().includes(term)) ||
      (l.userEmail && l.userEmail.toLowerCase().includes(term)) ||
      (l.targetAccount && l.targetAccount.toLowerCase().includes(term)) ||
      (l.details && l.details.toLowerCase().includes(term)) ||
      (l.logId && l.logId.toLowerCase().includes(term));

    const matchesRole = roleFilter === 'all' || (l.userRole || '').toUpperCase() === roleFilter.toUpperCase();
    const matchesStatus = statusFilter === 'all' || (l.status || 'SUCCESS').toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesRole && matchesStatus;
  });

  const adminEventsCount = logs.filter(l => (l.userRole || '').toUpperCase() === 'ADMIN').length;
  const managerEventsCount = logs.filter(l => (l.userRole || '').toUpperCase() === 'MANAGER').length;
  const cashierEventsCount = logs.filter(l => (l.userRole || '').toUpperCase() === 'CASHIER').length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }} className="no-print">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)' }}>System Audit Logs & Security Feed</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Enterprise immutable tracking of all banking actions, transactions, and staff operations</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={fetchAuditLogs} 
            className="btn btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Refresh Logs"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button 
            onClick={exportCSV} 
            className="btn btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Export CSV"
          >
            <Download size={15} /> Export CSV
          </button>
          <button 
            onClick={handlePrint} 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Print Audit Report"
          >
            <Printer size={15} /> Print Report
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }} className="no-print">
        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid #6366F1' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Audit Entries</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>{logs.length}</div>
        </div>

        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid #8B5CF6' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Admin Operations</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#8B5CF6', marginTop: '2px' }}>{adminEventsCount}</div>
        </div>

        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid #10B981' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Manager Approvals</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10B981', marginTop: '2px' }}>{managerEventsCount}</div>
        </div>

        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid #F59E0B' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cashier Counter Txns</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#F59E0B', marginTop: '2px' }}>{cashierEventsCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card no-print" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '36px' }}
              placeholder="Search by action, user, email, account, or details..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Role Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Role:</span>
            <select 
              className="form-select" 
              style={{ width: '130px', padding: '8px 12px', fontSize: '13px' }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="CASHIER">Cashier</option>
              <option value="CUSTOMER">Customer</option>
              <option value="SYSTEM">System</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
            <select 
              className="form-select" 
              style={{ width: '120px', padding: '8px 12px', fontSize: '13px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="WARNING">Warning</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }} className="no-print">
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)' }}>
            Audit Log Entries ({filteredLogs.length})
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing {filteredLogs.length} of {logs.length} total events
          </span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Timestamp</th>
                <th>Performed By</th>
                <th>Role</th>
                <th>Action Event</th>
                <th>Target Acc</th>
                <th>Details</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'inline-block', marginBottom: '8px' }}>
                      <RefreshCw size={24} className="animate-spin" />
                    </div>
                    <div>Loading security audit log feed...</div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No audit logs recorded matching your search.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const roleUpper = (log.userRole || '').toUpperCase();
                  const roleBadgeClass = 
                    roleUpper === 'ADMIN' ? '#8B5CF6' : 
                    roleUpper === 'MANAGER' ? '#10B981' : 
                    roleUpper === 'CASHIER' ? '#F59E0B' : 
                    'var(--secondary)';

                  return (
                    <tr key={log._id || log.logId}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '12px', color: 'var(--primary)' }}>
                        {log.logId || log._id?.slice(-8)}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(log.timestamp).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{log.performedBy}</div>
                        {log.userEmail && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.userEmail}</div>
                        )}
                      </td>
                      <td>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: `${roleBadgeClass}18`,
                          color: roleBadgeClass,
                          border: `1px solid ${roleBadgeClass}40`
                        }}>
                          {log.userRole || 'USER'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        {log.action}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                        {log.targetAccount || 'N/A'}
                      </td>
                      <td style={{ fontSize: '13px', maxWidth: '300px', lineHeight: 1.4 }}>
                        {log.details}
                      </td>
                      <td>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: log.status === 'FAILED' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                          color: log.status === 'FAILED' ? '#DC2626' : '#16A34A'
                        }}>
                          {log.status || 'SUCCESS'}
                        </span>
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

export default AuditLogsView;

