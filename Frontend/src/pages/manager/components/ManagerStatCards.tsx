
import React from 'react';
import { Users, Calendar, DollarSign, TrendingUp } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  loading?: boolean;
}

const StatCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
      <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
    </div>
  </div>
);

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, loading }) => {
  if (loading) return <StatCardSkeleton />;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className="flex-shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
};

export const ManagerStatCards: React.FC<{ stats: any; loading?: boolean }> = ({ stats, loading }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
    <StatCard
      title="Total de Barbeiros"
      value={stats?.totalBarbeiros || 0}
      icon={<div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg"><Users className="h-6 w-6 text-blue-600 dark:text-blue-400" /></div>}
      loading={loading}
    />
    <StatCard
      title="Agendamentos no Mês"
      value={stats?.agendamentosMes || 0}
      icon={<div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-lg"><Calendar className="h-6 w-6 text-green-600 dark:text-green-400" /></div>}
      loading={loading}
    />
    <StatCard
      title="Concluídos no Mês"
      value={stats?.concluidosMes || 0}
      icon={<div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-lg"><TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" /></div>}
      loading={loading}
    />
    <StatCard
      title="Receita do Mês"
      value={`R$ ${(stats?.receitaTotal || 0).toLocaleString()}`}
      icon={<div className="bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded-lg"><DollarSign className="h-6 w-6 text-yellow-600 dark:text-yellow-400" /></div>}
      loading={loading}
    />
  </div>
);
