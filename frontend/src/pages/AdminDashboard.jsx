import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { Stethoscope, Calendar, CalendarOff, Clock, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/admin/metrics', 'GET', null, token)
      .then((data) => setMetrics(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading admin dashboard...</div>;

  return (
    <div>
      <div className="hero-banner" style={{ background: 'linear-gradient(135deg, #1e1b4b, #4338ca)' }}>
        <h1>Admin Control Dashboard</h1>
        <p>Manage doctor accounts, working hours, and approve leave or schedule change requests.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-4" style={{ marginBottom: '32px' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Stethoscope color="var(--primary-600)" size={24} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>DOCTORS</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{metrics?.active_doctors} / {metrics?.total_doctors}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active vs Total Doctors</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Calendar color="#0284c7" size={24} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>TODAY'S APPOINTMENTS</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{metrics?.today_appointments}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>System-wide count today</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <CalendarOff color="#d97706" size={24} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>PENDING LEAVES</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{metrics?.pending_leave_requests}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Awaiting approval</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Clock color="#059669" size={24} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>SCHEDULE REQUESTS</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{metrics?.pending_schedule_requests}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Awaiting approval</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Quick Management</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '12px 0 20px 0' }}>
            Provision doctor credentials, set specialization, configure overnight working hours, and slot durations.
          </p>
          <Link to="/admin/doctors" className="btn btn-primary">Manage Doctors</Link>
        </div>

        <div className="card">
          <h3>Approval Center</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '12px 0 20px 0' }}>
            Review doctor leave and schedule change requests. Approved leave automatically cancels affected appointments and notifies patients.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/admin/leave-requests" className="btn btn-secondary">Review Leaves</Link>
            <Link to="/admin/schedule-requests" className="btn btn-secondary">Review Schedules</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
