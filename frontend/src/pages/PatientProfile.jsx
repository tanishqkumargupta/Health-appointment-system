import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { User, Save } from 'lucide-react';

export default function PatientProfile() {
  const { token, user: authUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    apiRequest('/patient/profile', 'GET', null, token)
      .then((data) => {
        setName(data.user.name);
        setEmail(data.user.email);
        setPhone(data.user.phone || '');
      })
      .catch((err) => setMsg({ type: 'error', text: err.message }))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: '', text: '' });

    try {
      await apiRequest('/patient/profile', 'PUT', { name, phone }, token);
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading profile...</div>;

  return (
    <div style={{ maxWidth: '600px' }}>
      <div className="card-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2>Patient Profile</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage your account details and contact information.</p>
        </div>
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type}`}>{msg.text}</div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address (Read-only)</label>
            <input
              type="email"
              className="form-control"
              value={email}
              disabled
              style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              className="form-control"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={saving}>
            <Save size={18} />
            <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
