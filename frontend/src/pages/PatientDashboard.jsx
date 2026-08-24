import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { Calendar, Clock, Stethoscope, FileText, Star, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';

export default function PatientDashboard() {
  const { user, token } = useAuth();
  const [data, setData] = useState({ upcoming: [], past: [], next_appointment: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [feedbackAppt, setFeedbackAppt] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      const res = await apiRequest('/patient/appointments', 'GET', null, token);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/patient/feedback', 'POST', {
        appointment_id: feedbackAppt.id,
        rating,
        comment
      }, token);
      setFeedbackMsg('Thank you! Feedback submitted successfully.');
      setFeedbackAppt(null);
      fetchDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading dashboard...</div>;

  const nextAppt = data.next_appointment;

  return (
    <div>
      {/* Welcome Banner */}
      <div className="hero-banner">
        <h1>Welcome back, {user?.name}!</h1>
        <p>Manage your upcoming health consultations and prescription history cleanly.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {feedbackMsg && <div className="alert alert-success">{feedbackMsg}</div>}

      {/* Prominent Next/Upcoming Appointment (Rule 6) */}
      {nextAppt ? (
        <div className="card" style={{ borderLeft: '4px solid var(--primary-600)', backgroundColor: '#faf5ff' }}>
          <div className="card-header">
            <div>
              <span className="status-pill status-CONFIRMED">PROMINENT NEXT APPOINTMENT</span>
              <h2 style={{ fontSize: '1.4rem', marginTop: '6px' }}>Dr. {nextAppt.doctor_name}</h2>
              <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{nextAppt.specialization_name}</p>
            </div>
            <button className="btn btn-primary" onClick={() => setSelectedAppt(nextAppt)}>
              View Appointment Details
            </button>
          </div>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <Calendar size={18} />
              <span>{new Date(nextAppt.start_time).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <Clock size={18} />
              <span>{new Date(nextAppt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>You have no upcoming appointments scheduled.</p>
          <Link to="/patient/book" className="btn btn-primary">Book New Appointment</Link>
        </div>
      )}

      {/* Other Upcoming Appointments */}
      {data.upcoming.length > 1 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Other Upcoming Appointments</h3>
          <div className="grid-2">
            {data.upcoming.slice(1).map((appt) => (
              <div key={appt.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Dr. {appt.doctor_name}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{appt.specialization_name}</p>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
                <div style={{ marginTop: '14px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <div>📅 {new Date(appt.start_time).toLocaleDateString()} at {new Date(appt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', marginTop: '16px', fontSize: '0.85rem' }}
                  onClick={() => setSelectedAppt(appt)}
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Appointments Section */}
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Past Appointments</h3>
        {data.past.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No past appointments recorded.</p>
        ) : (
          <div className="grid-2">
            {data.past.map((appt) => (
              <div key={appt.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontWeight: 700 }}>Dr. {appt.doctor_name}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{appt.specialization_name}</p>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
                <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  📅 {new Date(appt.start_time).toLocaleDateString()}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.85rem' }} onClick={() => setSelectedAppt(appt)}>
                    View Summary
                  </button>
                  {appt.status === 'COMPLETED' && !appt.feedback && (
                    <button className="btn btn-primary" style={{ fontSize: '0.85rem' }} onClick={() => setFeedbackAppt(appt)}>
                      Give Feedback
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: View Appointment Details */}
      {selectedAppt && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ maxWidth: '550px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header">
              <h3>Appointment Details</h3>
              <button onClick={() => setSelectedAppt(null)} className="btn btn-secondary">✕</button>
            </div>
            <div style={{ spaceY: '12px' }}>
              <p><strong>Doctor:</strong> Dr. {selectedAppt.doctor_name} ({selectedAppt.specialization_name})</p>
              <p><strong>Date & Time:</strong> {new Date(selectedAppt.start_time).toLocaleString()}</p>
              <p><strong>Status:</strong> <StatusBadge status={selectedAppt.status} /></p>
              <hr style={{ margin: '16px 0', borderColor: 'var(--border-light)' }} />
              
              {selectedAppt.symptom && (
                <div style={{ marginBottom: '12px' }}>
                  <h4 style={{ fontWeight: 700 }}>Reported Symptoms ({selectedAppt.symptom.problem_category})</h4>
                  <p style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', fontSize: '0.9rem', marginTop: '4px' }}>
                    {selectedAppt.symptom.symptom_text}
                  </p>
                </div>
              )}

              {selectedAppt.consultation && (
                <div>
                  <h4 style={{ fontWeight: 700, color: 'var(--primary-600)' }}>Doctor Diagnosis & Summary</h4>
                  <p><strong>Diagnosis:</strong> {selectedAppt.consultation.diagnosis}</p>
                  {selectedAppt.consultation.clinical_notes && <p><strong>Notes:</strong> {selectedAppt.consultation.clinical_notes}</p>}
                  {selectedAppt.consultation.post_visit_ai_summary && (
                    <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '8px', marginTop: '12px' }}>
                      <strong style={{ color: '#166534' }}>Patient Summary (AI Explanation):</strong>
                      <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>{selectedAppt.consultation.post_visit_ai_summary}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Feedback */}
      {feedbackAppt && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%' }}>
            <div className="card-header">
              <h3>Submit Consultation Feedback</h3>
              <button onClick={() => setFeedbackAppt(null)} className="btn btn-secondary">✕</button>
            </div>
            <form onSubmit={handleFeedbackSubmit}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                How was your visit with Dr. {feedbackAppt.doctor_name}?
              </p>
              <div className="form-group">
                <label>Rating (1 - 5 Stars)</label>
                <select className="form-control" value={rating} onChange={(e) => setRating(e.target.value)}>
                  <option value={5}>5 Stars - Excellent</option>
                  <option value={4}>4 Stars - Very Good</option>
                  <option value={3}>3 Stars - Average</option>
                  <option value={2}>2 Stars - Poor</option>
                  <option value={1}>1 Star - Very Poor</option>
                </select>
              </div>
              <div className="form-group">
                <label>Comments (Optional)</label>
                <textarea className="form-control" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Submit Feedback</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
