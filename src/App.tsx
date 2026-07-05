import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Schedules from './pages/Schedules';
import RoutesPage from './pages/Routes';
import FuelMaintenance from './pages/FuelMaintenance';
import Fleet from './pages/Fleet';
import Reports from './pages/Reports';

// Protected Route Wrapper Component
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedRoles?: ('ADMIN' | 'SUPERVISOR' | 'OPERATOR')[]; 
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<Landing />} />

          {/* Public Auth Page */}
          <Route path="/login" element={<Login />} />

          {/* Protected Main Shell (Pathless layout route) */}
          <Route 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard (Home) */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Timetable Scheduler */}
            <Route path="/schedules" element={<Schedules />} />

            {/* Route Stops Sequencer */}
            <Route path="/routes" element={<RoutesPage />} />

            {/* Fuel & Maintenance log */}
            <Route path="/logs" element={<FuelMaintenance />} />

            {/* Drivers & Vehicle Registry */}
            <Route path="/fleet" element={<Fleet />} />

            {/* Reports & Analytics (Admins & Supervisors only) */}
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR']}>
                  <Reports />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;


