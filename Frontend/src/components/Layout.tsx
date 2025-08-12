import React from 'react';
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
  Store
} from 'lucide-react';

export default function Layout() {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/auth');
  };

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
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Scissors className="h-8 w-8 text-yellow-500" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                BarberPro
              </span>
            </div>
          </div>

          {/* Navigation */}
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

          {/* User info and actions */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
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
              <button
                onClick={toggleTheme}
                className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
              </button>
              
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

      {/* Main content */}
      <div className="pl-64">
        <main className="py-8 px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}