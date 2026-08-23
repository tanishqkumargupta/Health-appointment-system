import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { CalendarOff, Send } from 'lucide-react';

export default function DoctorLeave() {
  const { token } = useAuth();
  const [leaveDate, setLeaveDate] = useState('');
  const [reason, setReason] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const fetchRequests = async () => {
    try {
      const res = await apiRequest('/doctor/leave-request', 'GET', null, token);
      setRequests(res.leave_requests);
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      await apiRequest('/doctor/leave-request', 'POST', {
        leave_date: leaveDate,
        reason
      }, token);

      setMsg({ type: 'success', text: 'Leave request submitted for Admin review.' });
      setLeaveDate('');
      setReason('');
      fetchRequests();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <div className="card-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2>Request Leave</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Submit leave requests. Admin approval is required before leave affects availability.</p>
        </div>
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Leave Date</label>
            <input
              type="date"
              className="form-control"
              value={leaveDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setLeaveDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Reason (Optional)</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Enter reason for leave..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            <Send size={16} />
            <span>{submitting ? 'Submitting...' : 'Submit Leave Request'}</span>
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>My Leave Requests History</h3>
        {loading ? (
          <p>Loading history...</p>
        ) : requests.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No leave requests submitted yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-light)', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Leave Date</th>
                <th style={{ padding: '10px' }}>Reason</th>
                <th style={{ padding: '10px' }}>Submitted On</th>
                <th style={{ padding: '10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '10px', fontWeight: 600 }}>{r.leave_date}</td>
                  <td style={{ padding: '10px' }}>{r.reason || 'N/A'}</td>
                  <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '10px' }}>
                    <span className={`status-pill status-${r.status}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
