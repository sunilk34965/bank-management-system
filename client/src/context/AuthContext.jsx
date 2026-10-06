import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

const MOCK_USERS = {
  'customer@smartbank.com': {
    user: { _id: 'usr_customer1', name: 'Rahul Sharma', email: 'customer@smartbank.com', role: 'customer' },
    account: { _id: 'acc_001', accountNumber: '601928374651', accountType: 'Savings', balance: 125500.00, status: 'active', branchName: 'SmartBank Central Branch (Mumbai)' }
  },
  'cashier@smartbank.com': {
    user: { _id: 'usr_cashier', name: 'Sneha Kulkarni', email: 'cashier@smartbank.com', role: 'cashier' },
    account: null
  },
  'manager@smartbank.com': {
    user: { _id: 'usr_manager', name: 'Rajesh Malhotra', email: 'manager@smartbank.com', role: 'manager' },
    account: null
  },
  'admin@smartbank.com': {
    user: { _id: 'usr_admin', name: 'System Administrator', email: 'admin@smartbank.com', role: 'admin' },
    account: null
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('smartbank_token'));
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    if (!token) {
      setUser(null);
      setAccount(null);
      setLoading(false);
      return;
    }

    if (token.startsWith('mock_jwt_token_')) {
      const role = token.replace('mock_jwt_token_', '');
      const mock = Object.values(MOCK_USERS).find(m => m.user.role === role);
      if (mock) {
        setUser(mock.user);
        setAccount(mock.account);
        setLoading(false);
        return;
      }
    }

    try {
      const response = await API.get('/auth/me');
      if (response.data?.success) {
        setUser(response.data.user);
        setAccount(response.data.account || null);
      }
    } catch (err) {
      console.warn('Backend session fetch failed:', err.message);
      // Check if it was a mock user session before logging out
      const savedDemo = localStorage.getItem('smartbank_demo_user');
      if (savedDemo && MOCK_USERS[savedDemo]) {
        setUser(MOCK_USERS[savedDemo].user);
        setAccount(MOCK_USERS[savedDemo].account);
      } else {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [token]);

  const login = async (email, password, portalRole = 'customer') => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanRole = (portalRole || 'customer').toLowerCase().trim();

    try {
      const res = await API.post('/auth/login', { 
        email: cleanEmail, 
        password, 
        role: cleanRole 
      });

      if (res.data?.success) {
        if (cleanRole && res.data.user?.role !== cleanRole) {
          throw new Error(`Access denied. A ${res.data.user.role} account cannot access the ${cleanRole} portal.`);
        }
        const newToken = res.data.token;
        localStorage.setItem('smartbank_token', newToken);
        localStorage.setItem('smartbank_demo_user', cleanEmail);
        setToken(newToken);
        setUser(res.data.user);
        setAccount(res.data.account || null);
        return res.data;
      }
      throw new Error(res.data?.message || 'Login failed');
    } catch (err) {
      // If backend responded with an authoritative error (403 Role Mismatch, 401, 400), don't bypass to mock
      if (err.response?.data) {
        const backendError = new Error(err.response.data.message || 'Login failed');
        backendError.code = err.response.data.code;
        backendError.userRole = err.response.data.userRole;
        backendError.requestedRole = err.response.data.requestedRole;
        backendError.response = err.response;
        throw backendError;
      }

      // Resilient fallback for demo users ONLY when backend is genuinely offline/unreachable
      if (MOCK_USERS[cleanEmail]) {
        const mock = MOCK_USERS[cleanEmail];
        // Enforce role matching even in offline fallback mode
        if (cleanRole && mock.user.role !== cleanRole) {
          const roleTitles = {
            customer: 'Customer',
            cashier: 'Cashier / Teller',
            manager: 'Branch Manager',
            admin: 'System Admin'
          };
          const userTitle = roleTitles[mock.user.role] || mock.user.role;
          const portalTitle = roleTitles[cleanRole] || cleanRole;
          const mismatchErr = new Error(`Access denied. A ${userTitle} account cannot log in using the ${portalTitle} login portal. Please switch to the ${userTitle} portal.`);
          mismatchErr.code = 'ROLE_MISMATCH';
          mismatchErr.userRole = mock.user.role;
          mismatchErr.requestedRole = cleanRole;
          throw mismatchErr;
        }

        const mockToken = 'mock_jwt_token_' + mock.user.role;
        localStorage.setItem('smartbank_token', mockToken);
        localStorage.setItem('smartbank_demo_user', cleanEmail);
        setToken(mockToken);
        setUser(mock.user);
        setAccount(mock.account);
        return { success: true, token: mockToken, user: mock.user, account: mock.account };
      }
      const msg = err.message || 'Login failed. Please verify credentials.';
      throw new Error(msg);
    }
  };

  const register = async (formData) => {
    try {
      const res = await API.post('/auth/register', formData);
      if (res.data?.success) {
        const newToken = res.data.token;
        localStorage.setItem('smartbank_token', newToken);
        setToken(newToken);
        setUser(res.data.user);
        setAccount(res.data.account || null);
        return res.data;
      }
      throw new Error(res.data?.message || 'Registration failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please check form values.';
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('smartbank_token');
    localStorage.removeItem('smartbank_demo_user');
    setToken(null);
    setUser(null);
    setAccount(null);
  };

  const refreshAccount = async () => {
    try {
      const res = await API.get('/accounts/me');
      if (res.data?.success) {
        setAccount(res.data.account);
      }
    } catch (err) {
      console.warn('Failed to refresh account from backend:', err.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, account, token, loading, login, register, logout, refreshAccount, fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
