import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { CheckCircle, XCircle } from 'lucide-react';

export default function AdminScheduleRequests() {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const fetchRequests = async () => {
    try {
      const res = await apiRequest('/admin/schedule-requests', 'GET', null, token);
      setRequests(res.schedule_requests);
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setMsg({ type: '', text: '' });
    try {
      await apiRequest(`/admin/schedule-requests/${id}/approve`, 'POST', null, token);
      setMsg({ type: 'success', text: 'Schedule change request approved & working hours updated!' });
      fetchRequests();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const handleReject = async (id) => {
    setMsg({ type: '', text: '' });
    try {
      await apiRequest(`/admin/schedule-requests/${id}/reject`, 'POST', null, token);
      setMsg({ type: 'info', text: 'Schedule request rejected.' });
      fetchRequests();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2>Schedule Change Approval Center</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Review doctor schedule & slot-duration change requests.
          </p>
        </div>
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div className="card">
        {loading ? (
          <p>Loading schedule requests...</p>
        ) : requests.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No schedule change requests found.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-light)', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Doctor Name</th>
                <th style={{ padding: '12px' }}>Requested Shift</th>
                <th style={{ padding: '12px' }}>Slot Duration</th>
                <th style={{ padding: '12px' }}>Reason</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '12px', fontWeight: 600 }}>Dr. {r.doctor_name}</td>
                  <td style={{ padding: '12px', fontWeight: 700 }}>{r.requested_start_time} - {r.requested_end_time}</td>
                  <td style={{ padding: '12px' }}>{r.requested_slot_duration} mins</td>
                  <td style={{ padding: '12px' }}>{r.reason || 'N/A'}</td>
                  <td style={{ padding: '12px' }}>
                    <span className={`status-pill status-${r.status}`}>{r.status}</span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {r.status === 'PENDING' ? (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleApprove(r.id)}>
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleReject(r.id)}>
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Processed</span>
                    )}
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
