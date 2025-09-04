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
import BarberSettings from './pages/barber/BarberSettings';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerBarbers from './pages/manager/ManagerBarbers';
import ManagerStats from './pages/manager/ManagerStats';
import ManagerSettings from './pages/manager/ManagerSettings';

// Componente ProtectedRoute: Garante que apenas usuários autenticados com as roles permitidas possam acessar as rotas.
// Se o usuário não estiver autenticado, redireciona para a página de autenticação.
// Se o usuário estiver autenticado, mas não tiver a role permitida, redireciona para a dashboard da sua role.
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user } = useAuth(); // Hook para acessar o contexto de autenticação e obter os dados do usuário.

  if (!user) {
    return <Navigate to="/auth" replace />; // Redireciona para /auth se não houver usuário logado.
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />; // Redireciona para a dashboard da role do usuário se a role não for permitida.
  }

  return <>{children}</>; // Renderiza os componentes filhos se o usuário tiver a role permitida.
}

// Componente principal da aplicação.
function App() {
  return (
    // ThemeProvider: Fornece o contexto de tema para toda a aplicação.
    <ThemeProvider>
      {/* AuthProvider: Fornece o contexto de autenticação para toda a aplicação. */}
      <AuthProvider>
        {/* Router: Gerencia o roteamento da aplicação. HashRouter é usado para compatibilidade com hospedagem estática. */}
        <Router>
          <div className="App"> {/* Container principal da aplicação. */}
            {/* Toaster: Componente para exibir notificações (toasts) na tela. */}
            <Toaster position="top-right" />
            {/* Routes: Define as rotas da aplicação. */}
            <Routes>
              {/* Rota de autenticação: acessível por qualquer usuário. */}
              <Route path="/auth" element={<AuthForm />} />
              
              {/* Rota protegida principal: todas as rotas aninhadas dentro dela exigem autenticação. */}
              <Route path="/" element={
                <ProtectedRoute allowedRoles={['client', 'barber', 'manager']}> {/* Permite acesso a clientes, barbeiros e gerentes. */}
                  <Layout /> {/* Componente de layout que contém a navegação e o conteúdo principal. */}
                </ProtectedRoute>
              }>
                {/* Rotas do Cliente */}
                <Route path="client" element={
                  <ProtectedRoute allowedRoles={['client']}> {/* Apenas clientes podem acessar. */}
                    <ClientDashboard />
                  </ProtectedRoute>
                } />
                <Route path="client/barbershops" element={
                  <ProtectedRoute allowedRoles={['client']}> {/* Apenas clientes podem acessar. */}
                    <Barbershops />
                  </ProtectedRoute>
                } />
                <Route path="client/appointments" element={
                  <ProtectedRoute allowedRoles={['client']}> {/* Apenas clientes podem acessar. */}
                    <Appointments />
                  </ProtectedRoute>
                } />
                <Route path="client/barbershops/:barbershopId/book" element={
                  <ProtectedRoute allowedRoles={['client']}> {/* Apenas clientes podem acessar. */}
                    <BookAppointment />
                  </ProtectedRoute>
                } />
                
                {/* Rotas do Barbeiro */}
                <Route path="barber" element={
                  <ProtectedRoute allowedRoles={['barber']}> {/* Apenas barbeiros podem acessar. */}
                    <BarberDashboard />
                  </ProtectedRoute>
                } />
                <Route path="barber/schedule" element={
                  <ProtectedRoute allowedRoles={['barber']}> {/* Apenas barbeiros podem acessar. */}
                    <BarberSchedule />
                  </ProtectedRoute>
                } />
                <Route path="barber/stats" element={
                  <ProtectedRoute allowedRoles={['barber']}> {/* Apenas barbeiros podem acessar. */}
                    <BarberStats />
                  </ProtectedRoute>
                } />
                <Route path="barber/settings" element={
                  <ProtectedRoute allowedRoles={['barber']}> {/* Apenas barbeiros podem acessar. */}
                    <BarberSettings />
                  </ProtectedRoute>
                } />
                
                {/* Rotas do Gerente */}
                <Route path="manager" element={
                  <ProtectedRoute allowedRoles={['manager']}> {/* Apenas gerentes podem acessar. */}
                    <ManagerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="manager/barbers" element={
                  <ProtectedRoute allowedRoles={['manager']}> {/* Apenas gerentes podem acessar. */}
                    <ManagerBarbers />
                  </ProtectedRoute>
                } />
                <Route path="manager/stats" element={
                  <ProtectedRoute allowedRoles={['manager']}> {/* Apenas gerentes podem acessar. */}
                    <ManagerStats />
                  </ProtectedRoute>
                } />
                <Route path="manager/settings" element={
                  <ProtectedRoute allowedRoles={['manager']}> {/* Apenas gerentes podem acessar. */}
                    <ManagerSettings />
                  </ProtectedRoute>
                } />
                
                {/* Redirecionamento padrão: se nenhuma rota corresponder, redireciona para /client. */}
                <Route index element={<Navigate to="/client" replace />} />
              </Route>
              
              {/* Redirecionamento de fallback: se nenhuma rota corresponder (fora do layout protegido), redireciona para /auth. */}
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;


