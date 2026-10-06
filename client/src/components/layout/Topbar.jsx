import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bell, Search, LogOut, User, Shield, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

const Topbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    const role = user?.role;
    logout();
    navigate(role ? `/login?role=${role}` : '/login');
  };

  // Mock Notifications list for demo center
  const sampleNotifications = [
    { id: 1, title: 'Welcome to SmartBank', msg: 'Your account is active and protected with SSL JWT.', icon: CheckCircle2, color: 'var(--success)', time: 'Just now' },
    { id: 2, title: 'Security Alert', msg: 'New login session authenticated from 127.0.0.1', icon: Shield, color: 'var(--accent)', time: '10m ago' },
    { id: 3, title: 'System Notice', msg: 'Core Banking REST API online 24/7.', icon: Info, color: 'var(--secondary)', time: '1h ago' }
  ];

  return (
    <header style={{
      height: '70px',
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-color)',
      position: 'fixed',
      top: 0,
      right: 0,
      left: '260px',
      zIndex: 90,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      boxShadow: 'var(--shadow-sm)'
    }} className="no-print">
      {/* Search Bar */}
      <div style={{ position: 'relative', width: '320px' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search transaction, account..."
          style={{
            width: '100%',
            padding: '8px 12px 8px 38px',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-main)',
            fontSize: '13px',
            outline: 'none'
          }}
        />
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              background: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <Bell size={18} color="var(--text-main)" />
            <span style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--danger)'
            }} />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '50px',
              width: '320px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              padding: '16px',
              zIndex: 200
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Notifications</h4>
                <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>3 New</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sampleNotifications.map((n) => {
                  const IconComp = n.icon;
                  return (
                    <div key={n.id} style={{ display: 'flex', gap: '10px', fontSize: '12px', borderBottom: '1px solid var(--border-color)', pb: '8px' }}>
                      <IconComp size={16} color={n.color} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{n.title}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{n.msg}</div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{n.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Profile Card & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid var(--border-color)', paddingLeft: '20px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'var(--secondary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '15px'
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>{user?.name || 'User'}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</span>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="btn btn-outline"
            style={{ padding: '6px 12px', marginLeft: '8px', fontSize: '12px' }}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
