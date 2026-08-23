import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { Calendar, Clock, User, AlertCircle, FileText, CheckCircle, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DoctorDashboard() {
  const { token, user } = useAuth();
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPreShiftSummary();
  }, [token]);

  const fetchPreShiftSummary = async () => {
    try {
      const res = await apiRequest('/doctor/pre-shift-summary', 'GET', null, token);
      setSummaryData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading doctor dashboard...</div>;

  return (
    <div>
      <div className="hero-banner" style={{ background: 'linear-gradient(135deg, #0d9488, #0284c7)' }}>
        <h1>Welcome, Dr. {user?.name}!</h1>
        <p>Your shift overview and pre-visit AI patient summaries for today.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Pre-Shift Doctor Summary (Rule 22) */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={22} color="var(--primary-600)" />
            <h2>Pre-Shift Daily Appointment Summary</h2>
          </div>
          <span className="status-pill status-CONFIRMED">
            {summaryData?.total_appointments || 0} APPOINTMENTS TODAY
          </span>
        </div>

        {summaryData?.total_appointments === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '16px 0' }}>No scheduled appointments for your shift today.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            {summaryData?.shift_summary.map((item, idx) => (
              <div key={idx} style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>⏰ {item.start_time}</span>
                    <span style={{ fontWeight: 600 }}>{item.patient_name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>({item.problem_category})</span>
                  </div>
                  <span className={`status-pill urgency-${item.urgency}`}>URGENCY: {item.urgency}</span>
                </div>

                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <p><strong>Chief Complaint:</strong> {item.chief_complaint || item.symptoms}</p>
                </div>

                {item.suggested_questions && item.suggested_questions.length > 0 && (
                  <div style={{ marginTop: '10px', backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--primary-600)' }}>Suggested Doctor Questions:</strong>
                    <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', marginTop: '4px' }}>
                      {item.suggested_questions.map((q, qIdx) => (
                        <li key={qIdx}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <Link to="/doctor/appointments" className="btn btn-primary">Go to Today's Consultations Panel</Link>
        </div>
      </div>
    </div>
  );
}
