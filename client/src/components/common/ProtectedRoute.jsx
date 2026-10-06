import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏦</div>
          <h3 style={{ color: 'var(--primary)', fontWeight: 600 }}>Loading SmartBank System...</h3>
        </div>
      </div>
    );
  }

  if (!user) {
    const roleForRedirect = allowedRoles && allowedRoles.length === 1 ? allowedRoles[0] : null;
    return <Navigate to={roleForRedirect ? `/login?role=${roleForRedirect}` : '/login'} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to respective dashboard if wrong role
    if (user.role === 'customer') return <Navigate to="/customer/dashboard" replace />;
    if (user.role === 'cashier') return <Navigate to="/cashier/dashboard" replace />;
    if (user.role === 'manager') return <Navigate to="/manager/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to={`/login?role=${user.role}`} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
