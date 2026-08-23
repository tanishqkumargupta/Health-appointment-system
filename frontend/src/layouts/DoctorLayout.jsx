import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Calendar, CalendarOff, Clock, User, LogOut } from 'lucide-react';

export default function DoctorLayout() {
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
            <NavLink to="/doctor/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/doctor/appointments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Calendar size={18} />
              <span>Appointments</span>
            </NavLink>
            <NavLink to="/doctor/leave" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <CalendarOff size={18} />
              <span>Request Leave</span>
            </NavLink>
            <NavLink to="/doctor/schedule-request" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Clock size={18} />
              <span>Request Schedule</span>
            </NavLink>
            <NavLink to="/doctor/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
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
