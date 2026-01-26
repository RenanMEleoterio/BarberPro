import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, MapPin, CheckCircle, XCircle, PlayCircle } from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * Interface que define a estrutura de um objeto de agendamento.
 */
interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  service: string;
  date: string;
  time: string;
  status: string;
  price: number;
  dataHora: string;
  nomeCliente: string;
  telefoneCliente: string;
  tipoServico: string;
  precoServico: number;
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
  const [filterByDate, setFilterByDate] = useState(false);

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
      
      console.log('BarberSchedule: loadAppointments response', {
        data,
        isArray: Array.isArray(data),
        type: typeof data
      });

      // Proteção defensiva: Garante que appointments seja sempre um array
      setAppointments(Array.isArray(data) ? data : []);
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

  // Filtra os agendamentos pela data selecionada para exibição.
  const filteredAppointments = appointments.filter(apt => {
    if (!apt.dataHora) return false;
    // Usa split para pegar a data "crua" da string ISO/API, ignorando timezone
    const aptDate = apt.dataHora.split('T')[0];
    return aptDate === selectedDate;
  });

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Minha Agenda
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie seus agendamentos e horários
          </p>
        </div>
      </div>

      {/* Seletor de Data */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <Calendar className="h-5 w-5 text-yellow-500" />
          <label htmlFor="date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Selecionar Data:
          </label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Lista de Agendamentos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Agendamentos do Dia
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredAppointments.length} agendamento(s) para {selectedDate.split('-').reverse().join('/')}
          </p>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {!Array.isArray(filteredAppointments) || filteredAppointments.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Nenhum agendamento para esta data
              </p>
            </div>
          ) : (
            filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                          {appointment.nomeCliente}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                      
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{appointment.dataHora.split('T')[0].split('-').reverse().join('/')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{appointment.dataHora.split('T')[1].substring(0, 5)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-4 w-4" />
                          <span>{appointment.telefoneCliente || '(Telefone não disponível)'}</span>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-sm text-gray-900 dark:text-white font-medium">
                          {appointment.tipoServico || 'Serviço não informado'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        R$ {appointment.precoServico?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      {appointment.status === 'Pendente' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(appointment.id, 2)}
                            className="text-green-600 hover:text-green-700 text-sm font-medium transition-colors"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(appointment.id, 3)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                      
                      {appointment.status === 'Atendido' && (
                        <button
                          onClick={() => handleUpdateStatus(appointment.id, 4)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                        >
                          Concluir
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

      {/* Resumo do Dia */}
      {filteredAppointments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {filterByDate ? 'Resumo do Dia' : 'Resumo Geral'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredAppointments.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total de Agendamentos
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {filteredAppointments.filter(apt => apt.status === 'Confirmado').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Confirmados
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                R$ {filteredAppointments.reduce((total, apt) => total + (apt.precoServico || 0), 0).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receita Estimada
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


