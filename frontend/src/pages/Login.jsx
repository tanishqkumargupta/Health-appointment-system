import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (emailToUse, passwordToUse) => {
    setError('');
    setLoading(true);

    try {
      const user = await login(emailToUse, passwordToUse);
      if (user.role === 'PATIENT') navigate('/patient/dashboard');
      else if (user.role === 'DOCTOR') navigate('/doctor/dashboard');
      else if (user.role === 'ADMIN') navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLoginSubmit(email, password);
  };

  const fillAndLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    handleLoginSubmit(demoEmail, demoPassword);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '820px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'stretch' }}>
        
        {/* Main Login Form */}
        <div className="card" style={{ padding: '32px', marginBottom: 0 }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div className="brand-icon" style={{ width: '44px', height: '44px', margin: '0 auto 12px auto' }}>
              <Activity size={24} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Welcome Back</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Sign in to your healthcare portal</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
              <LogIn size={18} />
              <span>{loading ? 'Logging in...' : 'Sign In'}</span>
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Don't have a patient account? <Link to="/signup" style={{ color: 'var(--primary-600)', fontWeight: 600 }}>Sign up</Link>
          </div>
        </div>

        {/* Simple Evaluator Quick Logins Panel - Clean, plain, no colors, no logos */}
        <div className="card" style={{ padding: '28px', marginBottom: 0, backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>Quick Evaluator Logins</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Click any role to auto-fill credentials and log in instantly:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '10px 14px', fontSize: '0.85rem', fontWeight: 500 }}
              onClick={() => fillAndLogin('admin@healthapp.com', 'admin123')}
              disabled={loading}
            >
              Admin (admin@healthapp.com)
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '10px 14px', fontSize: '0.85rem', fontWeight: 500 }}
              onClick={() => fillAndLogin('dr.sharma@healthapp.com', 'doctor123')}
              disabled={loading}
            >
              Doctor - Dermatology (dr.sharma@healthapp.com)
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '10px 14px', fontSize: '0.85rem', fontWeight: 500 }}
              onClick={() => fillAndLogin('dr.patel@healthapp.com', 'doctor123')}
              disabled={loading}
            >
              Doctor - Overnight Shift (dr.patel@healthapp.com)
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '10px 14px', fontSize: '0.85rem', fontWeight: 500 }}
              onClick={() => fillAndLogin('patient@example.com', 'patient123')}
              disabled={loading}
            >
              Patient (patient@example.com)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
