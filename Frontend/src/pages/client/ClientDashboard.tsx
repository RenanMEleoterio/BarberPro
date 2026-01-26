import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Star, Scissors, X, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

/**
 * Interface que define a estrutura dos dados do dashboard do cliente.
 */
interface DashboardData {
  Cliente: {
    Id: number;
    Nome: string;
    Email: string;
  };
  TotalAgendamentos: number;
  ProximoAgendamento?: {
    Id: number;
    Data: string;
    Hora: string;
    Barbeiro: string;
    Barbearia: string;
  };
  AgendamentosRecentes: Array<{
    Id: number;
    Data: string;
    Hora: string;
    Barbeiro: string;
    BarbeiroId?: number;
    Barbearia: string;
    BarbeariaId?: number;
    Status: string;
    Preco: number;
    ServicoIds?: number[];
  }>;
  Barbearias: Array<{
    Id: number;
    Nome: string;
    Endereco: string;
    Telefone: string;
    Email: string;
  }>;
}

function normalizeClientDashboardData(data: any): DashboardData {
  const rawCliente = data?.cliente || data?.Cliente || {};
  const rawProximo = data?.proximoAgendamento ?? data?.ProximoAgendamento ?? null;
  const rawAgendamentosRecentes = data?.agendamentosRecentes || data?.AgendamentosRecentes || [];
  const rawBarbearias = data?.barbearias || data?.Barbearias || [];

  return {
    Cliente: {
      Id: rawCliente.id ?? rawCliente.Id ?? 0,
      Nome: rawCliente.nome ?? rawCliente.Nome ?? "",
      Email: rawCliente.email ?? rawCliente.Email ?? "",
    },
    TotalAgendamentos: data?.totalAgendamentos ?? data?.TotalAgendamentos ?? 0,
    ProximoAgendamento: rawProximo
      ? {
          Id: rawProximo.id ?? rawProximo.Id ?? 0,
          Data: rawProximo.data ?? rawProximo.Data ?? "",
          Hora: rawProximo.hora ?? rawProximo.Hora ?? "",
          Barbeiro: rawProximo.barbeiro ?? rawProximo.Barbeiro ?? "",
          Barbearia: rawProximo.barbearia ?? rawProximo.Barbearia ?? "",
        }
      : undefined,
    AgendamentosRecentes: Array.isArray(rawAgendamentosRecentes) 
      ? rawAgendamentosRecentes.map((a: any) => ({
          Id: a.id ?? a.Id ?? 0,
          Data: a.data ?? a.Data ?? "",
          Hora: a.hora ?? a.Hora ?? "",
          Barbeiro: a.barbeiro ?? a.Barbeiro ?? "",
          BarbeiroId: a.barbeiroId ?? a.BarbeiroId ?? 0,
          Barbearia: a.barbearia ?? a.Barbearia ?? "",
          BarbeariaId: a.barbeariaId ?? a.BarbeariaId ?? 0,
          Status: a.status ?? a.Status ?? "",
          Preco: a.preco ?? a.Preco ?? 0,
          ServicoIds: a.servicoIds ?? a.ServicoIds ?? [],
        }))
      : [],
    Barbearias: Array.isArray(rawBarbearias)
      ? rawBarbearias.map((b: any) => ({
          Id: b.id ?? b.Id ?? 0,
          Nome: b.nome ?? b.Nome ?? "",
          Endereco: b.endereco ?? b.Endereco ?? "",
          Telefone: b.telefone ?? b.Telefone ?? "",
          Email: b.email ?? b.Email ?? "",
        }))
      : [],
  };
}

/**
 * Componente do Dashboard do Cliente.
 * Exibe um resumo das informações do cliente, total de agendamentos, próximo agendamento,
 * agendamentos recentes e barbearias disponíveis.
 */
export default function ClientDashboard() {
  const navigate = useNavigate();
  // Hook para acessar as informações do usuário logado.
  const { user } = useAuth();
  // Estado para armazenar os dados do dashboard.
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  // Estado para controlar o status de carregamento dos dados.
  const [loading, setLoading] = useState(true);
  // Estado para armazenar mensagens de erro.
  const [error, setError] = useState<string | null>(null);
  
  // Estado para controlar o modal de detalhes
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  // Estado para controlar o processamento de ações
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Efeito que busca os dados do dashboard quando o componente é montado ou o usuário muda.
  useEffect(() => {
    /**
     * Função assíncrona para buscar os dados do dashboard do cliente.
     */
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const data = await apiService.getClientDashboard(parseInt(user.id));
        console.log("Dados do dashboard recebidos:", data);
        const normalized = normalizeClientDashboardData(data);
        setDashboardData(normalized);
      } catch (err: any) {
        console.error("Erro ao carregar dashboard:", err);
        const message =
          err instanceof Error && err.message
            ? err.message
            : "Erro ao carregar dados do dashboard";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]); // Dependência do `user` para refazer a busca se o usuário mudar.

  const handleCancel = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja cancelar este agendamento?')) {
      return;
    }
    try {
      setProcessingId(id);
      await apiService.cancelAppointment(id);
      toast.success('Agendamento cancelado com sucesso!');
      
      if (user) {
        const data = await apiService.getClientDashboard(parseInt(user.id));
        const normalized = normalizeClientDashboardData(data);
        setDashboardData(normalized);
      }
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

  const handleReschedule = (appointment?: any) => {
    if (appointment) {
      // Tenta obter o ID da barbearia
      let targetBarbeariaId = appointment.BarbeariaId;
      let targetBarbeiroId = appointment.BarbeiroId;

      // Fallback para Barbearia: Tentar encontrar pelo nome na lista de barbearias disponíveis se o ID não estiver presente
      if ((!targetBarbeariaId || targetBarbeariaId === 0) && appointment.Barbearia && dashboardData?.Barbearias) {
        const found = dashboardData.Barbearias.find(b => b.Nome === appointment.Barbearia);
        if (found) targetBarbeariaId = found.Id;
      }
      
      // Se ainda assim não tiver ID numérico válido, usa a propriedade antiga (compatibilidade)
      if (!targetBarbeariaId) targetBarbeariaId = appointment.Barbearia;
      if (!targetBarbeiroId) targetBarbeiroId = appointment.Barbeiro;

      // Converter data dd/MM/yyyy para yyyy-MM-dd para o input de data
      let initialDate = '';
      if (appointment.Data && appointment.Data.includes('/')) {
         const parts = appointment.Data.split('/');
         if (parts.length === 3) {
            // Assume dd/MM/yyyy
            initialDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
         }
      }

      console.log("Iniciando reagendamento:", {
        id: appointment.Id,
        barbeariaId: targetBarbeariaId,
        barbeiroId: targetBarbeiroId,
        servicoIds: appointment.ServicoIds,
        data: initialDate,
        hora: appointment.Hora
      });
      
      navigate(`/client/barbershops/${targetBarbeariaId}/book`, {
        state: {
          reschedulingAppointmentId: appointment.Id,
          initialBarberId: targetBarbeiroId,
          initialServiceIds: appointment.ServicoIds,
          initialDate: initialDate,
          initialTime: appointment.Hora
        }
      });
    } else {
      navigate('/client/barbershops');
      toast.success('Escolha um novo horário para seu agendamento.');
    }
  };

  const handleViewDetails = (appointment: any) => {
    setSelectedAppointment(appointment);
  };

  const closeModal = () => {
    setSelectedAppointment(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Atendido':
      case 'Confirmado':
      case 'Realizado':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Cancelado':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'Expirado':
        return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    return status; // Já vem formatado do backend neste endpoint, mas mantemos a função para consistência se precisar traduzir
  };

  // Exibe um spinner de carregamento enquanto os dados estão sendo buscados.
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  // Exibe uma mensagem de erro se houver problemas ao carregar os dados.
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  // Exibe uma mensagem se nenhum dado for encontrado após o carregamento.
  if (!dashboardData) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600">Nenhum dado encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho de boas-vindas */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Bem-vindo de volta, {dashboardData?.Cliente?.Nome || user?.nome || 'Cliente'}!</h1>
        <p className="text-sm sm:text-base text-yellow-100">Encontre as melhores barbearias e agende seu próximo corte</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Card: Total de Agendamentos */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Agendamentos Pendentes</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{dashboardData.TotalAgendamentos}</p>
            </div>
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
          </div>
        </div>

        {/* Card: Barbearias Disponíveis */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Barbearias Disponíveis</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{dashboardData?.Barbearias?.length || 0}</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Scissors className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Card: Próximo Agendamento (resumo) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Próximo Agendamento</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.ProximoAgendamento?.Data || 'Nenhum'}
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Seção: Próximo Agendamento (detalhes) */}
      {dashboardData?.ProximoAgendamento && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Próximo Agendamento</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{dashboardData.ProximoAgendamento.Barbearia}</h3>
                <p className="text-sm text-gray-600">Barbeiro: {dashboardData.ProximoAgendamento.Barbeiro}</p>
                <p className="text-sm text-gray-600">
                  {dashboardData.ProximoAgendamento.Data} às {dashboardData.ProximoAgendamento.Hora}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Agendado
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seção: Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Link para Encontrar Barbearias */}
        <Link
          to="/client/barbershops"
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded-lg">
              <Scissors className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Encontrar Barbearias</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Descubra barbearias próximas</p>
            </div>
          </div>
        </Link>

        {/* Link para Meus Agendamentos */}
        <Link
          to="/client/appointments"
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Meus Agendamentos</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Veja seus próximos cortes</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Seção: Agendamentos Recentes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Agendamentos Recentes</h2>
        </div>
        <div className="p-6">
          {Array.isArray(dashboardData?.AgendamentosRecentes) && dashboardData.AgendamentosRecentes.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.AgendamentosRecentes.map((appointment) => (
                <div key={appointment.Id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded-lg">
                        <Scissors className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{appointment.Barbearia}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">com {appointment.Barbeiro}</p>
                      </div>
                    </div>
                    
                    <div className="flex w-full sm:w-auto justify-between sm:justify-end gap-8">
                      <div className="text-right">
                        <div className="flex items-center justify-end space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4" />
                          <span>{appointment.Data}</span>
                        </div>
                        <div className="flex items-center justify-end space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="h-4 w-4" />
                          <span>{appointment.Hora}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.Status)}`}>
                          {appointment.Status}
                        </span>
                        {!!appointment.Preco && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            R$ {appointment.Preco.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    {(appointment.Status === 'Pendente') && (
                      <>
                        <button 
                          onClick={() => handleCancel(appointment.Id)}
                          disabled={processingId === appointment.Id}
                          className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50 transition-colors"
                        >
                          {processingId === appointment.Id ? 'Cancelando...' : 'Cancelar'}
                        </button>
                        <button 
                          onClick={() => handleReschedule(appointment)}
                          className="text-yellow-600 hover:text-yellow-700 text-sm font-medium transition-colors"
                        >
                          Reagendar
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => handleViewDetails(appointment)}
                      className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm font-medium transition-colors"
                    >
                      Detalhes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum agendamento encontrado</p>
              <Link 
                to="/client/barbershops" 
                className="inline-block mt-4 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Fazer primeiro agendamento
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Seção: Barbearias Disponíveis (lista resumida) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Barbearias Disponíveis</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.isArray(dashboardData?.Barbearias) ? dashboardData.Barbearias.slice(0, 4).map((barbearia) => (
              <div key={barbearia.Id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <Scissors className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">{barbearia.Nome}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {barbearia.Endereco}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{barbearia.Telefone}</p>
                </div>
                <Link 
                  to="/client/barbershops"
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Ver Detalhes
                </Link>
              </div>
            )) : []}
          </div>
          {/* Link para ver todas as barbearias se houver mais de 4 */}
          {dashboardData?.Barbearias?.length > 4 && (
            <div className="text-center mt-4">
              <Link 
                to="/client/barbershops"
                className="text-yellow-600 hover:text-yellow-700 font-medium"
              >
                Ver todas as barbearias ({dashboardData?.Barbearias?.length || 0})
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-down">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Detalhes do Agendamento</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAppointment.Status)}`}>
                  {selectedAppointment.Status}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Scissors className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Barbearia</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedAppointment.Barbearia}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Star className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Barbeiro</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedAppointment.Barbeiro}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Data</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedAppointment.Data}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Horário</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedAppointment.Hora}</p>
                  </div>
                </div>

                {selectedAppointment.Preco && (
                  <div className="flex items-start space-x-3">
                    <div className="h-5 w-5 flex items-center justify-center text-yellow-500 font-bold text-xs">$</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Valor</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">R$ {selectedAppointment.Preco.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 flex space-x-3">
                 {(selectedAppointment.Status === 'Confirmado' || selectedAppointment.Status === 'Agendado') && (
                    <>
                      <button 
                        onClick={() => {
                          handleCancel(selectedAppointment.Id);
                          closeModal();
                        }}
                        disabled={processingId === selectedAppointment.Id}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={() => {
                          handleReschedule(selectedAppointment);
                          closeModal();
                        }}
                        className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Reagendar
                      </button>
                    </>
                 )}
                 <button 
                    onClick={closeModal}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                 >
                   Fechar
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


