import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Clock, User, ArrowLeft, Scissors, Filter } from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { apiService } from '../../services/api';

/**
 * Interface que define a estrutura de um serviço.
 */
interface Servico {
  id: number;
  nome: string;
  preco: number;
  duracaoMinutos: number;
  barbeariaId: number;
}

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
  const location = useLocation();
  
  // Dados de reagendamento vindos da navegação anterior
  const { reschedulingAppointmentId, initialBarberId } = location.state || {};
  const isRescheduling = !!reschedulingAppointmentId;

  // Estados para armazenar as seleções do usuário e os dados carregados.
  const [selectedBarber, setSelectedBarber] = useState<number | null>(initialBarberId || null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedServices, setSelectedServices] = useState<Servico[]>([]);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [filteredServicos, setFilteredServicos] = useState<Servico[]>([]);
  const [barbershop, setBarbershop] = useState<any>(null);
  const [sortOption, setSortOption] = useState<'price' | 'duration' | null>(null);

  // Estados para controlar o carregamento e erros.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  // Efeito que carrega os dados da barbearia e dos barbeiros ao montar o componente ou mudar o ID da barbearia.
  useEffect(() => {
    loadData();
  }, [barbershopId]);

  // Se vier um initialBarberId, garante que ele está setado (redundância para garantir)
  useEffect(() => {
    if (initialBarberId) {
      setSelectedBarber(initialBarberId);
    }
  }, [initialBarberId]);

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

      const barbeariaData = await apiService.getBarbeariaById(parseInt(barbershopId));
      console.log('Dados da barbearia recebidos:', barbeariaData);
      
      const barbershopWithConfig = {
        ...barbeariaData,
        workDays: barbeariaData.workDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        openTime: barbeariaData.openTime || '08:00',
        closeTime: barbeariaData.closeTime || '18:00'
      };
      
      console.log('Dados da barbearia com configurações padrão:', barbershopWithConfig);
      setBarbershop(barbershopWithConfig);

      console.log('Carregando barbeiros com horários...');
      const barbeirosData = await apiService.getBarbeirosComHorarios(parseInt(barbershopId));
      console.log('Barbeiros recebidos:', barbeirosData);
      setBarbeiros(barbeirosData);

      console.log('Carregando serviços...');
      const servicosData = await apiService.getServicosByBarbeariaId(parseInt(barbershopId));
      console.log('Serviços recebidos:', servicosData);
      // Ensure servicosData is an array
      const servicesArray = Array.isArray(servicosData) ? servicosData : [];
      setServicos(servicesArray);
      setFilteredServicos(servicesArray);
      
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Erro ao carregar dados. Tente novamente.';
      setError(message);
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

    const horarios = Array.isArray(barbeiro.horariosDisponiveis) ? barbeiro.horariosDisponiveis : [];

    return horarios
      .filter(h => {
        const [datePart] = h.dataHora.split('T');
        const matchesDate = datePart === date;
        return matchesDate && h.estaDisponivel;
      })
      .map(h => {
        const parts = h.dataHora.split('T');
        const timeRaw = parts.length > 1 ? parts[1] : '';
        const time = timeRaw.replace('Z', '').slice(0, 5);
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
    
    if (!barbershop || !barbershop.workDays) {
      return allDays;
    }
    
    const dayMapping = [
      'sunday',    // 0
      'monday',    // 1
      'tuesday',   // 2
      'wednesday', // 3
      'thursday',  // 4
      'friday',    // 5
      'saturday'   // 6
    ];
    
    let enabledWorkDays: string[] = [];
    
    if (Array.isArray(barbershop.workDays)) {
      enabledWorkDays = barbershop.workDays;
    } else if (typeof barbershop.workDays === 'string') {
      enabledWorkDays = barbershop.workDays.split(',').map((day: string) => day.trim());
    } else {
      return allDays;
    }
    
    const filteredDays = allDays.filter(day => {
      const dayOfWeek = day.getDay();
      const dayName = dayMapping[dayOfWeek];
      const isEnabled = enabledWorkDays.includes(dayName);
      return isEnabled;
    });
    
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

  const toggleService = (service: Servico) => {
    if (isRescheduling) {
      toast('Não é possível alterar serviços durante o reagendamento.', { icon: 'ℹ️' });
      return;
    }
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === service.id);
      if (isSelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  const handleSort = (option: 'price' | 'duration') => {
    setSortOption(option);
    const sorted = [...filteredServicos].sort((a, b) => {
      if (option === 'price') {
        return a.preco - b.preco;
      } else {
        return a.duracaoMinutos - b.duracaoMinutos;
      }
    });
    setFilteredServicos(sorted);
  };

  const totalPrice = selectedServices.reduce((acc, s) => acc + Number(s.preco), 0);
  const totalDuration = selectedServices.reduce((acc, s) => acc + s.duracaoMinutos, 0);

  /**
   * Lida com a submissão do agendamento.
   * Valida as seleções do usuário e envia os dados para a API para criar ou atualizar o agendamento.
   */
  const handleBooking = async () => {
    console.log("=== INICIANDO AGENDAMENTO ===");
    console.log("Estado atual:");
    console.log("selectedServices:", selectedServices);
    console.log("selectedBarber:", selectedBarber);
    console.log("selectedDate:", selectedDate);
    console.log("selectedTime:", selectedTime);
    
    if (selectedServices.length === 0) {
      toast.error("Por favor, selecione pelo menos um serviço");
      return;
    }

    if (!selectedBarber || !selectedDate || !selectedTime) {
      toast.error("Por favor, selecione todas as opções");
      return;
    }

    try {
      if (isRescheduling) {
        // Lógica de Atualização (Reagendamento)
        const updateData = {
          novaDataHora: `${selectedDate}T${selectedTime}:00`
        };
        console.log("Dados de atualização:", updateData);
        
        await apiService.updateAgendamento(parseInt(reschedulingAppointmentId), updateData);
        toast.success("Agendamento reagendado com sucesso!");
        navigate("/client/appointments");
      } else {
        // Lógica de Criação (Novo Agendamento)
        const serviceNames = selectedServices.map(s => s.nome).join(' + ');
        const agendamentoData = {
          barbeiroId: selectedBarber,
          dataHora: `${selectedDate}T${selectedTime}:00`,
          observacoes: `Duração estimada: ${totalDuration} min`,
          tipoServico: serviceNames,
          precoServico: totalPrice,
          servicoIds: selectedServices.map(s => s.id)
        };
        console.log("Dados do agendamento:", agendamentoData);

        await apiService.createAgendamento(agendamentoData);
        toast.success("Agendamento realizado com sucesso!");
        navigate("/client/appointments");
      }
    } catch (error: any) {
      console.error("Erro completo ao agendar/reagendar:", error);
      let errorMessage = isRescheduling ? "Erro ao reagendar. Tente novamente." : "Erro ao agendar. Tente novamente.";
      
      if (error.message) {
        try {
          const parsedError = JSON.parse(error.message);
          errorMessage = parsedError.message || errorMessage;
        } catch {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    }
  };

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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isRescheduling ? 'Reagendar Horário' : 'Agendar Horário'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Carregando dados...</p>
          </div>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        </div>
      </div>
    );
  }

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
          onClick={() => navigate(isRescheduling ? '/client/appointments' : '/client/barbershops')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isRescheduling ? 'Reagendar Horário' : 'Agendar Horário'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{barbershop.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Seção de Seleção de Serviços */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Scissors className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Serviços</h2>
            </div>
            <div className="relative group">
              <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <Filter className="h-4 w-4 text-gray-500" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 hidden group-hover:block border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleSort('price')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Ordenar por Preço
                </button>
                <button
                  onClick={() => handleSort('duration')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Ordenar por Duração
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {filteredServicos.length > 0 ? (
              filteredServicos.map((service) => (
                <button
                  key={service.id}
                  data-testid={`service-${service.id}`}
                  onClick={() => toggleService(service)}
                  className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                    selectedServices.some(s => s.id === service.id)
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-gray-900 dark:text-white">{service.nome}</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      R$ {Number(service.preco).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {service.duracaoMinutos} min
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 dark:text-gray-400">Nenhum serviço disponível</p>
              </div>
            )}
          </div>
          
          {selectedServices.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Total:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  R$ {totalPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Duração estimada:</span>
                <span>{totalDuration} min</span>
              </div>
            </div>
          )}
        </div>

        {/* Seção de Seleção de Barbeiro */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <User className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isRescheduling ? 'Barbeiro (Fixo)' : 'Escolha o Barbeiro'}
            </h2>
          </div>
          
          <div className="space-y-3">
            {Array.isArray(barbeiros) && barbeiros.length > 0 ? (
              barbeiros.map((barbeiro) => (
                <button
                  key={barbeiro.id}
                  onClick={() => {
                    // Se estiver reagendando, não permite trocar o barbeiro (conforme regra de negócio)
                    // A menos que queira permitir, mas o requisito diz "já abri na barbearia escolhida e o barbeiro selecionado"
                    if (!isRescheduling) {
                      console.log("Selecionando barbeiro:", barbeiro.id, barbeiro.nome);
                      setSelectedBarber(barbeiro.id);
                      setSelectedTime(''); // Limpa o horário selecionado ao trocar de barbeiro.
                    }
                  }}
                  disabled={isRescheduling && selectedBarber !== barbeiro.id} // Desabilita outros barbeiros no reagendamento
                  className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                    selectedBarber === barbeiro.id
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                      : isRescheduling 
                        ? 'border-gray-200 dark:border-gray-600 opacity-50 cursor-not-allowed'
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
      {(selectedBarber || selectedDate || selectedTime || selectedServices.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {isRescheduling ? 'Resumo do Reagendamento' : 'Resumo do Agendamento'}
          </h3>
          
          <div className="space-y-2 mb-6">
            {selectedBarber && (
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Barbeiro:</span> {barbeiros.find(b => b.id === selectedBarber)?.nome}
              </p>
            )}
            {selectedDate && (
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Data:</span>{' '}
                {(() => {
                  const [year, month, day] = selectedDate.split('-');
                  return `${day}/${month}/${year}`;
                })()}
              </p>
            )}
            {selectedTime && (
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Hora:</span> {selectedTime}
              </p>
            )}
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              <p className="text-gray-600 dark:text-gray-400 mb-1">
                <span className="font-medium">Serviços Selecionados:</span>
              </p>
              {selectedServices.length > 0 ? (
                <ul className="list-disc list-inside pl-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {selectedServices.map(service => (
                    <li key={service.id}>{service.nome}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic mb-2">Nenhum serviço selecionado</p>
              )}
              
              <div className="flex justify-between items-center mt-2 font-medium">
                <span className="text-gray-900 dark:text-white">Total Estimado:</span>
                <span data-testid="total-price" className="text-yellow-600 dark:text-yellow-400">R$ {totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                <span>Duração Total:</span>
                <span data-testid="total-duration">{totalDuration} min</span>
              </div>
            </div>
          </div>

          {/* Botão de Confirmação de Agendamento */}
          <button
            onClick={handleBooking}
            disabled={!selectedBarber || !selectedDate || !selectedTime}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRescheduling ? 'Confirmar Reagendamento' : 'Confirmar Agendamento'}
          </button>
        </div>
      )}
    </div>
  );
}


