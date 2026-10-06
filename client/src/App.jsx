import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import Passbook from './pages/customer/Passbook';
import MoneyTransfer from './pages/customer/MoneyTransfer';
import BillPayments from './pages/customer/BillPayments';
import ChequeBook from './pages/customer/ChequeBook';

// Cashier Pages
import CashierDashboard from './pages/cashier/CashierDashboard';
import CashDeposit from './pages/cashier/CashDeposit';
import CashWithdrawal from './pages/cashier/CashWithdrawal';

// Manager Pages
import ManagerDashboard from './pages/manager/ManagerDashboard';
import CustomerManagement from './pages/manager/CustomerManagement';
import ChequeBookApprovals from './pages/manager/ChequeBookApprovals';
import CheckRequests from './pages/manager/CheckRequests';
import AuditLogsView from './pages/manager/AuditLogsView';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageStaff from './pages/admin/ManageStaff';
import ManageBranches from './pages/admin/ManageBranches';

function App() {
  return (
    <Routes>
      {/* Public / Portal Login Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/customer/login" element={<Login defaultRole="customer" />} />
      <Route path="/cashier/login" element={<Login defaultRole="cashier" />} />
      <Route path="/manager/login" element={<Login defaultRole="manager" />} />
      <Route path="/admin/login" element={<Login defaultRole="admin" />} />
      <Route path="/register" element={<Register />} />

      {/* Customer Routes */}
      <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
        <Route element={<AppLayout />}>
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/customer/passbook" element={<Passbook />} />
          <Route path="/customer/transfer" element={<MoneyTransfer />} />
          <Route path="/customer/payments" element={<BillPayments />} />
          <Route path="/customer/chequebook" element={<ChequeBook />} />
          <Route path="/customer/cheque-book" element={<ChequeBook />} />
        </Route>
      </Route>

      {/* Cashier Routes */}
      <Route element={<ProtectedRoute allowedRoles={['cashier']} />}>
        <Route element={<AppLayout />}>
          <Route path="/cashier/dashboard" element={<CashierDashboard />} />
          <Route path="/cashier/deposit" element={<CashDeposit />} />
          <Route path="/cashier/withdraw" element={<CashWithdrawal />} />
        </Route>
      </Route>

      {/* Manager Routes */}
      <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
        <Route element={<AppLayout />}>
          <Route path="/manager/dashboard" element={<ManagerDashboard />} />
          <Route path="/manager/customers" element={<CustomerManagement />} />
          <Route path="/manager/check-requests" element={<CheckRequests />} />
          <Route path="/manager/cheque-requests" element={<CheckRequests />} />
          <Route path="/manager/cheques" element={<CheckRequests />} />
        </Route>
      </Route>

      {/* Shared Manager / Admin Audit Routes */}
      <Route element={<ProtectedRoute allowedRoles={['manager', 'admin']} />}>
        <Route element={<AppLayout />}>
          <Route path="/manager/audit-logs" element={<AuditLogsView />} />
        </Route>
      </Route>

      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/staff" element={<ManageStaff />} />
          <Route path="/admin/branches" element={<ManageBranches />} />
          <Route path="/admin/audit-logs" element={<AuditLogsView />} />
          <Route path="/admin/audit" element={<AuditLogsView />} />
        </Route>
      </Route>

      {/* Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;

