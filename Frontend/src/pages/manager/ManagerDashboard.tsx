import React, { useState, useEffect } from 'react';
import { Users, Calendar, DollarSign, TrendingUp, Copy, Plus, Settings } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import toast from 'react-hot-toast';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Componente do Dashboard do Gerente.
 * Exibe um panorama geral da barbearia, incluindo estatísticas, formas de pagamento,
 * performance semanal e uma lista de barbeiros cadastrados.
 */
export default function ManagerDashboard() {
  // Estado para armazenar os dados do dashboard.
  const [dashboardData, setDashboardData] = useState<any>(null);
  // Estado para controlar o status de carregamento dos dados.
  const [loading, setLoading] = useState(true);
  // Estado para armazenar mensagens de erro.
  const [error, setError] = useState<string | null>(null);
  // Hook para acessar as informações do usuário logado (gerente).
  const { user } = useAuth();

  // Efeito que carrega os dados do dashboard quando o componente é montado ou o usuário muda.
  useEffect(() => {
    console.log("User no ManagerDashboard:", user);
    loadDashboardData();
  }, [user]);

  /**
   * Carrega os dados do dashboard do gerente a partir da API.
   * Lida com estados de carregamento e erro, e verifica se o ID da barbearia está disponível.
   */
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (user?.barbeariaId) {
        console.log("Carregando dashboard para barbeariaId:", user.barbeariaId);
        // Chama o serviço de API para obter os dados do dashboard do gerente.
        const data = await apiService.getManagerDashboard(user.barbeariaId);
        console.log("Dados do dashboard recebidos:", data);
        setDashboardData(data);
      } else {
        console.log("User ou barbeariaId não disponível.", user);
        setError("ID da barbearia não encontrado para carregar o dashboard.");
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados do dashboard:", err);
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Erro ao carregar dados do dashboard";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Extrai o código da barbearia do dashboardData ou define como vazio.
  const barbershopCode = dashboardData?.barbearia?.codigoBarbearia || '';
  // Mapeia os dados de estatísticas para um formato mais fácil de usar.
  const stats = {
    totalBarbers: dashboardData?.totalBarbeiros || 0,
    totalAppointments: dashboardData?.agendamentosMes || 0,
    completedAppointments: dashboardData?.concluidosMes || 0,
    totalRevenue: dashboardData?.receitaTotal || 0
  };
  // Prepara os dados das formas de pagamento para o gráfico de pizza, filtrando valores zero.
  const paymentData = dashboardData?.formasPagamento ? [
    { name: 'PIX', value: dashboardData.formasPagamento.pix, color: '#8b5cf6' },
    { name: 'Cartão', value: dashboardData.formasPagamento.cartao, color: '#06b6d4' },
    { name: 'Dinheiro', value: dashboardData.formasPagamento.dinheiro, color: '#eab308' }
  ].filter(item => item.value > 0) : [];
  // Prepara os dados de performance semanal para o gráfico de barras.
  const weeklyData = dashboardData?.performanceSemanal ? 
    ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => ({
      day,
      appointments: dashboardData.performanceSemanal[index] || 0
    })) : [];
  // Prepara os dados dos barbeiros para a tabela.
  const barbers = dashboardData?.barbeiros ? dashboardData.barbeiros.map((barbeiro: any) => ({
    id: barbeiro.id,
    name: barbeiro.nome,
    percentage: barbeiro.porcentagem,
    weeklyEarnings: barbeiro.ganhosSemana,
    appointments: barbeiro.agendamentos
  })) : [];

  /**
   * Copia o código da barbearia para a área de transferência.
   * Exibe uma notificação de sucesso.
   */
  const copyBarbershopCode = () => {
    navigator.clipboard.writeText(barbershopCode);
    toast.success('Código copiado para a área de transferência!');
  };

  /**
   * Gera um link de registro para um barbeiro específico, incluindo o código da barbearia.
   * Copia o link para a área de transferência e exibe uma notificação de sucesso.
   * @param {any} barber - O objeto barbeiro para o qual o link será gerado.
   */
  const generateBarberLink = (barber: any) => {
    const link = `${window.location.origin}/barber/register?code=${barbershopCode}&barber=${barber.id}`;
    navigator.clipboard.writeText(link);
    toast.success(`Link gerado para ${barber.name}!`);
  };

  // Exibe um spinner de carregamento enquanto os dados estão sendo buscados.
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Dashboard da Barbearia</h1>
          <p className="text-yellow-100">Carregando dados...</p>
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
      
      {/* Cabeçalho do Dashboard */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl sm:rounded-2xl p-4 sm:p-8 text-white">
        <h1 className="text-xl sm:text-3xl font-bold mb-2">Dashboard da Barbearia</h1>
        <p className="text-sm sm:text-base text-yellow-100">Gerencie sua barbearia e acompanhe o desempenho</p>
      </div>

      {/* Seção do Código da Barbearia */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Código da Barbearia</h2>
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg">
            <p className="text-lg sm:text-2xl font-mono font-bold text-gray-900 dark:text-white break-all">{barbershopCode || 'Carregando...'}</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Compartilhe este código com os barbeiros para que possam se cadastrar</p>
          </div>
          <button
            onClick={copyBarbershopCode}
            disabled={!barbershopCode}
            className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white p-3 rounded-lg transition-colors self-start sm:self-auto"
          >
            <Copy className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Cards de Estatísticas Chave */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Card: Total de Barbeiros */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Total de Barbeiros</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBarbers}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/20 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <Users className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Card: Agendamentos */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Agendamentos</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalAppointments}</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/20 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Card: Concluídos */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Concluídos</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.completedAppointments}</p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/20 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* Card: Receita Total */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Receita Total</p>
              <p className="text-sm sm:text-2xl font-bold text-gray-900 dark:text-white">R$ {stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/20 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Formas de Pagamento */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Formas de Pagamento</h2>
          </div>
          <div className="p-6">
            {paymentData.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Sem dados de pagamento disponíveis</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Os dados aparecerão aqui conforme os agendamentos forem realizados</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`} // Exibe o nome e o valor percentual no gráfico.
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Gráfico de Performance Semanal */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Performance Semanal</h2>
          </div>
          <div className="p-6">
            {weeklyData.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Sem dados de performance disponíveis</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Os dados aparecerão aqui conforme os agendamentos forem realizados</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'appointments' ? `${value} agendamentos` : `R$ ${value}`,
                      name === 'appointments' ? 'Agendamentos' : 'Receita'
                    ]} // Formata o tooltip para exibir informações relevantes.
                  />
                  <Bar dataKey="appointments" fill="#eab308" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Seção de Gerenciamento de Barbeiros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Barbeiros Cadastrados</h2>
          <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Adicionar Barbeiro</span>
          </button>
        </div>
        <div className="p-6">
          {barbers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Nenhum barbeiro cadastrado</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Compartilhe o código da barbearia para que os barbeiros possam se cadastrar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Nome</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Porcentagem</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Ganhos Semanais</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Agendamentos</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {barbers.map((barber) => (
                    <tr key={barber.id} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-3 px-4 text-gray-900 dark:text-white">{barber.name}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{barber.percentage}%</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">R$ {barber.weeklyEarnings}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{barber.appointments}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => generateBarberLink(barber)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Gerar Link
                          </button>
                          <button className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors">
                            <Settings className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


