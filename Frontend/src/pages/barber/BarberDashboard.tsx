
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, DollarSign, BarChart3, CheckCircle } from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, format, getDay } from 'date-fns';
import toast from 'react-hot-toast';

// Sub-componentes
import { DashboardHeader } from './components/DashboardHeader';
import { StatCard } from './components/StatCard';
import { AppointmentsList } from './components/AppointmentsList';
import { WeeklyPerformanceChart } from './components/WeeklyPerformanceChart';

/**
 * Interface que define a estrutura dos dados processados do dashboard.
 */
interface ProcessedDashboardData {
  totalAgendamentosHoje: number;
  agendamentosConcluidos: number;
  totalAgendamentosSemana: number;
  ganhosSemana: number;
  agendamentosHoje: any[];
  performanceSemanal: any[];
}

/**
 * Componente de Dashboard para Barbeiros.
 * Refatorado para melhor modularidade, performance e UX.
 */
export default function BarberDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<ProcessedDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Processa a lista bruta de agendamentos para gerar as métricas do dashboard.
   */
  const processDashboardData = useCallback((appointments: any[]): ProcessedDashboardData => {
    const hoje = new Date();
    const hojeStr = format(hoje, 'yyyy-MM-dd');
    const inicioSemana = startOfWeek(hoje, { weekStartsOn: 0 });
    const fimSemana = endOfWeek(hoje, { weekStartsOn: 0 });

    // 1. Filtrar agendamentos de hoje
    const agendamentosHoje = appointments
      .filter(apt => apt.dataHora?.split('T')[0] === hojeStr)
      .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());

    // 2. Estatísticas de hoje
    const totalAgendamentosHoje = agendamentosHoje.length;
    const agendamentosConcluidos = agendamentosHoje.filter(apt => 
      ['Realizado', 'Concluído', 'Atendido'].includes(apt.status)
    ).length;

    // 3. Agendamentos e Ganhos da semana
    const agendamentosSemana = appointments.filter(apt => {
      try {
        const dataApt = parseISO(apt.dataHora);
        return isWithinInterval(dataApt, { start: inicioSemana, end: fimSemana });
      } catch {
        return false;
      }
    });

    const totalAgendamentosSemana = agendamentosSemana.length;
    const ganhosSemana = agendamentosSemana
      .filter(apt => ['Realizado', 'Concluído', 'Atendido'].includes(apt.status))
      .reduce((total, apt) => total + (Number(apt.precoServico || apt.preco) || 0), 0);

    // 4. Mapeamento de performance semanal para o gráfico
    const performanceMap = new Array(7).fill(0).map(() => ({ cortes: 0, ganhos: 0 }));
    const diasSemanaLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    agendamentosSemana.forEach(apt => {
      if (['Realizado', 'Concluído', 'Atendido'].includes(apt.status)) {
        try {
          const diaSemana = getDay(parseISO(apt.dataHora));
          performanceMap[diaSemana].cortes += 1;
          performanceMap[diaSemana].ganhos += (Number(apt.precoServico || apt.preco) || 0);
        } catch (e) {
          console.error("Erro ao processar data para gráfico:", e);
        }
      }
    });

    const performanceSemanal = performanceMap.map((p, index) => ({
      dia: diasSemanaLabels[index],
      cortes: p.cortes,
      ganhos: p.ganhos
    }));

    return {
      totalAgendamentosHoje,
      agendamentosConcluidos,
      totalAgendamentosSemana,
      ganhosSemana,
      agendamentosHoje,
      performanceSemanal
    };
  }, []);

  /**
   * Carrega os dados do dashboard.
   */
  const loadDashboardData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      
      const appointments = await apiService.getMyAppointments();
      const appointmentsList = Array.isArray(appointments) ? appointments : [];
      
      setData(processDashboardData(appointmentsList));
    } catch (err: any) {
      console.error("Erro ao carregar dados do dashboard:", err);
      setError(err.message || "Erro ao conectar com o servidor.");
      
      // Fallback em caso de erro
      if (!silent) {
        setData({
          totalAgendamentosHoje: 0,
          agendamentosConcluidos: 0,
          totalAgendamentosSemana: 0,
          ganhosSemana: 0,
          agendamentosHoje: [],
          performanceSemanal: []
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [processDashboardData]);

  // Carregamento inicial e polling
  useEffect(() => {
    loadDashboardData();
    const intervalId = setInterval(() => loadDashboardData(true), 30000);
    return () => clearInterval(intervalId);
  }, [loadDashboardData]);

  /**
   * Ação para marcar um agendamento como concluído.
   */
  const handleMarkAsDone = async (id: number) => {
    try {
      await apiService.updateAppointmentStatus(id, 'Realizado');
      toast.success('Agendamento concluído com sucesso!');
      loadDashboardData(true);
    } catch (error) {
      toast.error('Erro ao atualizar agendamento.');
    }
  };

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="bg-red-100 p-4 rounded-full">
          <Calendar className="h-12 w-12 text-red-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ops! Algo deu errado.</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
        <button 
          onClick={() => loadDashboardData()}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <DashboardHeader 
        title={`Bem-vindo, ${user?.nome || 'Barbeiro'}`} 
        subtitle="Gerencie seus atendimentos e acompanhe seu crescimento diário." 
      />

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Agendamentos Hoje"
          value={data?.totalAgendamentosHoje || 0}
          icon={<Calendar />}
          bgColor="bg-blue-100 dark:bg-blue-900/20"
          textColor="text-blue-600 dark:text-blue-400"
          loading={loading && !data}
        />
        <StatCard
          title="Concluídos Hoje"
          value={data?.agendamentosConcluidos || 0}
          icon={<CheckCircle />}
          bgColor="bg-green-100 dark:bg-green-900/20"
          textColor="text-green-600 dark:text-green-400"
          loading={loading && !data}
        />
        <StatCard
          title="Total na Semana"
          value={data?.totalAgendamentosSemana || 0}
          icon={<BarChart3 />}
          bgColor="bg-orange-100 dark:bg-orange-900/20"
          textColor="text-orange-600 dark:text-orange-400"
          loading={loading && !data}
        />
        <StatCard
          title="Ganhos da Semana"
          value={`R$ ${(data?.ganhosSemana || 0).toFixed(2)}`}
          icon={<DollarSign />}
          bgColor="bg-yellow-100 dark:bg-yellow-900/20"
          textColor="text-yellow-600 dark:text-yellow-400"
          loading={loading && !data}
        />
      </div>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AppointmentsList 
          appointments={data?.agendamentosHoje || []} 
          loading={loading && !data} 
          onMarkAsDone={handleMarkAsDone}
        />
        <WeeklyPerformanceChart 
          data={data?.performanceSemanal || []} 
          loading={loading && !data} 
        />
      </div>
    </div>
  );
}
