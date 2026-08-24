import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { Calendar, Clock, User, FileText, CheckCircle, Plus, Trash2, AlertCircle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function DoctorAppointments() {
  const { token } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState([]);
  const [slots, setSlots] = useState([]);
  const [activeAppt, setActiveAppt] = useState(null);

  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [prescriptionItems, setPrescriptionItems] = useState([
    { medicine_name: '', dosage: '', food_instruction: 'After food', frequency: ['Morning', 'Evening'], duration: '5 days' }
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchAppointments(selectedDate);
  }, [selectedDate, token]);

  const fetchAppointments = async (dateStr) => {
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await apiRequest(`/doctor/appointments?date=${dateStr}`, 'GET', null, token);
      setAppointments(res.appointments);
      setSlots(res.slots);
      if (res.appointments.length > 0) {
        handleSelectAppointment(res.appointments[0]);
      } else {
        setActiveAppt(null);
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAppointment = (appt) => {
    setActiveAppt(appt);
    setMsg({ type: '', text: '' });
    if (appt.consultation) {
      setDiagnosis(appt.consultation.diagnosis);
      setClinicalNotes(appt.consultation.clinical_notes || '');
      if (appt.consultation.prescription && appt.consultation.prescription.items) {
        setPrescriptionItems(appt.consultation.prescription.items);
      }
    } else {
      setDiagnosis('');
      setClinicalNotes('');
      setPrescriptionItems([
        { medicine_name: '', dosage: '', food_instruction: 'After food', frequency: ['Morning', 'Evening'], duration: '5 days' }
      ]);
    }
  };

  const handleAddMedicine = () => {
    setPrescriptionItems([
      ...prescriptionItems,
      { medicine_name: '', dosage: '', food_instruction: 'After food', frequency: ['Morning'], duration: '5 days' }
    ]);
  };

  const handleRemoveMedicine = (index) => {
    if (prescriptionItems.length > 1) {
      setPrescriptionItems(prescriptionItems.filter((_, idx) => idx !== index));
    }
  };

  const handlePrescriptionChange = (index, field, value) => {
    const updated = [...prescriptionItems];
    updated[index][field] = value;
    setPrescriptionItems(updated);
  };

  const handleFrequencyToggle = (index, freqOption) => {
    const updated = [...prescriptionItems];
    const currentFreq = updated[index].frequency || [];
    if (currentFreq.includes(freqOption)) {
      updated[index].frequency = currentFreq.filter(f => f !== freqOption);
    } else {
      updated[index].frequency = [...currentFreq, freqOption];
    }
    setPrescriptionItems(updated);
  };

  const handleCompleteConsultation = async (e) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      setMsg({ type: 'error', text: 'Diagnosis is required.' });
      return;
    }
    setSaving(true);
    setMsg({ type: '', text: '' });

    try {
      const res = await apiRequest(`/doctor/appointments/${activeAppt.id}/consultation`, 'POST', {
        diagnosis,
        clinical_notes: clinicalNotes,
        prescription_items: prescriptionItems
      }, token);

      setMsg({ type: 'success', text: 'Consultation & prescription completed successfully!' });
      fetchAppointments(selectedDate);
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2>Consultation Panel</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Select a date and click a booked slot to examine patient information and issue prescriptions.</p>
        </div>
        <div style={{ width: '220px' }}>
          <input
            type="date"
            className="form-control"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
        {/* Left Sidebar: Slots & Booked Appointments */}
        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>Appointments for {selectedDate}</h3>
          {loading ? (
            <p>Loading slots...</p>
          ) : appointments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No appointments booked for this date.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  onClick={() => handleSelectAppointment(appt)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: activeAppt?.id === appt.id ? '2px solid var(--primary-600)' : '1px solid var(--border-light)',
                    backgroundColor: activeAppt?.id === appt.id ? 'var(--primary-50)' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.85rem' }}>
                    <span>{new Date(appt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <StatusBadge status={appt.status} />
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '4px' }}>{appt.patient_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{appt.symptom?.problem_category}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Main Content Area: Patient Info, AI Summary & Consultation Editor */}
        <div>
          {!activeAppt ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <User size={48} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
              <p style={{ color: 'var(--text-muted)' }}>Select a booked appointment from the left sidebar to begin consultation.</p>
            </div>
          ) : (
            <div>
              {/* Patient Info Card */}
              <div className="card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1.3rem' }}>{activeAppt.patient_name}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      Email: {activeAppt.patient_email} | Phone: {activeAppt.patient_phone || 'N/A'}
                    </p>
                  </div>
                  <StatusBadge status={activeAppt.status} />
                </div>
                <hr style={{ margin: '14px 0', borderColor: 'var(--border-light)' }} />

                {activeAppt.symptom && (
                  <div>
                    <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>Patient Symptoms ({activeAppt.symptom.problem_category})</h4>
                    <p style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '6px', fontSize: '0.9rem', marginTop: '6px' }}>
                      {activeAppt.symptom.symptom_text}
                    </p>
                  </div>
                )}

                {/* Rule 21: Pre-visit AI summary */}
                {activeAppt.pre_visit_summary && (
                  <div style={{ marginTop: '16px', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', padding: '14px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ color: '#6b21a8' }}>✨ Pre-Visit AI Clinical Summary</strong>
                      <span className={`status-pill urgency-${activeAppt.pre_visit_summary.urgency}`}>
                        Urgency: {activeAppt.pre_visit_summary.urgency}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#4c1d95', marginBottom: '8px' }}>
                      <strong>Chief Complaint:</strong> {activeAppt.pre_visit_summary.chief_complaint}
                    </p>
                    {activeAppt.pre_visit_summary.suggested_questions?.length > 0 && (
                      <div>
                        <strong style={{ fontSize: '0.85rem', color: '#581c87' }}>Suggested Doctor Questions:</strong>
                        <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: '#4c1d95', marginTop: '4px' }}>
                          {activeAppt.pre_visit_summary.suggested_questions.map((q, idx) => (
                            <li key={idx}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Consultation & Prescription Form */}
              <div className="card">
                <h3 style={{ marginBottom: '16px' }}>Conduct Consultation</h3>

                <form onSubmit={handleCompleteConsultation}>
                  <div className="form-group">
                    <label>Diagnosis / Disease (Doctor Entered)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Acute Allergic Dermatitis"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      disabled={activeAppt.status === 'COMPLETED'}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Clinical Notes</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Enter clinical observations, lifestyle advice..."
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      disabled={activeAppt.status === 'COMPLETED'}
                    />
                  </div>

                  <div style={{ marginTop: '24px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontWeight: 700 }}>Prescription Items</h4>
                    {activeAppt.status !== 'COMPLETED' && (
                      <button type="button" className="btn btn-secondary" onClick={handleAddMedicine} style={{ fontSize: '0.85rem' }}>
                        <Plus size={16} /> Add Medicine
                      </button>
                    )}
                  </div>

                  {prescriptionItems.map((item, index) => (
                    <div key={index} style={{ border: '1px solid var(--border-light)', padding: '16px', borderRadius: '8px', marginBottom: '16px', backgroundColor: '#ffffff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <strong style={{ fontSize: '0.9rem' }}>Medicine #{index + 1}</strong>
                        {prescriptionItems.length > 1 && activeAppt.status !== 'COMPLETED' && (
                          <button type="button" onClick={() => handleRemoveMedicine(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className="grid-2">
                        <div className="form-group">
                          <label>Medicine Name</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. Paracetamol"
                            value={item.medicine_name}
                            onChange={(e) => handlePrescriptionChange(index, 'medicine_name', e.target.value)}
                            disabled={activeAppt.status === 'COMPLETED'}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Dosage</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. 500 mg"
                            value={item.dosage}
                            onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                            disabled={activeAppt.status === 'COMPLETED'}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid-2">
                        <div className="form-group">
                          <label>Food Instruction</label>
                          <select
                            className="form-control"
                            value={item.food_instruction}
                            onChange={(e) => handlePrescriptionChange(index, 'food_instruction', e.target.value)}
                            disabled={activeAppt.status === 'COMPLETED'}
                          >
                            <option value="Before food">Before food</option>
                            <option value="With food">With food</option>
                            <option value="After food">After food</option>
                            <option value="Without food">Without food</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Duration</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. 5 days"
                            value={item.duration}
                            onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                            disabled={activeAppt.status === 'COMPLETED'}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Frequency Options (Reminders generated automatically)</label>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '6px' }}>
                          {['Morning', 'Afternoon', 'Evening', 'Night'].map((freq) => (
                            <label key={freq} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={item.frequency?.includes(freq)}
                                onChange={() => handleFrequencyToggle(index, freq)}
                                disabled={activeAppt.status === 'COMPLETED'}
                              />
                              <span>{freq} {freq === 'Morning' && '(9 AM)'}{freq === 'Afternoon' && '(2 PM)'}{freq === 'Evening' && '(6 PM)'}{freq === 'Night' && '(9 PM)'}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {activeAppt.status !== 'COMPLETED' ? (
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '12px' }} disabled={saving}>
                      <CheckCircle size={18} />
                      <span>{saving ? 'Completing Consultation...' : 'Complete Consultation'}</span>
                    </button>
                  ) : (
                    <div className="alert alert-info">Consultation for this appointment has already been completed.</div>
                  )}
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
