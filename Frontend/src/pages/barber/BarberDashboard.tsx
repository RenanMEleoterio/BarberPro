import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, Users, TrendingUp, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Componente de Dashboard para Barbeiros.
 * Exibe estatísticas e agendamentos do dia para o barbeiro logado.
 */
export default function BarberDashboard() {
  // Estado para armazenar os dados do dashboard.
  const [dashboardData, setDashboardData] = useState<any>(null);
  // Estado para controlar o status de carregamento dos dados.
  const [loading, setLoading] = useState(true);
  // Estado para armazenar mensagens de erro.
  const [error, setError] = useState<string | null>(null);
  // Estados para controlar a exibição de um toast de notificação.
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  // Hook para acessar as informações do usuário logado.
  const { user } = useAuth();

  // Efeito que carrega os dados do dashboard quando o componente é montado.
  useEffect(() => {
    loadDashboardData();
  }, []);

  /**
   * Carrega os dados do dashboard do barbeiro a partir da API.
   * Lida com estados de carregamento, erro e exibe um toast se não houver dados.
   */
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (user?.id) {
        const data = await apiService.getBarberDashboard(user.id);
        setDashboardData(data);
        // Se os dados estiverem vazios, exibe o toast
        if (data && data.totalAgendamentosHoje === 0 && data.ganhosSemana === 0) {
          setToastMessage("Não há dados cadastrados para este barbeiro. Comece a agendar para ver suas estatísticas!");
          setShowToast(true);
          const timer = setTimeout(() => {
            setShowToast(false);
            setToastMessage("");
          }, 5000); // Esconde o toast após 5 segundos
          return () => clearTimeout(timer);
        }
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados do dashboard:", err);
      
      // Tratamento de erros específicos da API ou de conexão.
      if (err.response) {
        setError(`Erro do servidor: ${err.response.status} - ${err.response.data.message || 'Ocorreu um erro.'}`);
      } else if (err.request) {
        setError("Erro de conexão: Não foi possível conectar ao servidor. Verifique sua internet ou tente novamente mais tarde.");
      } else {
        setError("Ocorreu um erro inesperado ao carregar os dados.");
      }
      // Define dados vazios para que o dashboard seja renderizado sem dados em caso de erro.
      setDashboardData({
        totalAgendamentosHoje: 0,
        agendamentosConcluidos: 0,
        ganhosSemana: 0,
        porcentagem: 0,
        agendamentosHoje: [],
        performanceSemanal: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Extrai e padroniza os dados para exibição, garantindo valores padrão se os dados não existirem.
  const todayAppointments = dashboardData?.agendamentosHoje || [];
  const weeklyData = dashboardData?.performanceSemanal || [];
  
  const stats = {
    todayAppointments: dashboardData?.totalAgendamentosHoje || 0,
    completedToday: dashboardData?.agendamentosConcluidos || 0,
    weeklyEarnings: dashboardData?.ganhosSemana || 0,
    weeklyPercentage: dashboardData?.porcentagem || 0
  };

  /**
   * Renderiza um card de estatística reutilizável.
   * @param {string} title - Título do card.
   * @param {string | number} value - Valor exibido no card.
   * @param {React.ReactNode} icon - Ícone a ser exibido no card.
   * @param {string} bgColor - Cor de fundo do ícone.
   * @param {string} textColor - Cor do texto do ícone.
   * @returns {JSX.Element} - O elemento JSX do card de estatística.
   */
  const renderStatCard = (title: string, value: string | number, icon: React.ReactNode, bgColor: string, textColor: string) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`${bgColor} p-3 rounded-lg`}>
          {React.cloneElement(icon as React.ReactElement, { className: `h-6 w-6 ${textColor}` })}
        </div>
      </div>
    </div>
  );

  // Exibe um spinner de carregamento enquanto os dados estão sendo buscados.
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Dashboard do Barbeiro</h1>
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
      {/* Toast de notificação */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-down">
          {toastMessage}
        </div>
      )}
      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-40 mb-4">
          {error}
        </div>
      )}
      {/* Cabeçalho do Dashboard */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Dashboard do Barbeiro</h1>
        <p className="text-yellow-100">Gerencie seus agendamentos e acompanhe seu desempenho</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderStatCard(
          "Agendamentos Hoje",
          stats.todayAppointments === 0 ? "N/A" : stats.todayAppointments,
          <Calendar />,
          "bg-blue-100 dark:bg-blue-900/20",
          "text-blue-600 dark:text-blue-400"
        )}
        {renderStatCard(
          "Concluídos Hoje",
          stats.completedToday === 0 ? "N/A" : stats.completedToday,
          <CheckCircle />,
          "bg-green-100 dark:bg-green-900/20",
          "text-green-600 dark:text-green-400"
        )}
        {renderStatCard(
          "Ganhos da Semana",
          stats.weeklyEarnings === 0 ? "N/A" : `R$ ${stats.weeklyEarnings}`,
          <DollarSign />,
          "bg-yellow-100 dark:bg-yellow-900/20",
          "text-yellow-600 dark:text-yellow-400"
        )}
        {renderStatCard(
          "Sua Porcentagem",
          stats.weeklyPercentage === 0 ? "N/A" : `${stats.weeklyPercentage}%`,
          <TrendingUp />,
          "bg-purple-100 dark:bg-purple-900/20",
          "text-purple-600 dark:text-purple-400"
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agendamentos de Hoje */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Agendamentos de Hoje</h2>
          </div>
          <div className="p-6">
            {todayAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Nenhum agendamento para hoje</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Quando você tiver agendamentos, eles aparecerão aqui</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Array.isArray(todayAppointments) ? todayAppointments.map((appointment: any) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded-lg">
                        <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{appointment.nomeCliente}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(appointment.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'Confirmado' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                          : appointment.status === 'Realizado'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {appointment.status}
                      </span>
                      {appointment.status === 'Confirmado' && (
                        <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors">
                          Marcar como Feito
                        </button>
                      )}
                    </div>
                  </div>
                )) : []}
              </div>
            )}
          </div>
        </div>

        {/* Gráfico de Performance Semanal */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Performance da Semana</h2>
          </div>
          <div className="p-6">
            {weeklyData.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Sem dados de performance disponíveis</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Seus dados de performance aparecerão aqui conforme você atender clientes</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'cortes' ? `${value} cortes` : `R$ ${value}`,
                      name === 'cortes' ? 'Cortes' : 'Ganhos'
                    ]}
                  />
                  <Bar dataKey="cortes" fill="#eab308" name="cortes" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


