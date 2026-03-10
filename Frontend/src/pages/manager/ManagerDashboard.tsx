
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

// Componentes modulares
import { DashboardHeader } from '../barber/components/DashboardHeader';
import { BarbershopCodeCard } from './components/BarbershopCodeCard';
import { ManagerStatCards } from './components/ManagerStatCards';
import { PaymentMethodsChart, WeeklyPerformanceChart } from './components/Charts';
import { BarbersList } from './components/BarbersList';

// Tipagem dos dados
interface ManagerDashboardData {
  barbearia: { codigoBarbearia: string };
  totalBarbeiros: number;
  agendamentosMes: number;
  concluidosMes: number;
  receitaTotal: number;
  formasPagamento: { pix: number; cartao: number; dinheiro: number };
  performanceSemanal: number[];
  barbeiros: any[];
}

/**
 * Componente do Dashboard do Gerente, refatorado para modularidade e performance.
 */
export default function ManagerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!user?.barbeariaId) {
      setError("ID da barbearia não encontrado. Faça login novamente.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const dashboardData = await apiService.getManagerDashboard(user.barbeariaId);
      setData(dashboardData);
    } catch (err: any) {
      console.error("Erro ao carregar dashboard do gerente:", err);
      setError(err.message || "Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Dados processados para os gráficos
  const paymentData = data?.formasPagamento ? [
    { name: 'PIX', value: data.formasPagamento.pix, color: '#8b5cf6' },
    { name: 'Cartão', value: data.formasPagamento.cartao, color: '#06b6d4' },
    { name: 'Dinheiro', value: data.formasPagamento.dinheiro, color: '#eab308' }
  ].filter(item => item.value > 0) : [];

  const weeklyData = data?.performanceSemanal ? 
    ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => ({
      day,
      appointments: data.performanceSemanal[index] || 0
    })) : [];

  const handleAddBarber = () => {
    // Lógica para adicionar um novo barbeiro (ex: abrir modal)
    toast.success('Funcionalidade para adicionar barbeiro em desenvolvimento!');
  };

  if (error && !loading) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-red-600">Erro ao Carregar Dashboard</h2>
        <p className="text-gray-500">{error}</p>
        <button onClick={loadDashboardData} className="mt-4 bg-yellow-500 text-white px-4 py-2 rounded-lg">Tentar Novamente</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <DashboardHeader 
        title="Dashboard da Barbearia" 
        subtitle="Gerencie sua equipe e acompanhe o crescimento do seu negócio."
      />

      <BarbershopCodeCard 
        code={data?.barbearia?.codigoBarbearia || ''} 
        loading={loading && !data} 
      />

      <ManagerStatCards stats={data} loading={loading && !data} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PaymentMethodsChart data={paymentData} loading={loading && !data} />
        <WeeklyPerformanceChart data={weeklyData} loading={loading && !data} />
      </div>

      <BarbersList 
        barbers={data?.barbeiros || []} 
        barbershopCode={data?.barbearia?.codigoBarbearia || ''}
        loading={loading && !data}
        onAddBarber={handleAddBarber}
      />
    </div>
  );
}
