import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import type { ManagerBarbersData } from '../../services/api/adapters';
import {
  ManagerBarbersListSection,
  ManagerBarbersSearchToolbar,
  ManagerBarbersSummaryCards,
} from './components/ManagerBarbersSections';

const DEFAULT_BARBER_STATS: ManagerBarbersData['estatisticas'] = {
  totalBarbeiros: 0,
  barbeirosAtivos: 0,
  receitaTotal: 0,
  avaliacaoMedia: 0,
};

export default function ManagerBarbersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [barbersData, setBarbersData] = useState<ManagerBarbersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadBarbersData = async () => {
      if (!user?.id) {
        setError('Autenticação não encontrada. Faça login novamente.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getManagerBarbers(Number(user.id));
        setBarbersData(data);
      } catch (err: unknown) {
        console.error('Erro ao carregar barbeiros:', err);

        if ((err as { response?: { status?: number } })?.response?.status !== 404) {
          const message =
            err instanceof Error && err.message
              ? err.message
              : 'Erro ao carregar dados dos barbeiros';

          setError(message);
          toast.error(message);
        }
      } finally {
        setLoading(false);
      }
    };

    void loadBarbersData();
  }, [user]);

  const barbers = barbersData?.barbeiros ?? [];
  const stats = barbersData?.estatisticas ?? DEFAULT_BARBER_STATS;

  const filteredBarbers = useMemo(
    () =>
      barbers.filter((barber) =>
        barber.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        barber.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        barber.specialties.some((specialty) =>
          specialty.toLowerCase().includes(searchTerm.toLowerCase())
        )
      ),
    [barbers, searchTerm]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gerenciar Barbeiros
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
            Gerenciar Barbeiros
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Gerencie a equipe de barbeiros da sua barbearia
          </p>
        </div>
      </div>

      <ManagerBarbersSearchToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddBarber={() => setShowAddModal(true)}
      />

      <ManagerBarbersSummaryCards stats={stats} />

      <ManagerBarbersListSection
        barbers={filteredBarbers}
        searchTerm={searchTerm}
      />

      {showAddModal && <div className="hidden" aria-hidden="true" />}
    </div>
  );
}
