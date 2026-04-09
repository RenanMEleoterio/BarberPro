import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import type { ManagerStatsData } from '../../services/api/adapters';
import {
  ManagerStatsDetailsPanels,
  ManagerStatsInsightPanels,
  ManagerStatsSummaryCards,
} from './components/ManagerStatsSections';

const PERIOD_OPTIONS = [
  { value: 'semana', label: 'Esta Semana' },
  { value: 'mes', label: 'Este Mês' },
  { value: 'trimestre', label: 'Este Trimestre' },
  { value: 'ano', label: 'Este Ano' },
];

const PERIOD_MAP: Record<string, string> = {
  semana: 'semana',
  mes: 'mes',
  trimestre: 'trimestre',
  ano: 'ano',
};

const DEFAULT_STATS: ManagerStatsData = {
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
  satisfacao: { excelente: 78, bom: 18, regular: 4 },
};

export default function ManagerStatsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('ano');
  const [statsData, setStatsData] = useState<ManagerStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadStatsData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user?.id) {
          setError('ID da barbearia não encontrado.');
          return;
        }

        const periodoBackend = PERIOD_MAP[selectedPeriod] || 'mes';
        const data = await apiService.getManagerStats(Number(user.id), periodoBackend);
        setStatsData(data);
      } catch (err: unknown) {
        console.error('Erro ao carregar estatísticas:', err);
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Erro ao carregar estatísticas';

        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadStatsData();
  }, [selectedPeriod, user]);

  const stats = statsData ?? DEFAULT_STATS;

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
            onChange={(event) => setSelectedPeriod(event.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ManagerStatsSummaryCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ManagerStatsDetailsPanels stats={stats} />
        <ManagerStatsInsightPanels stats={stats} />
      </div>
    </div>
  );
}
