import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const AppLayout = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar />
        <main className="main-content" style={{ marginTop: '70px', padding: '28px', flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
