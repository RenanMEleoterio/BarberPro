import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Scissors, 
  Calendar, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Sun, 
  Moon,
  Home,
  Store,
  Menu,
  X
} from 'lucide-react';

/**
 * Componente de layout principal da aplicação. 
 * Ele renderiza a barra de navegação (sidebar) e o conteúdo da página, 
 * adaptando-se a diferentes tipos de usuário (cliente, barbeiro, gerente) e tamanhos de tela.
 */
export default function Layout() {
  // Hooks para acessar o contexto de autenticação e tema.
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  // Hooks do React Router para obter a localização atual e navegar.
  const location = useLocation();
  const navigate = useNavigate();
  // Estado para controlar a abertura/fechamento do menu mobile.
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /**
   * Lida com a ação de sair da aplicação.
   * Chama a função signOut do contexto de autenticação e redireciona para a página de autenticação.
   */
  const handleSignOut = () => {
    signOut();
    navigate('/auth');
  };

  /**
   * Alterna o estado de abertura do menu mobile.
   */
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  /**
   * Fecha o menu mobile.
   */
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  /**
   * Retorna os itens de navegação (links da sidebar) com base no tipo de usuário logado.
   * Cada tipo de usuário tem um conjunto diferente de funcionalidades e, portanto, de links.
   * @returns {Array<Object>} Uma lista de objetos, cada um contendo o caminho, ícone e rótulo do item de navegação.
   */
  const getNavItems = () => {
    if (!user) return [];

    switch (user.role) {
      case 'client':
        return [
          { path: '/client', icon: Home, label: 'Início' },
          { path: '/client/barbershops', icon: Store, label: 'Barbearias' },
          { path: '/client/appointments', icon: Calendar, label: 'Agendamentos' },
        ];
      case 'barber':
        return [
          { path: '/barber', icon: Home, label: 'Dashboard' },
          { path: '/barber/schedule', icon: Calendar, label: 'Agenda' },
          { path: '/barber/stats', icon: BarChart3, label: 'Estatísticas' },
          { path: '/barber/settings', icon: Settings, label: 'Configurações' },
        ];
      case 'manager':
        return [
          { path: '/manager', icon: Home, label: 'Dashboard' },
          { path: '/manager/barbers', icon: Users, label: 'Barbeiros' },
          { path: '/manager/stats', icon: BarChart3, label: 'Estatísticas' },
          { path: '/manager/settings', icon: Settings, label: 'Configurações' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Cabeçalho Mobile: Visível apenas em telas pequenas */}
      <div className="lg:hidden bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            {/* Botão para abrir/fechar o menu mobile */}
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            {/* Logo e nome da aplicação no cabeçalho mobile */}
            <div className="flex items-center space-x-2">
              <Scissors className="h-6 w-6 text-yellow-500" />
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                BarberPro
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay do Menu Mobile: Aparece quando o menu mobile está aberto */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={closeMobileMenu}>
          <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex h-full flex-col">
              {/* Cabeçalho do Menu Mobile */}
              <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Scissors className="h-8 w-8 text-yellow-500" />
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    BarberPro
                  </span>
                </div>
                {/* Botão para fechar o menu mobile */}
                <button
                  onClick={closeMobileMenu}
                  className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navegação Mobile: Links específicos para o tipo de usuário */}
              <nav className="flex-1 space-y-1 px-4 py-6">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={closeMobileMenu}
                      className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Informações do usuário e ações no menu mobile */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {/* Avatar do usuário */}
                    <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {/* Nome e função do usuário */}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {user?.role}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  {/* Botão para alternar o tema (claro/escuro) */}
                  <button
                    onClick={toggleTheme}
                    className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  >
                    {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
                  </button>
                  
                  {/* Botão de sair */}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Desktop: Visível apenas em telas grandes */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:bg-white lg:dark:bg-gray-800 lg:shadow-lg">
        <div className="flex h-full flex-col">
          {/* Logo da aplicação na sidebar */}
          <div className="flex h-16 items-center justify-center border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Scissors className="h-8 w-8 text-yellow-500" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                BarberPro
              </span>
            </div>
          </div>

          {/* Navegação Desktop: Links específicos para o tipo de usuário */}
          <nav className="flex-1 space-y-1 px-4 py-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Informações do usuário e ações na sidebar desktop */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {/* Avatar do usuário */}
                <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                {/* Nome e função do usuário */}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              {/* Botão para alternar o tema (claro/escuro) */}
              <button
                onClick={toggleTheme}
                className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
              </button>
              
              {/* Botão de sair */}
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal da página */}
      <div className="lg:pl-64">
        <main className="py-4 px-4 lg:py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


