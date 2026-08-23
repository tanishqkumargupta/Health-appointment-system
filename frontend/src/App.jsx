import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import PatientLayout from './layouts/PatientLayout';
import DoctorLayout from './layouts/DoctorLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth Pages
import Login from './pages/Login';
import Signup from './pages/Signup';

// Patient Pages
import PatientDashboard from './pages/PatientDashboard';
import BookAppointment from './pages/BookAppointment';
import PrescriptionHistory from './pages/PrescriptionHistory';
import PatientProfile from './pages/PatientProfile';

// Doctor Pages
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorAppointments from './pages/DoctorAppointments';
import DoctorLeave from './pages/DoctorLeave';
import DoctorScheduleRequest from './pages/DoctorScheduleRequest';
import DoctorProfile from './pages/DoctorProfile';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminDoctors from './pages/AdminDoctors';
import AdminLeaveRequests from './pages/AdminLeaveRequests';
import AdminScheduleRequests from './pages/AdminScheduleRequests';

function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading user session...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'PATIENT') return <Navigate to="/patient/dashboard" replace />;
    if (user.role === 'DOCTOR') return <Navigate to="/doctor/dashboard" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={user ? (
        user.role === 'PATIENT' ? <Navigate to="/patient/dashboard" /> :
        user.role === 'DOCTOR' ? <Navigate to="/doctor/dashboard" /> :
        <Navigate to="/admin/dashboard" />
      ) : <Login />} />

      <Route path="/signup" element={user ? <Navigate to="/patient/dashboard" /> : <Signup />} />

      {/* Patient Protected Routes */}
      <Route path="/patient" element={
        <ProtectedRoute allowedRoles={['PATIENT']}>
          <PatientLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PatientDashboard />} />
        <Route path="book" element={<BookAppointment />} />
        <Route path="prescriptions" element={<PrescriptionHistory />} />
        <Route path="profile" element={<PatientProfile />} />
      </Route>

      {/* Doctor Protected Routes */}
      <Route path="/doctor" element={
        <ProtectedRoute allowedRoles={['DOCTOR']}>
          <DoctorLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DoctorDashboard />} />
        <Route path="appointments" element={<DoctorAppointments />} />
        <Route path="leave" element={<DoctorLeave />} />
        <Route path="schedule-request" element={<DoctorScheduleRequest />} />
        <Route path="profile" element={<DoctorProfile />} />
      </Route>

      {/* Admin Protected Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="doctors" element={<AdminDoctors />} />
        <Route path="leave-requests" element={<AdminLeaveRequests />} />
        <Route path="schedule-requests" element={<AdminScheduleRequests />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
