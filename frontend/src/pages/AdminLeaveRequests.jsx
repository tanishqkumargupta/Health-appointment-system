import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { CheckCircle, XCircle } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import StatusBadge from '../components/StatusBadge';
import Loading from '../components/Loading';
import { ErrorMessage, EmptyState } from '../components/ErrorMessage';

export default function AdminLeaveRequests() {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [pendingAction, setPendingAction] = useState(null); // { request, action: 'approve' | 'reject' }
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const fetchRequests = async () => {
    try {
      const res = await apiRequest('/admin/leave-requests', 'GET', null, token);
      setRequests(res.leave_requests);
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const runAction = async () => {
    if (!pendingAction) return;
    const { request: r, action } = pendingAction;
    setSubmitting(true);
    setMsg({ type: '', text: '' });
    try {
      if (action === 'approve') {
        await apiRequest(`/admin/leave-requests/${r.id}/approve`, 'POST', null, token);
        setMsg({ type: 'success', text: 'Leave request approved. Any conflicting patient appointments have been cancelled and patients notified.' });
      } else {
        await apiRequest(`/admin/leave-requests/${r.id}/reject`, 'POST', null, token);
        setMsg({ type: 'info', text: 'Leave request rejected.' });
      }
      setPendingAction(null);
      fetchRequests();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2>Leave Requests Approval Center</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Review doctor leave submissions. Approving leave automatically cancels conflicting patient bookings & queues notifications.
          </p>
        </div>
      </div>

      <ErrorMessage type={msg.type || 'error'} text={msg.text} />

      <div className="card">
        {loading ? (
          <Loading label="Loading leave requests..." />
        ) : requests.length === 0 ? (
          <EmptyState text="No pending or historical leave requests found." />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-light)', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Doctor Name</th>
                <th style={{ padding: '12px' }}>Requested Leave Date</th>
                <th style={{ padding: '12px' }}>Reason</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '12px', fontWeight: 600 }}>Dr. {r.doctor_name}</td>
                  <td style={{ padding: '12px', fontWeight: 700 }}>{r.leave_date}</td>
                  <td style={{ padding: '12px' }}>{r.reason || 'N/A'}</td>
                  <td style={{ padding: '12px' }}>
                    <StatusBadge status={r.status} />
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {r.status === 'PENDING' ? (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={() => setPendingAction({ request: r, action: 'approve' })}
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={() => setPendingAction({ request: r, action: 'reject' })}
                        >
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

      {/* Leave conflict confirmation (spec section 38) — the backend, not this
          UI, determines which appointments are actually affected. We don't
          have a preview endpoint yet to show an exact count before approving,
          so this warns generically and never approves silently. */}
      {pendingAction && pendingAction.action === 'approve' && (
        <ConfirmModal
          title="Leave Conflict"
          message={`Dr. ${pendingAction.request.doctor_name} has requested leave for ${pendingAction.request.leave_date}.`}
          details="If this doctor has existing appointments on that date, approving will cancel them and patients will be notified automatically."
          confirmLabel="Approve Leave"
          confirmVariant="btn-primary"
          onConfirm={runAction}
          onCancel={() => setPendingAction(null)}
          loading={submitting}
        />
      )}

      {pendingAction && pendingAction.action === 'reject' && (
        <ConfirmModal
          title="Reject Leave Request"
          message={`Reject Dr. ${pendingAction.request.doctor_name}'s leave request for ${pendingAction.request.leave_date}?`}
          confirmLabel="Reject Request"
          confirmVariant="btn-danger"
          onConfirm={runAction}
          onCancel={() => setPendingAction(null)}
          loading={submitting}
        />
      )}
    </div>
  );
}
