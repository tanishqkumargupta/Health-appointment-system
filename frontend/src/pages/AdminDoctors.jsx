import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { UserPlus, Stethoscope, Power, Edit3 } from 'lucide-react';

export default function AdminDoctors() {
  const { token } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [specializationId, setSpecializationId] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [slotDuration, setSlotDuration] = useState(30);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const [docsRes, specsRes] = await Promise.all([
        apiRequest('/admin/doctors', 'GET', null, token),
        apiRequest('/admin/specializations', 'GET', null, token)
      ]);
      setDoctors(docsRes.doctors);
      setSpecializations(specsRes.specializations);
      if (specsRes.specializations.length > 0) {
        setSpecializationId(specsRes.specializations[0].id);
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      await apiRequest('/admin/doctors', 'POST', {
        name,
        email,
        password,
        phone,
        specialization_id: specializationId,
        start_time: startTime,
        end_time: endTime,
        slot_duration: slotDuration
      }, token);

      setMsg({ type: 'success', text: `Doctor Dr. ${name} created successfully!` });
      setShowModal(false);
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      fetchData();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (doctor) => {
    try {
      await apiRequest(`/admin/doctors/${doctor.id}/status`, 'PATCH', {
        is_active: !doctor.is_active
      }, token);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2>Doctor Management</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Create, edit, configure working hours, and activate/deactivate doctor profiles.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <UserPlus size={18} /> Add New Doctor
        </button>
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div className="card">
        {loading ? (
          <p>Loading doctors list...</p>
        ) : doctors.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No doctors provisioned yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-light)', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Doctor Name</th>
                <th style={{ padding: '12px' }}>Specialization</th>
                <th style={{ padding: '12px' }}>Working Shift</th>
                <th style={{ padding: '12px' }}>Slot Duration</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doc) => (
                <tr key={doc.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '12px', fontWeight: 600 }}>
                    Dr. {doc.name}
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>{doc.email}</div>
                  </td>
                  <td style={{ padding: '12px' }}>{doc.specialization_name}</td>
                  <td style={{ padding: '12px' }}>{doc.working_hours ? `${doc.working_hours.start_time} - ${doc.working_hours.end_time}` : 'Not set'}</td>
                  <td style={{ padding: '12px' }}>{doc.working_hours ? `${doc.working_hours.slot_duration} mins` : '30 mins'}</td>
                  <td style={{ padding: '12px' }}>
                    <span className={`status-pill ${doc.is_active ? 'status-APPROVED' : 'status-REJECTED'}`}>
                      {doc.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button
                      className={`btn ${doc.is_active ? 'btn-danger' : 'btn-primary'}`}
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => handleToggleStatus(doc)}
                    >
                      <Power size={14} /> {doc.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Create Doctor */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header">
              <h3>Create Doctor Account</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">✕</button>
            </div>

            <form onSubmit={handleCreateDoctor}>
              <div className="grid-2">
                <div className="form-group">
                  <label>Doctor Full Name</label>
                  <input type="text" className="form-control" placeholder="Dr. Sharma" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" className="form-control" placeholder="sharma@healthapp.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Initial Password</label>
                  <input type="password" className="form-control" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" className="form-control" placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label>Controlled Specialization Dropdown</label>
                <select className="form-control" value={specializationId} onChange={(e) => setSpecializationId(e.target.value)} required>
                  {specializations.map((spec) => (
                    <option key={spec.id} value={spec.id}>{spec.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label>Start Time</label>
                  <input type="time" className="form-control" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>End Time (Overnight supported)</label>
                  <input type="time" className="form-control" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Slot Duration</label>
                  <select className="form-control" value={slotDuration} onChange={(e) => setSlotDuration(e.target.value)}>
                    <option value={15}>15 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={submitting}>
                {submitting ? 'Creating Doctor...' : 'Provision Doctor Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
