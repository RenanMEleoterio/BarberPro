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
  const [selectedPeriod, setSelectedPeriod] = useState('mes');
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadStatsData();
  }, [user, selectedPeriod]);

  const loadStatsData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (user?.barbeariaId) {
        // Mapear os períodos do frontend para o formato do backend
        const periodoMap: { [key: string]: string } = {
          'semana': 'semana',
          'mes': 'mes',
          'trimestre': 'trimestre',
          'ano': 'ano'
        };
        
        const periodoBackend = periodoMap[selectedPeriod] || 'mes';
        const data = await apiService.getManagerStats(user.barbeariaId, periodoBackend);
        setStatsData({
          totalRevenue: data.ReceitaTotal || 0,
          totalClients: data.TotalClientes || 0,
          totalAppointments: data.TotalAgendamentos || 0,
          averageRating: data.AvaliacaoMedia || 0,
          monthlyGrowth: 0, // Não retornado pelo backend
          barbersCount: 0, // Não retornado pelo backend
          activeBarbers: 0, // Não retornado pelo backend
          topBarbers: (data.RankingBarbeiros || []).map((b: any) => ({
            name: b.Nome || 'Barbeiro',
            revenue: b.Receita || 0,
            clients: b.Clientes || 0,
            rating: b.Avaliacao || 0
          })),
          monthlyData: (data.PerformanceMensal || []).map((m: any) => ({
            month: m.Mes || 'Mês',
            revenue: m.Receita || 0,
            appointments: m.Agendamentos || 0
          })),
          serviceStats: (data.ServicosPopulares || []).map((s: any) => ({
            service: s.Servico || 'Serviço',
            count: s.Quantidade || 0,
            revenue: s.Receita || 0,
            percentage: s.Porcentagem || 0
          })),
          metaMensal: {
            receita: data.MetaMensal?.Meta || 20000,
            progresso: data.MetaMensal?.Progresso || 0
          },
          eficiencia: {
            tempoMedioCorte: data.Eficiencia?.TempoMedioCorte || 25,
            tempoMedioBarba: data.Eficiencia?.TempoMedioBarba || 15,
            tempoMedioCompleto: data.Eficiencia?.TempoMedioCompleto || 40
          },
          satisfacao: {
            excelente: data.Satisfacao?.Excelente || 78,
            bom: data.Satisfacao?.Bom || 18,
            regular: data.Satisfacao?.Regular || 4
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
            Acompanhe o desempenho da sua barbearia
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mês</option>
            <option value="trimestre">Este Trimestre</option>
            <option value="ano">Este Ano</option>
          </select>
        </div>
      </div>

      {/* Main Stats Cards */}
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
            <DollarSign className="h-4 w-4 sm:h-8 sm:w-8 text-green-600 dark:text-green-400 flex-shrink-0" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                Total de Clientes
              </p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalClients}
              </p>
            </div>
            <Users className="h-4 w-4 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                Agendamentos
              </p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalAppointments}
              </p>
            </div>
            <Calendar className="h-4 w-4 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400 flex-shrink-0" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                Avaliação Média
              </p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {stats.averageRating.toFixed(1)}
              </p>
            </div>
            <Star className="h-4 w-4 sm:h-8 sm:w-8 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Performance Chart and Top Barbers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
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
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {data.month}
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      R$ {data.revenue.toLocaleString()}
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

        {/* Top Barbers */}
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
                <div key={index} className="flex items-center justify-between">
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
                      R$ {barber.revenue.toLocaleString()}
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
      </div>

      {/* Service Stats and Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Stats */}
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
                <div key={index} className="space-y-2">
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
                    <span>R$ {service.revenue.toLocaleString()}</span>
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

        {/* Goals and Efficiency */}
        <div className="space-y-6">
          {/* Monthly Goal */}
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
                  R$ {stats.totalRevenue.toLocaleString()}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  R$ {stats.metaMensal.receita.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Efficiency Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Eficiência
              </h3>
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Tempo Médio - Corte
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {stats.eficiencia.tempoMedioCorte} min
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Tempo Médio - Barba
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {stats.eficiencia.tempoMedioBarba} min
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Tempo Médio - Completo
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {stats.eficiencia.tempoMedioCompleto} min
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


