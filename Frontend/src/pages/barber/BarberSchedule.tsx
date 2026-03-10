import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, User, Phone, MapPin, CheckCircle, XCircle, PlayCircle, Search, Filter, List, LayoutGrid, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * Interface que define a estrutura de um objeto de agendamento.
 */
interface Appointment {
  id: string;
  dataHora: string;
  status: string;
  observacoes?: string;
  tipoServico: string;
  precoServico: number;
  nomeCliente: string;
  emailCliente: string;
  telefoneCliente?: string;
  nomeBarbeiro: string;
  nomeBarbearia: string;
}

/**
 * Componente de agenda para barbeiros.
 * Permite ao barbeiro visualizar e gerenciar seus agendamentos por data.
 */
export default function BarberSchedule() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [viewMode, setViewMode] = useState<'daily' | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadAppointments();
  }, []);

  /**
   * Carrega os agendamentos do barbeiro a partir da API.
   * Atualiza os estados de carregamento, agendamentos e erro.
   */
  const loadAppointments = async () => {
    try {
      setLoading(true);
      // Chama o serviço de API para obter os agendamentos do barbeiro.
      const data = await apiService.getMyAppointments();
      
      // Proteção defensiva: Garante que appointments seja sempre um array
      const appointmentsArray = Array.isArray(data) ? data : [];
      
      // Ordenação cronológica inicial (mais recentes primeiro ou por data/hora)
      const sorted = [...appointmentsArray].sort((a, b) => {
        return new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime();
      });

      setAppointments(sorted);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Erro ao carregar agendamentos. Tente novamente.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filtra e ordena os agendamentos com base no modo de visualização, termo de busca e filtros.
   */
  const processedAppointments = useMemo(() => {
    let filtered = [...appointments];

    // 1. Filtro por Modo de Visualização (Diário vs Todos)
    if (viewMode === 'daily') {
      filtered = filtered.filter(apt => apt.dataHora?.split('T')[0] === selectedDate);
    }

    // 2. Filtro por Termo de Busca (Nome do Cliente ou Serviço)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(apt => 
        apt.nomeCliente?.toLowerCase().includes(term) || 
        apt.tipoServico?.toLowerCase().includes(term)
      );
    }

    // 3. Filtro por Status
    if (statusFilter !== 'Todos') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    // 4. Ordenação
    filtered.sort((a, b) => {
      const dateA = new Date(a.dataHora).getTime();
      const dateB = new Date(b.dataHora).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }, [appointments, viewMode, selectedDate, searchTerm, statusFilter, sortOrder]);

  /**
   * Atualiza o status de um agendamento.
   * @param {string} id - O ID do agendamento.
   * @param {string} newStatus - O novo status.
   */
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await apiService.updateAppointmentStatus(Number(id), newStatus);
      // Recarrega a lista para refletir a mudança
      await loadAppointments();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar o status do agendamento.');
    }
  };

  /**
   * Retorna a classe CSS para a cor do status do agendamento.
   * @param {string} status - O status do agendamento (Confirmado, Pendente, Realizado, Cancelado).
   * @returns {string} - A string de classes CSS Tailwind para a cor correspondente.
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmado':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Realizado':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Cancelado':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Exibe um spinner de carregamento enquanto os dados estão sendo buscados.
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Minha Agenda</h1>
          <p className="text-gray-600 dark:text-gray-400">Carregando agendamentos...</p>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        </div>
      </div>
    );
  }

  // Exibe uma mensagem de erro se houver problemas ao carregar os agendamentos.
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Minha Agenda</h1>
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
        <button 
          onClick={loadAppointments}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Minha Agenda
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie seus agendamentos e horários
          </p>
        </div>

        {/* Alternador de Visualização */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg self-start sm:self-center">
          <button
            onClick={() => setViewMode('daily')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'daily'
                ? 'bg-white dark:bg-gray-700 text-yellow-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            <span>Visão Diária</span>
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'all'
                ? 'bg-white dark:bg-gray-700 text-yellow-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <List className="h-4 w-4" />
            <span>Ver Tudo</span>
          </button>
        </div>
      </div>

      {/* Seção de Filtros e Busca */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Busca e Filtro por Data */}
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente ou serviço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
              />
            </div>
            
            {viewMode === 'daily' && (
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-yellow-500" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                />
              </div>
            )}
          </div>

          {/* Filtros de Status e Ordenação */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
              >
                <option value="Todos">Todos os Status</option>
                <option value="Confirmado">Confirmados</option>
                <option value="Pendente">Pendentes</option>
                <option value="Realizado">Realizados</option>
                <option value="Cancelado">Cancelados</option>
              </select>
            </div>

            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="flex items-center space-x-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              <span>{sortOrder === 'asc' ? 'Mais Antigos' : 'Mais Recentes'}</span>
              {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Agendamentos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {viewMode === 'daily' ? 'Agendamentos do Dia' : 'Todos os Agendamentos'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {processedAppointments.length} agendamento(s) encontrado(s)
              {viewMode === 'daily' && ` para ${new Date(selectedDate).toLocaleDateString('pt-BR')}`}
            </p>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {processedAppointments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="bg-gray-100 dark:bg-gray-700 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">Nenhum agendamento encontrado</p>
              <p className="text-gray-500 dark:text-gray-400">Tente ajustar seus filtros ou busca.</p>
            </div>
          ) : (
            processedAppointments.map((appointment) => (
              <div key={appointment.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start sm:items-center space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                        <User className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-bold text-gray-900 dark:text-white truncate">
                          {appointment.nomeCliente}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                      
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{appointment.dataHora.split('T')[0].split('-').reverse().join('/')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{appointment.dataHora.split('T')[1].substring(0, 5)}</span>
                        </div>
                        {appointment.telefoneCliente && (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-4 w-4 text-yellow-500" />
                            <span>{appointment.telefoneCliente}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 flex items-start gap-2">
                        <div className="mt-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-yellow-500"></div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white font-semibold">
                            {appointment.tipoServico || 'Corte + Barba'}
                          </p>
                          {appointment.observacoes && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-0.5">
                              "{appointment.observacoes}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-gray-700">
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">Valor do Serviço</p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white">
                        R$ {appointment.precoServico?.toFixed(2) || '45.00'}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {appointment.status === 'Pendente' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(appointment.id, 2)}
                            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors shadow-sm"
                            title="Confirmar Agendamento"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(appointment.id, 3)}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors shadow-sm"
                            title="Cancelar Agendamento"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      
                      {appointment.status === 'Atendido' && (
                        <button
                          onClick={() => handleUpdateStatus(appointment.id, 4)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm flex items-center space-x-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Concluir</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Resumo Dinâmico */}
      {processedAppointments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-yellow-500" />
            <span>Resumo {viewMode === 'daily' ? 'do Dia' : 'da Seleção'}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-bold mb-1">Total de Agendamentos</p>
              <p className="text-3xl font-black text-blue-700 dark:text-blue-300">
                {processedAppointments.length}
              </p>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/20">
              <p className="text-sm text-green-600 dark:text-green-400 font-bold mb-1">Confirmados</p>
              <p className="text-3xl font-black text-green-700 dark:text-green-300">
                {processedAppointments.filter(apt => apt.status === 'Confirmado').length}
              </p>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100 dark:border-yellow-900/20">
              <p className="text-sm text-yellow-600 dark:text-yellow-400 font-bold mb-1">Receita Estimada</p>
              <p className="text-3xl font-black text-yellow-700 dark:text-yellow-300">
                R$ {processedAppointments.reduce((total, apt) => total + (apt.precoServico || 0), 0).toFixed(2)}
              </p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/20">
              <p className="text-sm text-purple-600 dark:text-purple-400 font-bold mb-1">Atendimentos Concluídos</p>
              <p className="text-3xl font-black text-purple-700 dark:text-purple-300">
                {processedAppointments.filter(apt => apt.status === 'Realizado').length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


