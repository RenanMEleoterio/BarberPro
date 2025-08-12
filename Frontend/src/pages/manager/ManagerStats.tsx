import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Star, Clock, Target } from 'lucide-react';

export default function ManagerStats() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Mock data - substituir por dados reais da API
  const stats = {
    totalRevenue: 16050.00,
    totalClients: 575,
    totalAppointments: 342,
    averageRating: 4.7,
    monthlyGrowth: 18.5,
    barbersCount: 4,
    activeBarbers: 3,
    topBarbers: [
      { name: 'Carlos Oliveira', revenue: 5100, clients: 189, rating: 4.9 },
      { name: 'João Silva', revenue: 4250, clients: 156, rating: 4.8 },
      { name: 'Pedro Santos', revenue: 3800, clients: 132, rating: 4.6 },
      { name: 'Rafael Costa', revenue: 2900, clients: 98, rating: 4.7 }
    ],
    monthlyData: [
      { month: 'Jan', revenue: 12500, appointments: 280 },
      { month: 'Fev', revenue: 13200, appointments: 295 },
      { month: 'Mar', revenue: 14100, appointments: 315 },
      { month: 'Abr', revenue: 15300, appointments: 330 },
      { month: 'Mai', revenue: 16050, appointments: 342 }
    ],
    serviceStats: [
      { service: 'Corte + Barba', count: 145, revenue: 6525, percentage: 42 },
      { service: 'Corte Simples', count: 98, revenue: 2450, percentage: 29 },
      { service: 'Barba', count: 76, revenue: 1520, percentage: 22 },
      { service: 'Sobrancelha', count: 23, revenue: 345, percentage: 7 }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Estatísticas Gerais
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visão geral do desempenho da barbearia
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
            <option value="quarter">Este Trimestre</option>
            <option value="year">Este Ano</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Receita Total
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                R$ {stats.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400">
              +{stats.monthlyGrowth}% este mês
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total de Clientes
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalClients}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400">
              +12.3% este mês
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Agendamentos
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalAppointments}
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400">
              +8.7% este mês
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avaliação Média
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.averageRating}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Star className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-yellow-500">
              ⭐⭐⭐⭐⭐
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Performance Mensal
          </h3>
          <div className="space-y-4">
            {stats.monthlyData.map((month, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-8">
                    {month.month}
                  </span>
                  <div className="flex-1">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${(month.revenue / 20000) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    R$ {month.revenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {month.appointments} agendamentos
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Serviços Mais Populares
          </h3>
          <div className="space-y-4">
            {stats.serviceStats.map((service, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {service.service}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {service.count} vezes - {service.percentage}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    R$ {service.revenue.toLocaleString()}
                  </p>
                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
                    <div
                      className="bg-yellow-500 h-1 rounded-full"
                      style={{ width: `${service.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Barbers */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Ranking de Barbeiros
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.topBarbers.map((barber, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-10 w-10 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {barber.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {barber.name}
                  </p>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {barber.rating}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Receita:</span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    R$ {barber.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Clientes:</span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    {barber.clients}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Meta Mensal
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Progresso atual
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Receita:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                R$ 16.050 / R$ 20.000
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">
              80% da meta atingida
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Eficiência
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tempo médio por serviço
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Corte:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">25 min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Barba:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">15 min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Completo:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">40 min</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Satisfação
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Feedback dos clientes
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Excelente:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">78%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Bom:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">18%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Regular:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">4%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

