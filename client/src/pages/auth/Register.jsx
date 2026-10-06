import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, Lock, MapPin, CheckCircle2, ShieldAlert } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [accountType, setAccountType] = useState('Savings');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await register({ name, email, phone, password, address, accountType });
      navigate('/customer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0B1F3A 0%, #123C69 60%, #00A896 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        background: '#FFFFFF',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        padding: '36px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>
            Open SmartBank Account
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Instant digital savings & current account setup
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger)',
            borderRadius: '8px',
            color: 'var(--danger)',
            fontSize: '13px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="+91 98201 12345"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="rahul@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Create strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Account Type</label>
              <select
                className="form-select"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
              >
                <option value="Savings">Savings Account</option>
                <option value="Current">Current Account</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <input
                type="text"
                className="form-input"
                placeholder="City, State"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-accent"
            disabled={submitting}
            style={{ width: '100%', padding: '12px', fontSize: '15px', marginTop: '12px' }}
          >
            {submitting ? 'Creating Account...' : 'Open Account Now (₹1,000 Bonus)'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Already registered?{' '}
          <Link to="/login?role=customer" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign In to Customer Portal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
