import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Wallet,
  BookOpen,
  Send,
  CreditCard,
  FileCheck,
  ArrowDownCircle,
  ArrowUpCircle,
  Users,
  ShieldCheck,
  CheckSquare,
  BarChart3,
  FileText,
  Building2,
  UserPlus
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const getNavLinks = () => {
    switch (role) {
      case 'customer':
        return [
          { path: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/customer/passbook', label: 'Digital Passbook', icon: BookOpen },
          { path: '/customer/transfer', label: 'Money Transfer', icon: Send },
          { path: '/customer/payments', label: 'Bill Payments', icon: CreditCard },
          { path: '/customer/chequebook', label: 'Cheque Book', icon: FileCheck }
        ];
      case 'cashier':
        return [
          { path: '/cashier/dashboard', label: 'Counter Overview', icon: LayoutDashboard },
          { path: '/cashier/deposit', label: 'Cash Deposit', icon: ArrowDownCircle },
          { path: '/cashier/withdraw', label: 'Cash Withdrawal', icon: ArrowUpCircle }
        ];
      case 'manager':
        return [
          { path: '/manager/dashboard', label: 'Manager Dashboard', icon: LayoutDashboard },
          { path: '/manager/customers', label: 'Customers & Accounts', icon: Users },
          { path: '/manager/check-requests', label: 'Check & Approvals', icon: CheckSquare },
          { path: '/manager/audit-logs', label: 'Audit Logs', icon: FileText }
        ];
      case 'admin':
        return [
          { path: '/admin/dashboard', label: 'System Overview', icon: LayoutDashboard },
          { path: '/admin/staff', label: 'Manage Staff', icon: UserPlus },
          { path: '/admin/branches', label: 'Manage Branches', icon: Building2 },
          { path: '/admin/audit-logs', label: 'System Audit Logs', icon: FileText }
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <aside style={{
      width: '260px',
      background: 'var(--primary)',
      color: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100,
      boxShadow: '4px 0 15px rgba(0,0,0,0.1)'
    }} className="no-print">
      {/* Brand Header */}
      <div style={{
        padding: '24px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--accent) 0%, #007769 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          fontWeight: 800
        }}>
          🏦
        </div>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px', color: '#FFFFFF' }}>SmartBank</h2>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Banking SaaS
          </span>
        </div>
      </div>

      {/* Role Indicator Banner */}
      <div style={{
        margin: '16px 16px 8px 16px',
        padding: '10px 14px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Active Role</span>
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: '12px',
          textTransform: 'uppercase',
          background: role === 'customer' ? 'var(--accent)' : role === 'cashier' ? '#F59E0B' : role === 'manager' ? '#22C55E' : '#EF4444',
          color: '#FFFFFF'
        }}>
          {role}
        </span>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
        {navLinks.map((link) => {
          const IconComponent = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
                background: isActive ? 'linear-gradient(90deg, rgba(0,168,150,0.25) 0%, rgba(0,168,150,0.05) 100%)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                transition: 'all 0.2s ease'
              })}
            >
              <IconComponent size={18} style={{ opacity: 0.9 }} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        fontSize: '11px',
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center'
      }}>
        SmartBank v1.0 Enterprise
      </div>
    </aside>
  );
};

export default Sidebar;
