import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import AuthForm from './components/AuthForm';
import ClientDashboard from './pages/client/ClientDashboard';
import Barbershops from './pages/client/Barbershops';
import Appointments from './pages/client/Appointments';
import BookAppointment from './pages/client/BookAppointment';
import BarberDashboard from './pages/barber/BarberDashboard';
import BarberSchedule from './pages/barber/BarberSchedule';
import BarberStats from './pages/barber/BarberStats';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerBarbers from './pages/manager/ManagerBarbers';
import ManagerStats from './pages/manager/ManagerStats';
import ManagerSettings from './pages/manager/ManagerSettings';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Toaster position="top-right" />
            <Routes>
              <Route path="/auth" element={<AuthForm />} />
              
              <Route path="/" element={
                <ProtectedRoute allowedRoles={['client', 'barber', 'manager']}>
                  <Layout />
                </ProtectedRoute>
              }>
                {/* Client Routes */}
                <Route path="client" element={
                  <ProtectedRoute allowedRoles={['client']}>
                    <ClientDashboard />
                  </ProtectedRoute>
                } />
                <Route path="client/barbershops" element={
                  <ProtectedRoute allowedRoles={['client']}>
                    <Barbershops />
                  </ProtectedRoute>
                } />
                <Route path="client/appointments" element={
                  <ProtectedRoute allowedRoles={['client']}>
                    <Appointments />
                  </ProtectedRoute>
                } />
                <Route path="client/barbershops/:barbershopId/book" element={
                  <ProtectedRoute allowedRoles={['client']}>
                    <BookAppointment />
                  </ProtectedRoute>
                } />
                
                {/* Barber Routes */}
                <Route path="barber" element={
                  <ProtectedRoute allowedRoles={['barber']}>
                    <BarberDashboard />
                  </ProtectedRoute>
                } />
                <Route path="barber/schedule" element={
                  <ProtectedRoute allowedRoles={['barber']}>
                    <BarberSchedule />
                  </ProtectedRoute>
                } />
                <Route path="barber/stats" element={
                  <ProtectedRoute allowedRoles={['barber']}>
                    <BarberStats />
                  </ProtectedRoute>
                } />
                
                {/* Manager Routes */}
                <Route path="manager" element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <ManagerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="manager/barbers" element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <ManagerBarbers />
                  </ProtectedRoute>
                } />
                <Route path="manager/stats" element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <ManagerStats />
                  </ProtectedRoute>
                } />
                <Route path="manager/settings" element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <ManagerSettings />
                  </ProtectedRoute>
                } />
                
                {/* Default redirect */}
                <Route index element={<Navigate to="/client" replace />} />
              </Route>
              
              {/* Fallback redirect */}
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

