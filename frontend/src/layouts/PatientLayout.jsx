import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, CalendarPlus, FileText, User, LogOut } from 'lucide-react';

export default function PatientLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      <Header />
      <div className="main-layout">
        <aside className="app-sidebar">
          <nav className="sidebar-nav">
            <NavLink to="/patient/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/patient/book" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <CalendarPlus size={18} />
              <span>Book Appointment</span>
            </NavLink>
            <NavLink to="/patient/prescriptions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FileText size={18} />
              <span>Prescription History</span>
            </NavLink>
            <NavLink to="/patient/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <User size={18} />
              <span>Profile</span>
            </NavLink>
          </nav>

          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </aside>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
