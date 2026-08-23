import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { FileText, Pill } from 'lucide-react';

export default function PrescriptionHistory() {
  const { token } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/patient/prescriptions', 'GET', null, token)
      .then((data) => setPrescriptions(data.prescriptions))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading prescription history...</div>;

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2>My Prescription History</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>View authoritative prescriptions written by your doctors.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {prescriptions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px' }}>
          <Pill size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
          <p style={{ color: 'var(--text-muted)' }}>No prescriptions found in your medical history.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {prescriptions.map((p) => (
            <div key={p.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem' }}>Dr. {p.doctor_name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Date: {new Date(p.created_at).toLocaleDateString()}</p>
                </div>
                <span className="status-pill status-COMPLETED">VERIFIED PRESCRIPTION</span>
              </div>

              <h4 style={{ fontWeight: 600, marginBottom: '12px' }}>Prescribed Medications</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {p.items.map((item, idx) => (
                  <div key={idx} style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', borderLeft: '3px solid var(--primary-500)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.95rem' }}>
                      <span>💊 {item.medicine_name}</span>
                      <span>Dosage: {item.dosage}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      <span>🍽️ {item.food_instruction}</span>
                      <span>⏰ Frequency: {item.frequency.join(' + ')}</span>
                      {item.duration && <span>⏳ Duration: {item.duration}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
