import {
  Calendar,
  DollarSign,
  Mail,
  Phone,
  Plus,
  Search,
  Star,
  UserCheck,
  Users,
} from 'lucide-react';
import type { ManagerBarber, ManagerBarbersData } from '../../../services/api/adapters';

interface ManagerBarbersSearchToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddBarber: () => void;
}

interface ManagerBarbersSummaryCardsProps {
  stats: ManagerBarbersData['estatisticas'];
}

interface ManagerBarbersListSectionProps {
  barbers: ManagerBarber[];
  searchTerm: string;
}

function getStatusColor(status: string) {
  return status === 'active'
    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
}

function getStatusText(status: string) {
  return status === 'active' ? 'Ativo' : 'Inativo';
}

export function ManagerBarbersSearchToolbar({
  searchTerm,
  onSearchChange,
  onAddBarber,
}: ManagerBarbersSearchToolbarProps) {
  return (
    <>
      <button
        onClick={onAddBarber}
        className="flex sm:hidden items-center justify-center space-x-2 bg-yellow-600 text-white px-3 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
      >
        <Plus className="h-4 w-4" />
        <span>Adicionar</span>
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar barbeiros..."
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-full pl-8 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={onAddBarber}
            className="hidden sm:flex items-center justify-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm sm:text-base"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Adicionar Barbeiro</span>
          </button>
        </div>
      </div>
    </>
  );
}

export function ManagerBarbersSummaryCards({ stats }: ManagerBarbersSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
              Total de Barbeiros
            </p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalBarbeiros}
            </p>
          </div>
          <Users className="h-4 w-4 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
              Barbeiros Ativos
            </p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
              {stats.barbeirosAtivos}
            </p>
          </div>
          <UserCheck className="h-4 w-4 sm:h-8 sm:w-8 text-green-600 dark:text-green-400 flex-shrink-0" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
              Receita Total
            </p>
            <p className="text-sm sm:text-2xl font-bold text-gray-900 dark:text-white">
              R$ {stats.receitaTotal.toLocaleString()}
            </p>
          </div>
          <DollarSign className="h-4 w-4 sm:h-8 sm:w-8 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
              Avaliação Média
            </p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
              {stats.avaliacaoMedia.toFixed(1)}
            </p>
          </div>
          <Star className="h-4 w-4 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400 flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}

export function ManagerBarbersListSection({
  barbers,
  searchTerm,
}: ManagerBarbersListSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Lista de Barbeiros
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {barbers.length} barbeiro(s) encontrado(s)
        </p>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {barbers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm
                ? 'Nenhum barbeiro encontrado com os critérios de busca.'
                : 'Nenhum barbeiro cadastrado na barbearia.'}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              {!searchTerm && 'Compartilhe o código da barbearia para que os barbeiros possam se cadastrar.'}
            </p>
          </div>
        ) : (
          barbers.map((barber) => (
            <div key={barber.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-yellow-500 flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {barber.name.charAt(0)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        {barber.name}
                      </p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(barber.status)}`}>
                        {getStatusText(barber.status)}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Mail className="h-4 w-4" />
                        <span>{barber.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Phone className="h-4 w-4" />
                        <span>{barber.phone}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Desde {new Date(barber.joinDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="flex flex-wrap gap-1">
                        {barber.specialties.map((specialty, index) => (
                          <span
                            key={`${barber.id}-${specialty}-${index}`}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {barber.rating}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Avaliação
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {barber.totalClients}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Clientes
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      R$ {barber.monthlyRevenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Receita/Mês
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      Editar
                    </button>
                    <button className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
