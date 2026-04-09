import type { ReactNode } from 'react';
import {
  BarChart3,
  Calendar,
  Clock,
  DollarSign,
  Star,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { ManagerStatsData } from '../../../services/api/adapters';

interface ManagerStatsSectionProps {
  stats: ManagerStatsData;
}

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString()}`;
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
            {title}
          </p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
        {icon}
      </div>
    </div>
  );
}

export function ManagerStatsSummaryCards({ stats }: ManagerStatsSectionProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      <SummaryCard
        title="Receita Total"
        value={formatCurrency(stats.totalRevenue)}
        icon={<DollarSign className="h-4 w-4 sm:h-8 sm:w-8 text-green-600 dark:text-green-400 flex-shrink-0" />}
      />
      <SummaryCard
        title="Total de Clientes"
        value={stats.totalClients.toString()}
        icon={<Users className="h-4 w-4 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />}
      />
      <SummaryCard
        title="Agendamentos"
        value={stats.totalAppointments.toString()}
        icon={<Calendar className="h-4 w-4 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400 flex-shrink-0" />}
      />
      <SummaryCard
        title="Avaliação Média"
        value={stats.averageRating.toFixed(1)}
        icon={<Star className="h-4 w-4 sm:h-8 sm:w-8 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />}
      />
    </div>
  );
}

export function ManagerStatsDetailsPanels({ stats }: ManagerStatsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Performance Mensal
          </h2>
          <BarChart3 className="h-5 w-5 text-gray-400" />
        </div>

        <div className="space-y-4">
          {stats.monthlyData.length > 0 ? (
            stats.monthlyData.map((data, index) => (
              <div key={`${data.month}-${index}`} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {data.month}
                </span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(data.revenue)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {data.appointments} agendamentos
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Nenhum dado de performance disponível
            </p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Top Barbeiros
          </h2>
          <TrendingUp className="h-5 w-5 text-gray-400" />
        </div>

        <div className="space-y-4">
          {stats.topBarbers.length > 0 ? (
            stats.topBarbers.map((barber, index) => (
              <div key={`${barber.name}-${index}`} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {barber.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {barber.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {barber.clients} clientes
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(barber.revenue)}
                  </p>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {barber.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Nenhum barbeiro encontrado
            </p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Serviços Populares
          </h2>
          <Target className="h-5 w-5 text-gray-400" />
        </div>

        <div className="space-y-4">
          {stats.serviceStats.length > 0 ? (
            stats.serviceStats.map((service, index) => (
              <div key={`${service.service}-${index}`} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {service.service}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {service.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${service.percentage}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{service.count} serviços</span>
                  <span>{formatCurrency(service.revenue)}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Nenhum serviço registrado
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function ManagerStatsInsightPanels({ stats }: ManagerStatsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Meta Mensal
          </h3>
          <Target className="h-5 w-5 text-gray-400" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Progresso
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {stats.metaMensal.progresso.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full"
              style={{ width: `${Math.min(stats.metaMensal.progresso, 100)}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {formatCurrency(stats.totalRevenue)}
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {formatCurrency(stats.metaMensal.receita)}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Métricas de Eficiência
          </h3>
          <Clock className="h-5 w-5 text-gray-400" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Tempo Médio de Corte</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {stats.eficiencia.tempoMedioCorte} min
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Tempo Médio de Barba</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {stats.eficiencia.tempoMedioBarba} min
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Tempo Médio Completo</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {stats.eficiencia.tempoMedioCompleto} min
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Satisfação do Cliente
          </h3>
          <Star className="h-5 w-5 text-gray-400" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Excelente</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {stats.satisfacao.excelente}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${stats.satisfacao.excelente}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Bom</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {stats.satisfacao.bom}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-yellow-500 h-2 rounded-full"
              style={{ width: `${stats.satisfacao.bom}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Regular</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {stats.satisfacao.regular}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full"
              style={{ width: `${stats.satisfacao.regular}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
