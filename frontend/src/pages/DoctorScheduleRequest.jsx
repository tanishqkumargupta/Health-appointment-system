import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { Clock, Send } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function DoctorScheduleRequest() {
  const { token } = useAuth();
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [slotDuration, setSlotDuration] = useState(30);
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
      const res = await apiRequest('/doctor/schedule-request', 'GET', null, token);
      setRequests(res.schedule_requests);
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
      await apiRequest('/doctor/schedule-request', 'POST', {
        requested_start_time: startTime,
        requested_end_time: endTime,
        requested_slot_duration: slotDuration,
        reason
      }, token);

      setMsg({ type: 'success', text: 'Schedule change request submitted for Admin review.' });
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
          <h2>Request Working Hours / Schedule Change</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Request changes to your working shift hours or slot duration. Admin approval is required.
          </p>
        </div>
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="grid-3">
            <div className="form-group">
              <label>Shift Start Time</label>
              <input
                type="time"
                className="form-control"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Shift End Time (Overnight supported)</label>
              <input
                type="time"
                className="form-control"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Slot Duration</label>
              <select className="form-control" value={slotDuration} onChange={(e) => setSlotDuration(e.target.value)}>
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes (Default)</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Reason for Request (Optional)</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Explain why you are requesting a shift/duration change..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            <Send size={16} />
            <span>{submitting ? 'Submitting...' : 'Submit Schedule Request'}</span>
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>My Schedule Requests History</h3>
        {loading ? (
          <p>Loading history...</p>
        ) : requests.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No schedule change requests submitted yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-light)', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Requested Shift</th>
                <th style={{ padding: '10px' }}>Slot Duration</th>
                <th style={{ padding: '10px' }}>Reason</th>
                <th style={{ padding: '10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '10px', fontWeight: 600 }}>{r.requested_start_time} - {r.requested_end_time}</td>
                  <td style={{ padding: '10px' }}>{r.requested_slot_duration} mins</td>
                  <td style={{ padding: '10px' }}>{r.reason || 'N/A'}</td>
                  <td style={{ padding: '10px' }}>
                    <StatusBadge status={r.status} />
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
