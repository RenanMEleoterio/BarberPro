import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Star, Phone, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { apiService } from '../../services/api';

/**
 * Componente para exibir e gerenciar os agendamentos de um cliente.
 * Permite filtrar agendamentos por status (todos, agendados, concluídos, cancelados).
 */
export default function Appointments() {
  // Estado para o filtro de agendamentos (ex: 'all', 'scheduled', 'completed', 'cancelled').
  const [filter, setFilter] = useState('all');
  // Estado para armazenar a lista de agendamentos do cliente.
  const [appointments, setAppointments] = useState<any[]>([]);
  // Estado para controlar o status de carregamento dos agendamentos.
  const [loading, setLoading] = useState(true);
  // Estado para armazenar mensagens de erro.
  const [error, setError] = useState<string | null>(null);

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
      // Chama o serviço de API para obter os agendamentos com detalhes.
      const data = await apiService.getMyAppointmentsWithDetails();
      setAppointments(data);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      setError('Erro ao carregar agendamentos. Tente novamente.');
    } finally {
      setLoading(false);
    }
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
                    <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Cancelar
                    </button>
                    <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Reagendar
                    </button>
                  </>
                )}
                {appointment.status === 'completed' && (
                  <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Avaliar
                  </button>
                )}
                <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
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
    </div>
  );
}


