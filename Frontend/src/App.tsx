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

/**
 * Componente ProtectedRoute:
 * Garante que apenas usuários autenticados com as roles permitidas possam acessar as rotas.
 * Se o usuário não estiver autenticado, redireciona para a página de autenticação.
 * Se o usuário estiver autenticado, mas não tiver a role permitida, redireciona para a dashboard da sua role.
 * @param {React.ReactNode} children - Os componentes filhos que serão renderizados se o acesso for permitido.
 * @param {string[]} allowedRoles - Um array de strings contendo as roles permitidas para acessar esta rota.
 */
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user } = useAuth(); // Hook para acessar o contexto de autenticação e obter os dados do usuário.

  // Se não houver usuário logado, redireciona para a página de autenticação.
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Se o usuário logado não tiver uma das roles permitidas, redireciona para a dashboard da sua role.
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  // Se o usuário estiver autenticado e tiver a role permitida, renderiza os componentes filhos.
  return <>{children}</>;
}

/**
 * Componente principal da aplicação (App).
 * Configura o roteamento, provedores de contexto (autenticação e tema) e as rotas protegidas.
 */
function App() {
  return (
    // ThemeProvider: Fornece o contexto de tema para toda a aplicação, permitindo alternar entre temas claro/escuro.
    <ThemeProvider>
      {/* AuthProvider: Fornece o contexto de autenticação para toda a aplicação, gerenciando o estado de login do usuário. */}
      <AuthProvider>
        {/* Router: Gerencia o roteamento da aplicação. HashRouter é usado para compatibilidade com hospedagem estática. */}
        <Router>
          <div className="App"> {/* Container principal da aplicação. */}
            {/* Toaster: Componente para exibir notificações (toasts) na tela, como mensagens de sucesso ou erro. */}
            <Toaster position="top-right" />
            {/* Routes: Define as rotas da aplicação, mapeando URLs para componentes React. */}
            <Routes>
              {/* Rota de autenticação: acessível por qualquer usuário, sem necessidade de login. */}
              <Route path="/auth" element={<AuthForm />} />
              
              {/* Rota protegida principal: todas as rotas aninhadas dentro dela exigem autenticação. */}
              <Route path="/" element={
                <ProtectedRoute allowedRoles={['client', 'barber', 'manager']}> {/* Permite acesso a clientes, barbeiros e gerentes. */}
                  <Layout /> {/* Componente de layout que contém a navegação e o conteúdo principal, comum a todas as páginas protegidas. */}
                </ProtectedRoute>
              }>
                {/* Rotas do Cliente */}
                <Route path="client" element={
                  <ProtectedRoute allowedRoles={['client']}> {/* Apenas clientes podem acessar esta dashboard. */}
                    <ClientDashboard />
                  </ProtectedRoute>
                } />
                <Route path="client/barbershops" element={
                  <ProtectedRoute allowedRoles={['client']}> {/* Apenas clientes podem acessar a lista de barbearias. */}
                    <Barbershops />
                  </ProtectedRoute>
                } />
                <Route path="client/appointments" element={
                  <ProtectedRoute allowedRoles={['client']}> {/* Apenas clientes podem acessar seus agendamentos. */}
                    <Appointments />
                  </ProtectedRoute>
                } />
                <Route path="client/barbershops/:barbershopId/book" element={
                  <ProtectedRoute allowedRoles={['client']}> {/* Apenas clientes podem agendar um horário em uma barbearia específica. */}
                    <BookAppointment />
                  </ProtectedRoute>
                } />
                
                {/* Rotas do Barbeiro */}
                <Route path="barber" element={
                  <ProtectedRoute allowedRoles={['barber']}> {/* Apenas barbeiros podem acessar esta dashboard. */}
                    <BarberDashboard />
                  </ProtectedRoute>
                } />
                <Route path="barber/schedule" element={
                  <ProtectedRoute allowedRoles={['barber']}> {/* Apenas barbeiros podem acessar sua agenda. */}
                    <BarberSchedule />
                  </ProtectedRoute>
                } />
                <Route path="barber/stats" element={
                  <ProtectedRoute allowedRoles={['barber']}> {/* Apenas barbeiros podem acessar suas estatísticas. */}
                    <BarberStats />
                  </ProtectedRoute>
                } />
                <Route path="barber/settings" element={
                  <ProtectedRoute allowedRoles={['barber']}> {/* Apenas barbeiros podem acessar suas configurações. */}
                    <BarberSettings />
                  </ProtectedRoute>
                } />
                
                {/* Rotas do Gerente */}
                <Route path="manager" element={
                  <ProtectedRoute allowedRoles={['manager']}> {/* Apenas gerentes podem acessar esta dashboard. */}
                    <ManagerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="manager/barbers" element={
                  <ProtectedRoute allowedRoles={['manager']}> {/* Apenas gerentes podem gerenciar barbeiros. */}
                    <ManagerBarbers />
                  </ProtectedRoute>
                } />
                <Route path="manager/stats" element={
                  <ProtectedRoute allowedRoles={['manager']}> {/* Apenas gerentes podem acessar as estatísticas da barbearia. */}
                    <ManagerStats />
                  </ProtectedRoute>
                } />
                <Route path="manager/settings" element={
                  <ProtectedRoute allowedRoles={['manager']}> {/* Apenas gerentes podem acessar as configurações da barbearia. */}
                    <ManagerSettings />
                  </ProtectedRoute>
                } />
                
                {/* Redirecionamento padrão: se nenhuma rota corresponder dentro do layout protegido, redireciona para /client. */}
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


