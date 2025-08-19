import React, { useState, useEffect } from 'react';
import { Users, Calendar, DollarSign, TrendingUp, Copy, Plus, Settings } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import toast from 'react-hot-toast';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function ManagerDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (user?.barbeariaId) {
        const data = await apiService.getManagerDashboard(user.barbeariaId);
        setDashboardData(data);
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados do dashboard:", err);
      setError("Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  };

  const barbershopCode = dashboardData?.barbearia?.codigoBarbearia || '';
  const stats = {
    totalBarbers: dashboardData?.totalBarbeiros || 0,
    totalAppointments: dashboardData?.agendamentosMes || 0,
    completedAppointments: dashboardData?.concluidosMes || 0,
    totalRevenue: dashboardData?.receitaTotal || 0
  };
  const paymentData = dashboardData?.formasPagamento ? [
    { name: 'PIX', value: dashboardData.formasPagamento.pix, color: '#8b5cf6' },
    { name: 'Cartão', value: dashboardData.FormasPagamento.Cartao, color: '#06b6d4' },
    { name: 'Dinheiro', value: dashboardData.FormasPagamento.Dinheiro, color: '#eab308' }
  ].filter(item => item.value > 0) : [];
  const weeklyData = dashboardData?.PerformanceSemanal ? 
    ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => ({
      day,
      appointments: dashboardData.PerformanceSemanal[index] || 0
    })) : [];
  const barbers = dashboardData?.Barbeiros ? dashboardData.Barbeiros.map((barbeiro: any) => ({
    id: barbeiro.Id,
    name: barbeiro.Nome,
    percentage: barbeiro.Porcentagem,
    weeklyEarnings: barbeiro.GanhosSemana,
    appointments: barbeiro.Agendamentos
  })) : [];

  const copyBarbershopCode = () => {
    navigator.clipboard.writeText(barbershopCode);
    toast.success('Código copiado para a área de transferência!');
  };

  const generateBarberLink = (barber: any) => {
    const link = `${window.location.origin}/barber/register?code=${barbershopCode}&barber=${barber.id}`;
    navigator.clipboard.writeText(link);
    toast.success(`Link gerado para ${barber.name}!`);
  };

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
      {error && (
        <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg mb-4">
          {error}
        </div>
      )}
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Dashboard da Barbearia</h1>
        <p className="text-yellow-100">Gerencie sua barbearia e acompanhe o desempenho</p>
      </div>

      {/* Barbershop Code */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Código da Barbearia</h2>
        <div className="flex items-center space-x-4">
          <div className="flex-1 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white">{barbershopCode || 'Carregando...'}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Compartilhe este código com os barbeiros para que possam se cadastrar</p>
          </div>
          <button
            onClick={copyBarbershopCode}
            disabled={!barbershopCode}
            className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white p-3 rounded-lg transition-colors"
          >
            <Copy className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Barbeiros</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBarbers}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Agendamentos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalAppointments}</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Concluídos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedAppointments}</p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">R$ {stats.totalRevenue}</p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Chart */}
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
                    label={({ name, value }) => `${name}: ${value}%`}
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

        {/* Weekly Performance */}
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
                    ]}
                  />
                  <Bar dataKey="appointments" fill="#eab308" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Barbers Management */}
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