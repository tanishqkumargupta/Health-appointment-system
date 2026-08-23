import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, Stethoscope, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export default function BookAppointment() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [symptomsText, setSymptomsText] = useState('');
  
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [heldAppointment, setHeldAppointment] = useState(null);
  const [holdTimer, setHoldTimer] = useState(300); // 5 minutes in seconds

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load problem categories
  useEffect(() => {
    apiRequest('/appointments/categories', 'GET')
      .then((data) => {
        setCategories(data.categories);
        if (data.categories.length > 0) {
          setSelectedCategory(data.categories[0].category_name);
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  // Fetch doctors when category is selected
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!symptomsText.trim()) {
      setError('Please describe your symptoms.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await apiRequest(`/appointments/doctors?category=${encodeURIComponent(selectedCategory)}`, 'GET');
      setDoctors(res.doctors);
      if (res.doctors.length === 0) {
        setError(`No active doctors available currently for ${selectedCategory}.`);
      } else {
        setStep(2); // Move to Doctor selection
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch slots for selected doctor & date
  const fetchDoctorSlots = async (docId, dateStr) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest(`/appointments/doctors/${docId}/slots?date=${dateStr}`, 'GET');
      setSlots(res.slots);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoctor = (doc) => {
    setSelectedDoctor(doc);
    setStep(3); // Move to Date & Slot selection
    fetchDoctorSlots(doc.id, selectedDate);
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    if (selectedDoctor) {
      fetchDoctorSlots(selectedDoctor.id, newDate);
    }
  };

  // Step 4: Slot Hold (Rule 13)
  const handleHoldSlot = async (slot) => {
    setSelectedSlot(slot);
    setLoading(true);
    setError('');

    try {
      const res = await apiRequest('/appointments/hold', 'POST', {
        doctor_id: selectedDoctor.id,
        start_time: slot.start_datetime,
        problem_category: selectedCategory,
        symptom_text: symptomsText
      }, token);

      setHeldAppointment(res.appointment);
      setHoldTimer(300); // 5 min
      setStep(4); // Move to Confirmation screen
    } catch (err) {
      setError(err.message || 'Slot hold failed.');
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer for held slot
  useEffect(() => {
    let interval = null;
    if (step === 4 && holdTimer > 0) {
      interval = setInterval(() => {
        setHoldTimer((prev) => prev - 1);
      }, 1000);
    } else if (holdTimer === 0 && step === 4) {
      setError('Slot hold expired. Please select a time slot again.');
      setStep(3);
    }
    return () => clearInterval(interval);
  }, [step, holdTimer]);

  // Step 5: Confirm Booking
  const handleConfirmBooking = async () => {
    if (!heldAppointment) return;
    setLoading(true);
    setError('');

    try {
      await apiRequest('/appointments/confirm', 'POST', {
        appointment_id: heldAppointment.id
      }, token);

      setStep(5); // Success state
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="card-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2>Book an Appointment</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Follow the simple steps below to schedule your consultation.</p>
        </div>
        {step > 1 && step < 5 && (
          <button className="btn btn-secondary" onClick={() => setStep(step - 1)}>
            <ArrowLeft size={16} /> Back
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* STEP 1: Select Problem Category & Symptoms */}
      {step === 1 && (
        <div className="card">
          <form onSubmit={handleCategorySubmit}>
            <div className="form-group">
              <label style={{ fontSize: '1.05rem' }}>1. What problem are you experiencing?</label>
              <select
                className="form-control"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ padding: '12px', fontSize: '1rem' }}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.category_name}>
                    {c.category_name} ({c.specialization_name})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '1.05rem' }}>2. Tell us more about your symptoms</label>
              <textarea
                className="form-control"
                rows={4}
                value={symptomsText}
                onChange={(e) => setSymptomsText(e.target.value)}
                placeholder="Describe your symptoms, how long you've had them, severity..."
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
              {loading ? 'Finding Relevant Doctors...' : 'Find Relevant Doctors'}
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: Relevant Doctors List */}
      {step === 2 && (
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Relevant Doctors for {selectedCategory}</h3>
          <div className="grid-2">
            {doctors.map((doc) => (
              <div key={doc.id} className="card" style={{ marginBottom: 0, border: '1px solid var(--primary-100)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div className="brand-icon" style={{ backgroundColor: 'var(--primary-100)', color: 'var(--primary-600)' }}>
                    <Stethoscope size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 700 }}>Dr. {doc.name}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{doc.specialization_name}</p>
                  </div>
                </div>

                {doc.working_hours && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    🕒 Working Shift: {doc.working_hours.start_time} - {doc.working_hours.end_time} ({doc.working_hours.slot_duration} min slots)
                  </div>
                )}

                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleSelectDoctor(doc)}>
                  Select Doctor & View Slots
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: Select Date & Available Time Slot */}
      {step === 3 && selectedDoctor && (
        <div className="card">
          <h3 style={{ marginBottom: '8px' }}>Select Date & Time for Dr. {selectedDoctor.name}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Specialization: {selectedDoctor.specialization_name}
          </p>

          <div className="form-group" style={{ maxWidth: '300px' }}>
            <label>Select Date</label>
            <input
              type="date"
              className="form-control"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={handleDateChange}
            />
          </div>

          <div style={{ marginTop: '24px' }}>
            <h4 style={{ fontWeight: 600, marginBottom: '12px' }}>Available Time Slots</h4>
            {loading ? (
              <p>Loading slots...</p>
            ) : slots.length === 0 ? (
              <div className="alert alert-info">No available slots for this date (Doctor may be off or fully booked).</div>
            ) : (
              <div className="slot-grid">
                {slots.map((s, idx) => (
                  <button
                    key={idx}
                    disabled={!s.is_available}
                    className={`slot-btn ${s.is_available ? 'available' : 'disabled'}`}
                    onClick={() => handleHoldSlot(s)}
                  >
                    {s.start_time}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: 5-Minute Slot Hold Confirmation */}
      {step === 4 && heldAppointment && (
        <div className="card" style={{ border: '2px solid var(--primary-500)' }}>
          <div className="alert alert-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>Slot Temporarily Held!</strong> Complete booking before timer expires.
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-700)' }}>
              ⏱️ {Math.floor(holdTimer / 60)}:{(holdTimer % 60).toString().padStart(2, '0')}
            </div>
          </div>

          <h3 style={{ marginBottom: '16px' }}>Confirm Booking Summary</h3>
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
            <p><strong>Doctor:</strong> Dr. {heldAppointment.doctor_name} ({heldAppointment.specialization_name})</p>
            <p><strong>Date & Time:</strong> {new Date(heldAppointment.start_time).toLocaleString()}</p>
            <p><strong>Problem Area:</strong> {selectedCategory}</p>
            <p><strong>Symptoms:</strong> {symptomsText}</p>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem' }} onClick={handleConfirmBooking} disabled={loading}>
            {loading ? 'Confirming Appointment...' : 'Confirm Appointment Booking'}
          </button>
        </div>
      )}

      {/* STEP 5: Success Confirmation Banner */}
      {step === 5 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <CheckCircle size={56} color="#166534" style={{ margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: '1.6rem', color: '#166534', marginBottom: '8px' }}>Appointment Successfully Booked!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Your symptoms have been sent to our AI assistant for pre-visit summary preparation.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/patient/dashboard')}>
            Go to My Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
