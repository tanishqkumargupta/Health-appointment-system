import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Stethoscope, CalendarOff, Clock, LogOut } from 'lucide-react';

export default function AdminLayout() {
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
            <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/admin/doctors" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Stethoscope size={18} />
              <span>Doctors</span>
            </NavLink>
            <NavLink to="/admin/leave-requests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <CalendarOff size={18} />
              <span>Leave Requests</span>
            </NavLink>
            <NavLink to="/admin/schedule-requests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Clock size={18} />
              <span>Schedule Requests</span>
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
