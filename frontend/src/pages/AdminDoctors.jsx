import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { UserPlus, Power, Edit3 } from 'lucide-react';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import Loading from '../components/Loading';
import { ErrorMessage, EmptyState } from '../components/ErrorMessage';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  specializationId: '',
  startTime: '09:00',
  endTime: '17:00',
  slotDuration: 30,
};

export default function AdminDoctors() {
  const { token } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [modalMode, setModalMode] = useState(null); // null | 'create' | 'edit'
  const [editingDoctor, setEditingDoctor] = useState(null);

  const [form, setForm] = useState(emptyForm);
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
        apiRequest('/admin/specializations', 'GET', null, token),
      ]);
      setDoctors(docsRes.doctors);
      setSpecializations(specsRes.specializations);
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setForm({ ...emptyForm, specializationId: specializations[0]?.id || '' });
    setEditingDoctor(null);
    setModalMode('create');
  };

  const openEditModal = (doctor) => {
    setForm({
      name: doctor.name,
      email: doctor.email,
      password: '',
      phone: doctor.phone || '',
      specializationId: doctor.specialization_id ?? specializations.find((s) => s.name === doctor.specialization_name)?.id ?? '',
      startTime: doctor.working_hours?.start_time || '09:00',
      endTime: doctor.working_hours?.end_time || '17:00',
      slotDuration: doctor.working_hours?.slot_duration || 30,
    });
    setEditingDoctor(doctor);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingDoctor(null);
  };

  const handleField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      if (modalMode === 'create') {
        await apiRequest('/admin/doctors', 'POST', {
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          specialization_id: form.specializationId,
          start_time: form.startTime,
          end_time: form.endTime,
          slot_duration: form.slotDuration,
        }, token);
        setMsg({ type: 'success', text: `Doctor Dr. ${form.name} created successfully.` });
      } else {
        await apiRequest(`/admin/doctors/${editingDoctor.id}`, 'PUT', {
          name: form.name,
          phone: form.phone,
          specialization_id: form.specializationId,
          start_time: form.startTime,
          end_time: form.endTime,
          slot_duration: form.slotDuration,
        }, token);
        setMsg({ type: 'success', text: `Dr. ${form.name}'s profile was updated.` });
      }
      closeModal();
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
        is_active: !doctor.is_active,
      }, token);
      fetchData();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2>Doctor Management</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Create, edit, configure working hours, and activate/deactivate doctor profiles.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <UserPlus size={18} /> Add New Doctor
        </button>
      </div>

      <ErrorMessage type={msg.type || 'error'} text={msg.text} />

      <div className="card">
        {loading ? (
          <Loading label="Loading doctors list..." />
        ) : doctors.length === 0 ? (
          <EmptyState text="No doctors provisioned yet." />
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
                    <StatusBadge status={doc.is_active ? 'ACTIVE' : 'INACTIVE'} />
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => openEditModal(doc)}
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                      <button
                        className={`btn ${doc.is_active ? 'btn-danger' : 'btn-primary'}`}
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => handleToggleStatus(doc)}
                      >
                        <Power size={14} /> {doc.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalMode && (
        <Modal title={modalMode === 'create' ? 'Create Doctor Account' : `Edit Dr. ${editingDoctor?.name}`} onClose={closeModal}>
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label>Doctor Full Name</label>
                <input type="text" className="form-control" placeholder="Dr. Sharma" value={form.name} onChange={handleField('name')} required />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="sharma@healthapp.com"
                  value={form.email}
                  onChange={handleField('email')}
                  required
                  disabled={modalMode === 'edit'}
                  title={modalMode === 'edit' ? 'Email cannot be changed after account creation.' : undefined}
                />
              </div>
            </div>

            <div className="grid-2">
              {modalMode === 'create' && (
                <div className="form-group">
                  <label>Initial Password</label>
                  <input type="password" className="form-control" placeholder="••••••••" value={form.password} onChange={handleField('password')} required />
                </div>
              )}
              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" className="form-control" placeholder="9876543210" value={form.phone} onChange={handleField('phone')} />
              </div>
            </div>

            <div className="form-group">
              <label>Specialization</label>
              <select className="form-control" value={form.specializationId} onChange={handleField('specializationId')} required>
                {specializations.map((spec) => (
                  <option key={spec.id} value={spec.id}>{spec.name}</option>
                ))}
              </select>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label>Start Time</label>
                <input type="time" className="form-control" value={form.startTime} onChange={handleField('startTime')} required />
              </div>
              <div className="form-group">
                <label>End Time (overnight supported)</label>
                <input type="time" className="form-control" value={form.endTime} onChange={handleField('endTime')} required />
              </div>
              <div className="form-group">
                <label>Slot Duration</label>
                <select className="form-control" value={form.slotDuration} onChange={handleField('slotDuration')}>
                  <option value={15}>15 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>60 mins</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={submitting}>
              {submitting
                ? (modalMode === 'create' ? 'Creating Doctor...' : 'Saving Changes...')
                : (modalMode === 'create' ? 'Provision Doctor Account' : 'Save Changes')}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
