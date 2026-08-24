import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, User as UserIcon } from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-icon">
          <Activity size={22} />
        </div>
        <span className="brand-name">MediCare Health</span>
      </div>

      {user && (
        <div className="user-badge">
          <NotificationBell />
          <span className={`role-tag role-${user.role}`}>{user.role}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
            <UserIcon size={18} />
            <span>{user.name}</span>
          </div>
        </div>
      )}
    </header>
  );
}
