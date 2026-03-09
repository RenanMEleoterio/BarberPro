import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Clock } from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Componente de Estatísticas para Barbeiros.
 * Exibe métricas de desempenho, gráficos e insights para o barbeiro logado.
 */
export default function BarberStats() {
  // Estado para o período selecionado (semana, mês, trimestre, ano).
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  // Estado para armazenar os dados das estatísticas.
  const [statsData, setStatsData] = useState<any>(null);
  // Estado para controlar o status de carregamento dos dados.
  const [loading, setLoading] = useState(true);
  // Estado para armazenar mensagens de erro.
  const [error, setError] = useState<string | null>(null);
  // Hook para acessar as informações do usuário logado.
  const { user } = useAuth();

  // Efeito que carrega os dados das estatísticas quando o componente é montado ou o período selecionado muda.
  useEffect(() => {
    loadStatsData();
  }, [selectedPeriod]);

  /**
   * Carrega os dados das estatísticas do barbeiro a partir da API.
   * Lida com estados de carregamento e erro, e define dados padrão em caso de falha.
   */
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
      // Define dados vazios para que o componente possa renderizar sem falhar.
      setStatsData({
        totalClients: 0,
        totalRevenue: 0,
        totalAppointments: 0,
        monthlyGrowth: 0,
        popularServices: [],
        weeklyData: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Mapeia os dados brutos da API para um formato mais amigável para o componente.
  const stats = statsData ? {
    totalClients: statsData.totalClientes || 0,
    totalRevenue: statsData.receitaTotal || 0,
    totalAppointments: statsData.totalAgendamentos || 0,
    monthlyGrowth: 0, // Este campo não parece ser preenchido pela API no momento.
    popularServices: statsData.servicosPopulares || [],
    weeklyData: statsData.performanceSemanal?.map((day: any) => ({
      dia: day.dia,
      agendamentos: day.agendamentos || 0,
      receita: day.receita || 0
    })) || []
  } : {
    // Valores padrão caso não haja dados.
    totalClients: 0,
    totalRevenue: 0,
    totalAppointments: 0,
    monthlyGrowth: 0,
    popularServices: [],
    weeklyData: []
  };

  // Exibe um spinner de carregamento enquanto os dados estão sendo buscados.
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
      {/* Cabeçalho da página e seletor de período */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Estatísticas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe seu desempenho e crescimento
          </p>
        </div>
        
        {/* Dropdown para selecionar o período de visualização das estatísticas */}
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

      {/* Seção de Métricas Chave */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card: Total de Clientes */}
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

        {/* Card: Receita Total */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Receita Total
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalRevenue === 0 ? "N/A" : `R$ ${(stats.totalRevenue || 0).toFixed(2)}`}
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

        {/* Card: Agendamentos */}
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
      </div>

      {/* Seção de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Desempenho por Dia */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {selectedPeriod === 'week' ? 'Desempenho Semanal' : 'Desempenho por Dia'}
          </h3>
          {stats.weeklyData.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Sem dados de desempenho disponíveis</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Seus dados de desempenho aparecerão aqui conforme você atender clientes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                const maxAppointments = Math.max(...stats.weeklyData.map((d: any) => d.agendamentos), 1);
                return Array.isArray(stats.weeklyData) && stats.weeklyData.map((day: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 mr-4">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-8">
                        {day.dia}
                      </span>
                      <div className="flex-1">
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(day.agendamentos / maxAppointments) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {day.agendamentos} agendamentos
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        R$ {day.receita || 0}
                      </p>
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>

        {/* Serviços Mais Populares */}
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
              {Array.isArray(stats.popularServices) ? stats.popularServices.map((service: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {service.servico}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {service.quantidade} vezes
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      R$ {service.receita || 0}
                    </p>
                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
                      <div
                        className="bg-yellow-500 h-1 rounded-full"
                        style={{ width: `${(service.quantidade / 45) * 100}%` }} // Exemplo de cálculo de largura para barra de progresso
                      ></div>
                    </div>
                  </div>
                </div>
              )) : []}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


