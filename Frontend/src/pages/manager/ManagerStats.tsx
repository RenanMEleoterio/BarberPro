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
    <div>
      {/* Conteúdo comentado para depuração */}
      <p>Conteúdo temporário para teste de build.</p>
    </div>
  );
}


