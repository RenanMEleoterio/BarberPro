import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Star, Clock, Target } from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { ManagerStatsData } from '../../services/api/adapters';
import toast from 'react-hot-toast';

/**
 * Interface que define a estrutura dos dados de estatísticas retornados pela API.
 */
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

/**
 * Componente para exibir as estatísticas gerais da barbearia para o gerente.
 * Inclui receita total, clientes, agendamentos, avaliação média, top barbeiros,
 * performance mensal, serviços populares, meta mensal e métricas de eficiência e satisfação.
 */
export default function ManagerStats() {
  // Estado para o período selecionado (semana, mês, trimestre, ano).
  const [selectedPeriod, setSelectedPeriod] = useState('ano');
  // Estado para armazenar os dados de estatísticas.
  const [statsData, setStatsData] = useState<ManagerStatsData | null>(null);
  // Estado para controlar o status de carregamento.
  const [loading, setLoading] = useState(true);
  // Estado para armazenar mensagens de erro.
  const [error, setError] = useState<string | null>(null);
  // Hook para acessar as informações do usuário logado (gerente).
  const { user } = useAuth();

  // Efeito que carrega os dados de estatísticas quando o componente é montado ou o período/usuário muda.
  useEffect(() => {
    loadStatsData();
  }, [user, selectedPeriod]);

  /**
   * Carrega os dados de estatísticas da barbearia a partir da API.
   * Lida com estados de carregamento e erro, e mapeia o período selecionado para o formato do backend.
   */
  const loadStatsData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (user?.id) {
        // Mapeia os períodos do frontend para o formato esperado pelo backend.
        const periodoMap: { [key: string]: string } = {
          'semana': 'semana',
          'mes': 'mes',
          'trimestre': 'trimestre',
          'ano': 'ano'
        };
        
        const periodoBackend = periodoMap[selectedPeriod] || 'mes';
        // Chama o serviço de API para obter as estatísticas do gerente.
        const data = await apiService.getManagerStats(Number(user.id), periodoBackend);
        setStatsData(data);
        return;
        /*
          setStatsData({
          totalRevenue: data.ReceitaTotal || 0,
          totalClients: data.TotalClientes || 0,
          totalAppointments: data.TotalAgendamentos || 0,
          averageRating: data.AvaliacaoMedia || 0,
          monthlyGrowth: 0, // Não retornado pelo backend, valor mockado ou a ser implementado.
          barbersCount: 0, // Não retornado pelo backend, valor mockado ou a ser implementado.
          activeBarbers: 0, // Não retornado pelo backend, valor mockado ou a ser implementado.
          topBarbers: (Array.isArray(data.RankingBarbeiros) ? data.RankingBarbeiros : []).map((b: any) => ({
            name: b.Nome || 'Barbeiro',
            revenue: b.Receita || 0,
            clients: b.Clientes || 0,
            rating: b.Avaliacao || 0
          })),
          monthlyData: (Array.isArray(data.PerformanceMensal) ? data.PerformanceMensal : []).map((m: any) => ({
            month: m.Mes || 'Mês',
            revenue: m.Receita || 0,
            appointments: m.Agendamentos || 0
          })),
          serviceStats: (Array.isArray(data.ServicosPopulares) ? data.ServicosPopulares : []).map((s: any) => ({
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
        */
      } else {
        setError("ID da barbearia não encontrado.");
      }
    } catch (err: any) {
      console.error("Erro ao carregar estatísticas:", err);
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Erro ao carregar estatísticas";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Extrai os dados de estatísticas do estado, fornecendo valores padrão se não existirem.
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

  // Exibe um spinner de carregamento enquanto os dados estão sendo buscados.
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
      {/* Exibe mensagem de erro, se houver */}
      {error && (
        <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg mb-4">
          {error}
        </div>
      )}
      
      {/* Cabeçalho da página e seletor de período */}
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

      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Card: Receita Total */}
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

        {/* Card: Total de Clientes */}
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

        {/* Card: Agendamentos */}
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

        {/* Card: Avaliação Média */}
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

      {/* Gráfico de Performance e Top Barbeiros */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seção: Performance Mensal */}
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

        {/* Seção: Top Barbeiros */}
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

      {/* Estatísticas de Serviço e Metas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seção: Serviços Populares */}
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

        {/* Seção: Metas e Eficiência */}
        <div className="space-y-6">
          {/* Meta Mensal */}
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

          {/* Métricas de Eficiência */}
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
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.eficiencia.tempoMedioCorte} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tempo Médio de Barba</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.eficiencia.tempoMedioBarba} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tempo Médio Completo</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.eficiencia.tempoMedioCompleto} min</span>
              </div>
            </div>
          </div>

          {/* Métricas de Satisfação do Cliente */}
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
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.satisfacao.excelente}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${stats.satisfacao.excelente}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Bom</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.satisfacao.bom}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: `${stats.satisfacao.bom}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Regular</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.satisfacao.regular}%</span>
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
      </div>
    </div>
  );
}
