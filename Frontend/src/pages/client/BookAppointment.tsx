import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, ArrowLeft } from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { apiService } from '../../services/api';

/**
 * Interface que define a estrutura de um objeto de horário disponível.
 */
interface HorarioDisponivel {
  id: number;
  dataHora: string;
  barbeiroId: number;
  nomeBarbeiro: string;
  estaDisponivel: boolean;
}

/**
 * Interface que define a estrutura de um objeto de barbeiro, incluindo seus horários disponíveis.
 */
interface Barbeiro {
  id: number;
  nome: string;
  foto?: string;
  especialidades?: string;
  descricao?: string;
  horariosDisponiveis: HorarioDisponivel[];
}

/**
 * Componente para agendamento de horários em uma barbearia específica.
 * Permite ao cliente selecionar um barbeiro, uma data e um horário disponível.
 */
export default function BookAppointment() {
  // Hook para obter parâmetros da URL (barbershopId).
  const { barbershopId } = useParams();
  // Hook para navegação programática.
  const navigate = useNavigate();
  
  // Estados para armazenar as seleções do usuário e os dados carregados.
  const [selectedBarber, setSelectedBarber] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [barbershop, setBarbershop] = useState<any>(null);
  // Estados para controlar o carregamento e erros.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  // Efeito que carrega os dados da barbearia e dos barbeiros ao montar o componente ou mudar o ID da barbearia.
  useEffect(() => {
    loadData();
  }, [barbershopId]);

  /**
   * Carrega os dados da barbearia e dos barbeiros com seus horários disponíveis.
   * Lida com estados de carregamento e erro.
   */
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!barbershopId) {
        throw new Error('ID da barbearia não encontrado');
      }

      console.log('=== DEBUG: Carregando dados ===');
      console.log('Barbershop ID:', barbershopId);

      // Carregar dados da barbearia pelo ID.
      const barbeariaData = await apiService.getBarbeariaById(parseInt(barbershopId));
      console.log('Dados da barbearia recebidos:', barbeariaData);
      
      // Adicionar configurações padrão se não existirem nos dados da barbearia.
      const barbershopWithConfig = {
        ...barbeariaData,
        workDays: barbeariaData.workDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        openTime: barbeariaData.openTime || '08:00',
        closeTime: barbeariaData.closeTime || '18:00'
      };
      
      console.log('Dados da barbearia com configurações padrão:', barbershopWithConfig);
      setBarbershop(barbershopWithConfig);

      // Carregar barbeiros com horários disponíveis.
      console.log('Carregando barbeiros com horários...');
      const barbeirosData = await apiService.getBarbeirosComHorarios();
      console.log('Barbeiros recebidos:', barbeirosData);
      setBarbeiros(barbeirosData);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Retorna os horários disponíveis para um barbeiro específico em uma determinada data.
   * @param {number} barbeiroId - O ID do barbeiro.
   * @param {string} date - A data selecionada no formato 'YYYY-MM-DD'.
   * @returns {Array<{time: string, horarioId: number}>} - Uma lista de objetos com horário e ID do horário.
   */
  const getAvailableTimesForDate = (barbeiroId: number, date: string) => {
    const barbeiro = barbeiros.find(b => b.id === barbeiroId);
    if (!barbeiro) return [];

    console.log(`=== DEBUG: getAvailableTimesForDate ===`);
    console.log(`Barbeiro ID: ${barbeiroId}, Data selecionada: ${date}`);
    console.log(`Horários disponíveis do barbeiro:`, barbeiro.horariosDisponiveis);

    return barbeiro.horariosDisponiveis
      .filter(h => {
        const [datePart] = h.dataHora.split('T');
        const matchesDate = datePart === date;
        console.log(
          `Comparando: horário ${h.dataHora} -> data ${datePart} com data selecionada ${date}, disponível: ${h.estaDisponivel}`,
        );
        return matchesDate && h.estaDisponivel;
      })
      .map(h => {
        const parts = h.dataHora.split('T');
        const timeRaw = parts.length > 1 ? parts[1] : '';
        const time = timeRaw.replace('Z', '').slice(0, 5);

        console.log(`Horário mapeado (string bruta): ${h.dataHora} -> ${time}`);

        return { time, horarioId: h.id };
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  /**
   * Retorna uma lista dos dias da semana, filtrando pelos dias de funcionamento da barbearia.
   * @returns {Date[]} - Uma lista de objetos Date representando os dias da semana em que a barbearia funciona.
   */
  const getWeekDays = () => {
    const today = new Date();
    const baseDate = addWeeks(today, weekOffset);
    const startWeek = startOfWeek(baseDate, { weekStartsOn: 1 });
    const allDays = Array.from({ length: 7 }, (_, i) => addDays(startWeek, i));
    
    // Se os dados da barbearia ou os dias de trabalho não estiverem disponíveis, retorna todos os dias.
    if (!barbershop || !barbershop.workDays) {
      console.log('DEBUG: Sem dados da barbearia ou workDays, retornando todos os dias');
      return allDays;
    }
    
    // Mapeamento dos nomes dos dias da semana para os IDs numéricos (0=domingo, 1=segunda, etc.).
    const dayMapping = [
      'sunday',    // 0
      'monday',    // 1
      'tuesday',   // 2
      'wednesday', // 3
      'thursday',  // 4
      'friday',    // 5
      'saturday'   // 6
    ];
    
    // Processa os dias de trabalho da barbearia, que podem ser um array ou uma string separada por vírgulas.
    let enabledWorkDays: string[] = [];
    
    if (Array.isArray(barbershop.workDays)) {
      enabledWorkDays = barbershop.workDays;
    } else if (typeof barbershop.workDays === 'string') {
      enabledWorkDays = barbershop.workDays.split(',').map((day: string) => day.trim());
    } else {
      console.log('DEBUG: workDays em formato não reconhecido:', barbershop.workDays);
      return allDays; // Fallback para todos os dias se o formato for desconhecido.
    }
    
    console.log('DEBUG: workDays processados:', enabledWorkDays);

    // Filtra os dias da semana, mantendo apenas aqueles em que a barbearia funciona.
    const filteredDays = allDays.filter(day => {
      const dayOfWeek = day.getDay(); // Obtém o dia da semana (0 para domingo, 1 para segunda, etc.).
      const dayName = dayMapping[dayOfWeek]; // Converte o número do dia para o nome.
      const isEnabled = enabledWorkDays.includes(dayName); // Verifica se o dia está habilitado.
      
      console.log(`DEBUG: Dia ${dayName} (${dayOfWeek}) - Habilitado: ${isEnabled}`);
      
      return isEnabled;
    });
    
    console.log('DEBUG: Dias filtrados:', filteredDays.map(d => dayMapping[d.getDay()]));
    
    return filteredDays;
  };

  const weekDays = getWeekDays();
  const weekStartDate = weekDays.length > 0 ? weekDays[0] : null;
  const weekEndDate = weekDays.length > 0 ? weekDays[weekDays.length - 1] : null;
  const weekLabel =
    weekStartDate && weekEndDate
      ? `${format(weekStartDate, 'dd/MM', { locale: ptBR })} - ${format(weekEndDate, 'dd/MM', {
          locale: ptBR,
        })}`
      : '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = format(today, 'yyyy-MM-dd');

  const changeWeek = (delta: number) => {
    setWeekOffset((prev) => {
      const next = prev + delta;
      if (next < 0) {
        return 0;
      }
      return next;
    });
    setSelectedDate('');
    setSelectedTime('');
  };

  /**
   * Lida com a submissão do agendamento.
   * Valida as seleções do usuário e envia os dados para a API para criar o agendamento.
   * Exibe mensagens de sucesso ou erro e redireciona o usuário após o agendamento.
   */
  const handleBooking = async () => {
    console.log("=== INICIANDO AGENDAMENTO ===");
    console.log("Estado atual:");
    console.log("selectedBarber:", selectedBarber);
    console.log("selectedDate:", selectedDate);
    console.log("selectedTime:", selectedTime);
    
    // Validação para garantir que todos os campos obrigatórios foram selecionados.
    if (!selectedBarber || !selectedDate || !selectedTime) {
      console.log("Validação falhou - campos obrigatórios não preenchidos");
      toast.error("Por favor, selecione todas as opções");
      return;
    }

    try {
      // Prepara os dados do agendamento para enviar à API.
      const agendamentoData = {
        barbeiroId: selectedBarber,
        dataHora: `${selectedDate}T${selectedTime}:00`, // Combina data e hora para formar um timestamp ISO.
        observacoes: "", // Observações vazias por enquanto.
        tipoServico: "Corte de Cabelo" // Tipo de serviço padrão por enquanto.
      };

      console.log("Dados do agendamento sendo enviados:", agendamentoData);

      // Chama o serviço de API para criar o agendamento.
      await apiService.createAgendamento(agendamentoData);
      toast.success("Agendamento realizado com sucesso!"); // Exibe mensagem de sucesso.
      navigate("/client/appointments"); // Redireciona para a página de agendamentos do cliente.
    } catch (error: any) {
      console.error("Erro completo ao agendar:", error);
      console.error("Response data:", error.response?.data);
      console.error("Status:", error.response?.status);
      
      // Tenta extrair uma mensagem de erro mais específica do backend.
      let errorMessage = "Erro ao agendar. Tente novamente.";
      
      if (error.message) {
        try {
          const parsedError = JSON.parse(error.message);
          errorMessage = parsedError.message || errorMessage;
        } catch {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage); // Exibe a mensagem de erro.
    }
  };

  // Exibe um spinner de carregamento enquanto os dados iniciais estão sendo buscados.
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/client/barbershops')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agendar Horário</h1>
            <p className="text-gray-600 dark:text-gray-400">Carregando dados...</p>
          </div>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        </div>
      </div>
    );
  }

  // Exibe uma mensagem de erro se a barbearia não for encontrada ou houver outro erro.
  if (error || !barbershop) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/client/barbershops')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agendar Horário</h1>
            <p className="text-red-600 dark:text-red-400">{error || 'Barbearia não encontrada'}</p>
          </div>
        </div>
        <button 
          onClick={loadData}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cabeçalho da página com botão de voltar */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/client/barbershops')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agendar Horário</h1>
          <p className="text-gray-600 dark:text-gray-400">{barbershop.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Seção de Seleção de Barbeiro */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <User className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Escolha o Barbeiro</h2>
          </div>
          
          <div className="space-y-3">
            {barbeiros && barbeiros.length > 0 ? (
              barbeiros.map((barbeiro) => (
                <button
                  key={barbeiro.id}
                  onClick={() => {
                    console.log("Selecionando barbeiro:", barbeiro.id, barbeiro.nome);
                    setSelectedBarber(barbeiro.id);
                    setSelectedTime(''); // Limpa o horário selecionado ao trocar de barbeiro.
                  }}
                  className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                    selectedBarber === barbeiro.id
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">{barbeiro.nome}</div>
                  {barbeiro.especialidades && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">{barbeiro.especialidades}</div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {barbeiro.horariosDisponiveis.length} horários disponíveis
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 dark:text-gray-400">Nenhum barbeiro disponível</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Escolha o Dia</h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => changeWeek(-1)}
                disabled={weekOffset === 0}
                className="px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Semana anterior
              </button>
              <button
                onClick={() => changeWeek(1)}
                className="px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
              >
                Próxima semana
              </button>
            </div>
          </div>
          {weekLabel && (
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Semana: {weekLabel}
            </div>
          )}
          <div className="space-y-2">
            {weekDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isToday = dateStr === todayStr;
              const isPastDay = day < today;
              let buttonClasses = 'w-full p-3 rounded-lg border-2 transition-colors text-left ';
              if (isPastDay) {
                buttonClasses += 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 opacity-60 cursor-not-allowed';
              } else if (selectedDate === dateStr) {
                buttonClasses += 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
              } else {
                buttonClasses += 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500';
              }
              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    if (isPastDay) {
                      return;
                    }
                    console.log("Selecionando data:", dateStr);
                    setSelectedDate(dateStr);
                  }}
                  disabled={isPastDay}
                  className={buttonClasses}
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {format(day, 'EEEE', { locale: ptBR })}
                    {isToday && <span className="text-yellow-500 ml-2">(Hoje)</span>}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {format(day, 'dd/MM', { locale: ptBR })}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Seção de Seleção de Horário */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Escolha o Horário</h2>
          </div>
          
          {!selectedBarber || !selectedDate ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400 text-center">
                Selecione um barbeiro e uma data primeiro
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {getAvailableTimesForDate(selectedBarber, selectedDate).map(({ time, horarioId }) => (
                  <button
                    key={horarioId}
                    onClick={() => {
                      console.log("Selecionando horário:", time);
                      setSelectedTime(time);
                    }}
                    className={`w-full p-3 rounded-lg border-2 text-sm font-medium text-center transition-colors ${
                      selectedTime === time
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-gray-900 dark:text-white'
                        : 'border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white hover:border-yellow-500'
                    }`}
                  >
                    {time}
                  </button>
                ))}
                {getAvailableTimesForDate(selectedBarber, selectedDate).length === 0 && (
                  <div className="col-span-2 text-center py-4">
                    <p className="text-gray-500 dark:text-gray-400">
                      Nenhum horário disponível para esta data
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resumo do Agendamento */}
      {(selectedBarber || selectedDate || selectedTime) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resumo do Agendamento</h3>
          
          <div className="space-y-2 mb-6">
            {selectedBarber && (
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Barbeiro:</span> {barbeiros.find(b => b.id === selectedBarber)?.nome}
              </p>
            )}
            {selectedDate && (
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Data:</span> {new Date(selectedDate).toLocaleDateString('pt-BR')}
              </p>
            )}
            {selectedTime && (
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Hora:</span> {selectedTime}
              </p>
            )}
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium">Serviço:</span> Corte de Cabelo (Padrão)
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium">Preço Estimado:</span> R$ 45,00 (Padrão)
            </p>
          </div>

          {/* Botão de Confirmação de Agendamento */}
          <button
            onClick={handleBooking}
            disabled={!selectedBarber || !selectedDate || !selectedTime}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar Agendamento
          </button>
        </div>
      )}
    </div>
  );
}


