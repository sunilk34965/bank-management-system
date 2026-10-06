import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Lock,
  Mail,
  ShieldAlert,
  ArrowRight,
  User,
  Banknote,
  Briefcase,
  ShieldCheck,
  Eye,
  EyeOff,
  Shield,
  UserPlus,
  Sparkles
} from 'lucide-react';

const ROLES = {
  customer: {
    id: 'customer',
    title: 'Customer Portal',
    badge: 'Retail & Corporate Banking Only',
    icon: User,
    color: '#00A896',
    bgGradient: 'linear-gradient(135deg, #00A896 0%, #028090 100%)',
    lightBg: 'rgba(0, 168, 150, 0.08)',
    emailPlaceholder: 'customer@smartbank.com',
    subtitle: 'Sign in to access your personal accounts and transactions',
    hasOpenAccountOption: true,
    destination: '/customer/dashboard'
  },
  cashier: {
    id: 'cashier',
    title: 'Cashier / Teller Portal',
    badge: 'Branch Counter Operations Only',
    icon: Banknote,
    color: '#D97706',
    bgGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    lightBg: 'rgba(245, 158, 11, 0.08)',
    emailPlaceholder: 'cashier@smartbank.com',
    subtitle: 'Sign in to access the teller counter and cash register',
    hasOpenAccountOption: false,
    destination: '/cashier/dashboard'
  },
  manager: {
    id: 'manager',
    title: 'Branch Manager Portal',
    badge: 'Supervisory & Approvals Only',
    icon: Briefcase,
    color: '#2563EB',
    bgGradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    lightBg: 'rgba(59, 130, 246, 0.08)',
    emailPlaceholder: 'manager@smartbank.com',
    subtitle: 'Sign in to oversee branch operations and approvals',
    hasOpenAccountOption: false,
    destination: '/manager/dashboard'
  },
  admin: {
    id: 'admin',
    title: 'System Admin Portal',
    badge: 'Core Banking Administration Only',
    icon: ShieldCheck,
    color: '#7C3AED',
    bgGradient: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
    lightBg: 'rgba(139, 92, 246, 0.08)',
    emailPlaceholder: 'admin@smartbank.com',
    subtitle: 'Sign in to manage system security, staff, and core logs',
    hasOpenAccountOption: false,
    destination: '/admin/dashboard'
  }
};

const Login = ({ defaultRole }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryRole = (searchParams.get('role') || '').toLowerCase();
  const resolvedInitialRole = (defaultRole || queryRole || 'customer').toLowerCase();
  const [selectedRole, setSelectedRole] = useState(ROLES[resolvedInitialRole] ? resolvedInitialRole : 'customer');

  // Synchronize when route prop or searchParams change
  useEffect(() => {
    const target = (defaultRole || searchParams.get('role') || '').toLowerCase();
    if (ROLES[target] && target !== selectedRole) {
      setSelectedRole(target);
      setError('');
      setSuggestedRole(null);
    }
  }, [defaultRole, searchParams]);

  const activeRoleData = ROLES[selectedRole] || ROLES.customer;

  // Empty fields by default - no pre-filling
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [suggestedRole, setSuggestedRole] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Switch role tab and keep URL in sync
  const handleSelectRole = (roleKey) => {
    setSelectedRole(roleKey);
    setSearchParams({ role: roleKey }, { replace: true });
    setEmail('');
    setPassword('');
    setError('');
    setSuggestedRole(null);
  };

  // Standard Form Submission with Role Portal Binding
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuggestedRole(null);

    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setSubmitting(true);
    try {
      // Pass the active portal role to ensure user cannot log in across roles
      const data = await login(email.trim(), password, selectedRole);
      const role = data.user.role;
      if (role !== selectedRole) {
        setError(`Access denied. You cannot log into ${activeRoleData.title} with a ${role} account.`);
        return;
      }
      if (role === 'customer') navigate('/customer/dashboard');
      else if (role === 'cashier') navigate('/cashier/dashboard');
      else if (role === 'manager') navigate('/manager/dashboard');
      else if (role === 'admin') navigate('/admin/dashboard');
      else navigate(activeRoleData.destination);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Login failed. Please verify your credentials.';
      setError(errorMsg);
      const detectedRole = err.userRole || err.response?.data?.userRole;
      if (detectedRole && ROLES[detectedRole]) {
        setSuggestedRole(detectedRole);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const IconComp = activeRoleData.icon;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 15%, #152C4E 0%, #0A1628 70%, #050B14 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      color: '#FFFFFF'
    }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #00A896 0%, #0B1F3A 100%)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          marginBottom: '12px',
          boxShadow: '0 8px 24px rgba(0, 168, 150, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          🏦
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', margin: '0 0 6px 0' }}>
          SmartBank Portal Login
        </h1>
        <p style={{ fontSize: '14px', color: '#94A3B8', maxWidth: '440px', margin: '0 auto' }}>
          Select your portal role below to sign in or open a new account
        </p>
      </div>

      {/* Main Card */}
      <div style={{
        width: '100%',
        maxWidth: '500px',
        background: '#FFFFFF',
        color: '#1E293B',
        borderRadius: '20px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Role Selection Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          background: '#F1F5F9',
          padding: '6px',
          gap: '4px',
          borderBottom: '1px solid #E2E8F0'
        }}>
          {Object.entries(ROLES).map(([key, role]) => {
            const RoleIcon = role.icon;
            const isSelected = selectedRole === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectRole(key)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 4px',
                  borderRadius: '10px',
                  border: isSelected ? `2px solid ${role.color}` : '2px solid transparent',
                  background: isSelected ? '#FFFFFF' : 'transparent',
                  color: isSelected ? role.color : '#64748B',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '11px',
                  boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: isSelected ? role.bgGradient : '#E2E8F0',
                  color: isSelected ? '#FFFFFF' : '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <RoleIcon size={16} />
                </div>
                <span>{role.title.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Card Body */}
        <div style={{ padding: '28px 32px' }}>
          {/* Active Portal Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '18px',
            marginBottom: '20px',
            borderBottom: '1px solid #F1F5F9'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: activeRoleData.bgGradient,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${activeRoleData.color}40`,
                flexShrink: 0
              }}>
                <IconComp size={20} />
              </div>
              <div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: activeRoleData.lightBg,
                  color: activeRoleData.color,
                  fontSize: '10px',
                  fontWeight: 700,
                  marginBottom: '4px',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase'
                }}>
                  <Shield size={10} />
                  <span>{activeRoleData.badge}</span>
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {activeRoleData.title}
                </h3>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>
                  {activeRoleData.subtitle}
                </p>
              </div>
            </div>

            {/* Clear Open Account Button in Header View */}
            {activeRoleData.hasOpenAccountOption && (
              <Link
                to="/register"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0, 168, 150, 0.1)',
                  color: '#00A896',
                  fontSize: '11px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  border: '1px solid rgba(0, 168, 150, 0.25)',
                  flexShrink: 0
                }}
              >
                <UserPlus size={13} />
                Open Account
              </Link>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <div style={{
              padding: '12px 14px',
              background: suggestedRole ? '#FFFBEB' : '#FEE2E2',
              border: `1.5px solid ${suggestedRole ? '#F59E0B' : '#EF4444'}`,
              borderRadius: '10px',
              color: suggestedRole ? '#92400E' : '#B91C1C',
              fontSize: '13px',
              marginBottom: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px', color: suggestedRole ? '#D97706' : '#DC2626' }} />
                <div>
                  <div style={{ fontWeight: 700, marginBottom: '2px' }}>
                    {suggestedRole ? 'Role Login Mismatch' : 'Authentication Error'}
                  </div>
                  <div style={{ lineHeight: '1.4' }}>{error}</div>
                </div>
              </div>

              {suggestedRole && ROLES[suggestedRole] && (
                <div style={{
                  marginTop: '4px',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(245, 158, 11, 0.25)',
                  display: 'flex',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      const savedEmail = email;
                      handleSelectRole(suggestedRole);
                      setEmail(savedEmail);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      background: ROLES[suggestedRole].color,
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>👉 Switch to {ROLES[suggestedRole].title}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Clean Email & Password Form */}
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="email"
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    outline: 'none',
                    color: '#0F172A'
                  }}
                  placeholder={`Enter your ${activeRoleData.title.toLowerCase().split(' ')[0]} email`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  Password
                </label>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  style={{
                    width: '100%',
                    padding: '11px 38px 11px 38px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    outline: 'none',
                    color: '#0F172A'
                  }}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94A3B8'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Primary Sign In Button */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '12px',
                background: activeRoleData.color,
                color: '#FFFFFF',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: `0 4px 12px ${activeRoleData.color}40`,
                transition: 'all 0.2s ease'
              }}
            >
              {submitting ? 'Authenticating...' : `Sign In to ${activeRoleData.title}`}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Prominent Eye-Catching Open Account Option (In direct sight of Sign In) */}
          {activeRoleData.hasOpenAccountOption ? (
            <div style={{
              marginTop: '18px',
              paddingTop: '16px',
              borderTop: '1px solid #F1F5F9',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>
                Don't have a SmartBank account yet?
              </div>
              <Link
                to="/register"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '11px',
                  background: 'rgba(0, 168, 150, 0.08)',
                  border: '1.5px solid #00A896',
                  borderRadius: '10px',
                  color: '#007A6C',
                  fontWeight: 700,
                  fontSize: '13px',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <UserPlus size={16} color="#00A896" />
                <span>Open a New Bank Account</span>
                <ArrowRight size={14} color="#00A896" />
              </Link>
            </div>
          ) : (
            <div style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid #F1F5F9',
              fontSize: '12px',
              textAlign: 'center',
              color: '#64748B',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#475569' }}>
                <Shield size={14} color="#00A896" />
                <span>Authorized Bank Personnel Only</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                Need to open a customer account?{' '}
                <button
                  type="button"
                  onClick={() => handleSelectRole('customer')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#00A896',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline'
                  }}
                >
                  Switch to Customer Portal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Page Security Footer */}
      <div style={{ marginTop: '24px', fontSize: '12px', color: '#64748B', textAlign: 'center' }}>
        SmartBank Enterprise v1.0 • TLS 1.3 256-bit Encrypted Session
      </div>
    </div>
  );
};

export default Login;
