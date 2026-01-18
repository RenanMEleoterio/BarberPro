import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Star, Phone, CheckCircle, XCircle, AlertCircle, X, Info, Scissors } from 'lucide-react';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

/**
 * Componente para exibir e gerenciar os agendamentos de um cliente.
 * Permite filtrar agendamentos por status (todos, agendados, concluídos, cancelados).
 */
export default function Appointments() {
  const navigate = useNavigate();
  // Estado para o filtro de agendamentos (ex: 'all', 'scheduled', 'completed', 'cancelled').
  const [filter, setFilter] = useState('all');
  // Estado para armazenar a lista de agendamentos do cliente.
  const [appointments, setAppointments] = useState<any[]>([]);
  // Estado para controlar o status de carregamento dos agendamentos.
  const [loading, setLoading] = useState(true);
  // Estado para armazenar mensagens de erro.
  const [error, setError] = useState<string | null>(null);
  
  // Estado para controlar o modal de detalhes
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  // Estado para controlar o processamento de ações (cancelamento)
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Efeito que carrega os agendamentos do cliente quando o componente é montado.
  useEffect(() => {
    loadAppointments();
  }, []);

  /**
   * Carrega os agendamentos do cliente a partir da API.
   * Atualiza os estados de carregamento, agendamentos e erro.
   */
  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await apiService.getMyAppointmentsWithDetails();
      setAppointments(data);
    } catch (error: any) {
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
   * Cancela um agendamento.
   */
  const handleCancel = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja cancelar este agendamento?')) {
      return;
    }

    try {
      setProcessingId(id);
      await apiService.cancelAppointment(parseInt(id));
      toast.success('Agendamento cancelado com sucesso!');
      loadAppointments(); // Recarrega a lista para atualizar status
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Erro ao cancelar agendamento.';
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  /**
   * Redireciona para reagendamento.
   * Navega para a tela de agendamento com os dados pré-preenchidos para edição.
   */
  const handleReschedule = (appointment: any) => {
    if (!appointment.barbershopId) {
      toast.error('Erro ao identificar a barbearia. Tente novamente.');
      return;
    }

    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    if (appointmentDateTime <= new Date()) {
      toast.error('Não é possível reagendar um horário que já passou.');
      return;
    }

    navigate(`/client/barbershops/${appointment.barbershopId}/book`, {
      state: {
        reschedulingAppointmentId: appointment.id,
        initialBarberId: appointment.barberId
      }
    });
  };

  /**
   * Abre o modal de detalhes.
   */
  const handleViewDetails = (appointment: any) => {
    setSelectedAppointment(appointment);
  };

  /**
   * Fecha o modal de detalhes.
   */
  const closeModal = () => {
    setSelectedAppointment(null);
  };

  // Filtra os agendamentos com base no estado `filter`.
  const filteredAppointments = appointments.filter(appointment => {
    if (filter === 'all') return true; // Se o filtro for 'all', retorna todos os agendamentos.
    return appointment.status === filter; // Caso contrário, filtra pelo status.
  });

  // Exibe um spinner de carregamento enquanto os dados estão sendo buscados.
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Meus Agendamentos</h1>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Meus Agendamentos</h1>
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

  /**
   * Retorna o ícone correspondente ao status do agendamento.
   * @param {string} status - O status do agendamento.
   * @returns {JSX.Element | null} - O ícone Lucide React ou null se não houver correspondência.
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  /**
   * Retorna o texto formatado para o status do agendamento.
   * @param {string} status - O status do agendamento.
   * @returns {string} - O texto do status em português.
   */
  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Agendado';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  /**
   * Retorna a classe CSS para a cor de fundo do status do agendamento.
   * @param {string} status - O status do agendamento.
   * @returns {string} - A string de classes CSS Tailwind para a cor correspondente.
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da página */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Meus Agendamentos</h1>
        <p className="text-gray-600 dark:text-gray-400">Acompanhe seus agendamentos passados e futuros</p>
      </div>

      {/* Abas de Filtro */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'scheduled', label: 'Agendados' },
          { key: 'completed', label: 'Concluídos' },
          { key: 'cancelled', label: 'Cancelados' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              filter === tab.key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lista de Agendamentos */}
      <div className="space-y-4">
        {filteredAppointments.map((appointment) => (
          <div key={appointment.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(appointment.status)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{appointment.barbershop}</h3>
                  <p className="text-gray-600 dark:text-gray-400">com {appointment.barber}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                {getStatusText(appointment.status)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">{new Date(appointment.date).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{appointment.time}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{appointment.address}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <Phone className="h-4 w-4" />
                <span className="text-sm">{appointment.phone}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{appointment.service}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">R$ {appointment.price}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{appointment.rating}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {appointment.status === 'scheduled' && (
                  <>
                    <button 
                      onClick={() => handleCancel(appointment.id)}
                      disabled={processingId === appointment.id}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingId === appointment.id ? 'Cancelando...' : 'Cancelar'}
                    </button>
                    <button 
                      onClick={() => handleReschedule(appointment)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Reagendar
                    </button>
                  </>
                )}
                {appointment.status === 'completed' && (
                  <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Avaliar
                  </button>
                )}
                <button 
                  onClick={() => handleViewDetails(appointment)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Detalhes
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mensagem de nenhum agendamento encontrado */}
      {filteredAppointments.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Nenhum agendamento encontrado</p>
        </div>
      )}

      {/* Modal de Detalhes */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-down">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Detalhes do Agendamento</h3>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAppointment.status)}`}>
                  {getStatusText(selectedAppointment.status)}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded-lg mt-1">
                    <Scissors className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedAppointment.barbershop}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Profissional: {selectedAppointment.barber}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {new Date(selectedAppointment.date).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">{selectedAppointment.time}</span>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">{selectedAppointment.address}</span>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">{selectedAppointment.phone}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Serviço</span>
                  <span className="font-medium text-gray-900 dark:text-white">{selectedAppointment.service}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Valor</span>
                  <span className="font-bold text-lg text-green-600 dark:text-green-400">R$ {selectedAppointment.price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button 
                onClick={closeModal}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
              >
                Fechar
              </button>
              {selectedAppointment.status === 'scheduled' && (
                <button 
                  onClick={() => {
                    handleCancel(selectedAppointment.id);
                    closeModal();
                  }}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancelar Agendamento
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


