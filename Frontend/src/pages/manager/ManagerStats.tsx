import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Star, Clock, Target } from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface StatsData {
  totalRevenue: number;
  totalClients: number;
  totalAppointments: number;
  averageRating: number;
  monthlyGrowth: number;
  barbersCount: number;
  activeBarbers: number;
  topBarbers: Array<{
    name: string;
    revenue: number;
    clients: number;
    rating: number;
  }>;
  monthlyData: Array<{
    month: string;
    revenue: number;
    appointments: number;
  }>;
  serviceStats: Array<{
    service: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  metaMensal: {
    receita: number;
    progresso: number;
  };
  eficiencia: {
    tempoMedioCorte: number;
    tempoMedioBarba: number;
    tempoMedioCompleto: number;
  };
  satisfacao: {
    excelente: number;
    bom: number;
    regular: number;
  };
}

export default function ManagerStats() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadStatsData();
  }, [user]);

  const loadStatsData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (user?.barbeariaId) {
        const data = await apiService.getManagerStats(user.barbeariaId);
        setStatsData({
          totalRevenue: data.TotalRevenue,
          totalClients: data.TotalClients,
          totalAppointments: data.TotalAppointments,
          averageRating: data.AverageRating,
          monthlyGrowth: data.MonthlyGrowth,
          barbersCount: data.BarbersCount,
          activeBarbers: data.ActiveBarbers,
          topBarbers: data.TopBarbers.map((b: any) => ({
            name: b.Name,
            revenue: b.Revenue,
            clients: b.Clients,
            rating: b.Rating
          })),
          monthlyData: data.MonthlyData.map((m: any) => ({
            month: m.Month,
            revenue: m.Revenue,
            appointments: m.Appointments
          })),
          serviceStats: data.ServiceStats.map((s: any) => ({
            service: s.Service,
            count: s.Count,
            revenue: s.Revenue,
            percentage: s.Percentage
          })),
          metaMensal: {
            receita: data.MetaMensal.Receita,
            progresso: data.MetaMensal.Progresso
          },
          eficiencia: {
            tempoMedioCorte: data.Eficiencia.TempoMedioCorte,
            tempoMedioBarba: data.Eficiencia.TempoMedioBarba,
            tempoMedioCompleto: data.Eficiencia.TempoMedioCompleto
          },
          satisfacao: {
            excelente: data.Satisfacao.Excelente,
            bom: data.Satisfacao.Bom,
            regular: data.Satisfacao.Regular
          }
        });
      } else {
        setError("ID da barbearia não encontrado.");
      }
    } catch (err: any) {
      console.error("Erro ao carregar estatísticas:", err);
      setError("Erro ao carregar estatísticas");
      toast.error("Erro ao carregar estatísticas");
    } finally {
      setLoading(false);
    }
  };

  const stats = statsData || {
    totalRevenue: 0,
    totalClients: 0,
    totalAppointments: 0,
    averageRating: 0,
    monthlyGrowth: 0,
    barbersCount: 0,
    activeBarbers: 0,
    topBarbers: [],
    monthlyData: [],
    serviceStats: [],
    metaMensal: { receita: 20000, progresso: 0 },
    eficiencia: { tempoMedioCorte: 25, tempoMedioBarba: 15, tempoMedioCompleto: 40 },
    satisfacao: { excelente: 78, bom: 18, regular: 4 }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Estatísticas Gerais
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
      {error && (
        <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg mb-4">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Estatísticas Gerais
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Visão geral do desempenho da barbearia
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
            <option value="quarter">Este Trimestre</option>
            <option value="year">Este Ano</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                Receita Total
              </p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                R$ {stats.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="h-8 w-8 sm:h-12 sm:w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-2 sm:mt-4 flex items-center">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1" />
            <span className="text-xs sm:text-sm text-green-600 dark:text-green-400">
              +{stats.monthlyGrowth}% este mês
            </span>
          </div>
        </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Receita Total
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                R$ {stats.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="h-8 w-8 sm:h-12 sm:w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-2 sm:mt-4 flex items-center">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1" />
            <span className="text-xs sm:text-sm text-green-600 dark:text-green-400">
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
                {stats.averageRating.toFixed(1)}
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
            {stats.monthlyData.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Nenhum dado de performance disponível ainda.
              </p>
            ) : (
              stats.monthlyData.map((month, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-8">
                      {month.month}
                    </span>
                    <div className="flex-1">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${Math.min((month.revenue / 20000) * 100, 100)}%` }}
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
              ))
            )}
          </div>
        </div>

        {/* Service Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Serviços Mais Populares
          </h3>
          <div className="space-y-4">
            {stats.serviceStats.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Nenhum serviço registrado ainda.
              </p>
            ) : (
              stats.serviceStats.map((service, index) => (
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
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Barbers */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Ranking de Barbeiros
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.topBarbers.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                Nenhum barbeiro cadastrado ainda.
              </p>
            </div>
          ) : (
            stats.topBarbers.map((barber, index) => (
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
            ))
          )}
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
                R$ {stats.totalRevenue.toLocaleString()} / R$ {stats.metaMensal.receita.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${Math.min(stats.metaMensal.progresso, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">
              {stats.metaMensal.progresso}% da meta atingida
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
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {stats.eficiencia.tempoMedioCorte} min
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Barba:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {stats.eficiencia.tempoMedioBarba} min
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Completo:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {stats.eficiencia.tempoMedioCompleto} min
              </span>
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
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {stats.satisfacao.excelente}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Bom:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {stats.satisfacao.bom}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Regular:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {stats.satisfacao.regular}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

