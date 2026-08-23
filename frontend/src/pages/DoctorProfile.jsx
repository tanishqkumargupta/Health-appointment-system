import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Stethoscope } from 'lucide-react';

export default function DoctorProfile() {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: '600px' }}>
      <div className="card-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2>Doctor Profile</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>View your profile and specialization details.</p>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div className="brand-icon" style={{ width: '56px', height: '56px', borderRadius: '50%' }}>
            <Stethoscope size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.4rem' }}>Dr. {user?.name}</h3>
            <span className="role-tag role-DOCTOR">DOCTOR ACCOUNT</span>
          </div>
        </div>

        <hr style={{ margin: '16px 0', borderColor: 'var(--border-light)' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem' }}>
          <div><strong>Email:</strong> {user?.email}</div>
          <div><strong>Phone:</strong> {user?.phone || 'Not provided'}</div>
          <div><strong>Role Authority:</strong> Managed by System Administrator</div>
        </div>
      </div>
    </div>
  );
}
