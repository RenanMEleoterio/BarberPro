import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Clock } from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function BarberStats() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadStatsData();
  }, [selectedPeriod]);

  const loadStatsData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (user?.id) {
        const data = await apiService.getBarberStats(user.id, selectedPeriod);
        setStatsData(data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados das estatísticas:', error);
      setStatsData({
        totalClients: 0,
        totalRevenue: 0,
        totalAppointments: 0,
        averageRating: 0,
        monthlyGrowth: 0,
        popularServices: [],
        weeklyData: []
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = statsData || {
    totalClients: 0,
    totalRevenue: 0,
    totalAppointments: 0,
    averageRating: 0,
    monthlyGrowth: 0,
    popularServices: [],
    weeklyData: []
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Estatísticas
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Carregando dados...
            </p>
          </div>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Estatísticas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe seu desempenho e crescimento
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
                Total de Clientes
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalClients === 0 ? "N/A" : stats.totalClients}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          {stats.monthlyGrowth !== 0 && (
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 dark:text-green-400">
                +{stats.monthlyGrowth}% este mês
              </span>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Receita Total
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalRevenue === 0 ? "N/A" : `R$ ${stats.totalRevenue.toFixed(2)}`}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          {stats.totalRevenue !== 0 && (
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 dark:text-green-400">
                +15.2% este mês
              </span>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Agendamentos
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalAppointments === 0 ? "N/A" : stats.totalAppointments}
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          {stats.totalAppointments !== 0 && (
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 dark:text-green-400">
                +8.1% este mês
              </span>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avaliação Média
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.averageRating === 0 ? "N/A" : stats.averageRating}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          {stats.averageRating !== 0 && (
            <div className="mt-4 flex items-center">
              <span className="text-sm text-yellow-500">
                ⭐⭐⭐⭐⭐
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Desempenho Semanal
          </h3>
          {stats.weeklyData.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Sem dados de desempenho disponíveis</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Seus dados de desempenho aparecerão aqui conforme você atender clientes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.weeklyData.map((day: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-8">
                      {day.dia}
                    </span>
                    <div className="flex-1">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${(day.agendamentos / 20) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {day.agendamentos} agendamentos
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      R$ {day.receita}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular Services */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Serviços Mais Populares
          </h3>
          {stats.popularServices.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Sem dados de serviços populares disponíveis</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Seus serviços mais populares aparecerão aqui conforme você atender clientes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.popularServices.map((service: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {service.nome}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {service.contagem} vezes
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      R$ {service.receita}
                    </p>
                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
                      <div
                        className="bg-yellow-500 h-1 rounded-full"
                        style={{ width: `${(service.contagem / 45) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Insights de Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.totalClients === 0 && stats.totalRevenue === 0 && stats.totalAppointments === 0 ? (
            <div className="col-span-3 text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Sem insights de performance disponíveis</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Seus insights aparecerão aqui conforme você registrar atividades</p>
            </div>
          ) : (
            <>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <Clock className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-800 dark:text-green-400">
                  Pontualidade
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.pontualidade === 0 ? "N/A" : `${stats.pontualidade}%`}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {stats.pontualidade === 0 ? "" : "Excelente!"}
                </p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-800 dark:text-blue-400">
                  Taxa de Retorno
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.taxaRetorno === 0 ? "N/A" : `${stats.taxaRetorno}%`}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {stats.taxaRetorno === 0 ? "" : "Muito bom!"}
                </p>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                <DollarSign className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                  Ticket Médio
                </p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.ticketMedio === 0 ? "N/A" : `R$ ${stats.ticketMedio.toFixed(2)}`}
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  {stats.ticketMedio === 0 ? "" : "+5% este mês"}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

