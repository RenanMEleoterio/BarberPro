import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, ArrowLeft } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { apiService } from '../../services/api';

interface HorarioDisponivel {
  id: number;
  dataHora: string;
  barbeiroId: number;
  nomeBarbeiro: string;
  estaDisponivel: boolean;
}

interface Barbeiro {
  id: number;
  nome: string;
  foto?: string;
  especialidades?: string;
  descricao?: string;
  horariosDisponiveis: HorarioDisponivel[];
}

export default function BookAppointment() {
  const { barbershopId } = useParams();
  const navigate = useNavigate();
  
  const [selectedBarber, setSelectedBarber] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [barbershop, setBarbershop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [barbershopId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!barbershopId) {
        throw new Error('ID da barbearia não encontrado');
      }

      // Carregar dados da barbearia
      const barbeariaData = await apiService.getBarbeariaById(parseInt(barbershopId));
      
      // Adicionar configurações padrão se não existirem
      const barbershopWithConfig = {
        ...barbeariaData,
        workDays: barbeariaData.workDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        openTime: barbeariaData.openTime || '08:00',
        closeTime: barbeariaData.closeTime || '18:00'
      };
      
      setBarbershop(barbershopWithConfig);

      // Carregar barbeiros com horários disponíveis
      const barbeirosData = await apiService.getBarbeirosComHorarios();
      setBarbeiros(barbeirosData);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableTimesForDate = (barbeiroId: number, date: string) => {
    const barbeiro = barbeiros.find(b => b.id === barbeiroId);
    if (!barbeiro) return [];

    return barbeiro.horariosDisponiveis
      .filter(h => {
        // Garante que a data do horário disponível corresponde à data selecionada
        const horarioDate = format(new Date(h.dataHora), 'yyyy-MM-dd');
        return horarioDate === date && h.estaDisponivel;
      })
      .map(h => {
        // Extrai a hora e minuto diretamente da string ISO para evitar problemas de fuso horário
        const time = format(new Date(h.dataHora), 'HH:mm');
        return { time, horarioId: h.id };
      })
      .sort((a, b) => a.time.localeCompare(b.time)); // Ordena os horários cronologicamente
  };

  const getWeekDays = () => {
    const today = new Date();
    const startWeek = startOfWeek(today, { weekStartsOn: 1 });
    const allDays = Array.from({ length: 7 }, (_, i) => addDays(startWeek, i));
    
    // Se não temos dados da barbearia ainda, retorna todos os dias
    if (!barbershop || !barbershop.workDays) {
      return allDays;
    }
    
    // Mapear os dias da semana para os IDs usados no frontend
    const dayMapping = [
      'sunday',    // 0
      'monday',    // 1
      'tuesday',   // 2
      'wednesday', // 3
      'thursday',  // 4
      'friday',    // 5
      'saturday'   // 6
    ];
    
    const enabledWorkDays = barbershop.workDays.split(',').map((day: string) => day.trim());

    // Filtrar apenas os dias que a barbearia funciona
    return allDays.filter(day => {
      const dayOfWeek = day.getDay(); // 0 for Sunday, 1 for Monday, etc.
      const dayName = dayMapping[dayOfWeek];
      return enabledWorkDays.includes(dayName);
    });
  };

  const weekDays = getWeekDays();

  const handleBooking = async () => {
    console.log("=== INICIANDO AGENDAMENTO ===");
    console.log("Estado atual:");
    console.log("selectedBarber:", selectedBarber);
    console.log("selectedDate:", selectedDate);
    console.log("selectedTime:", selectedTime);
    
    if (!selectedBarber || !selectedDate || !selectedTime) {
      console.log("Validação falhou - campos obrigatórios não preenchidos");
      toast.error("Por favor, selecione todas as opções");
      return;
    }

    try {
      const agendamentoData = {
        barbeiroId: selectedBarber,
        dataHora: `${selectedDate}T${selectedTime}:00`,
        observacoes: "",
        tipoServico: "Corte de Cabelo" // Valor padrão por enquanto
      };

      console.log("Dados do agendamento sendo enviados:", agendamentoData);

      await apiService.createAgendamento(agendamentoData);
      toast.success("Agendamento realizado com sucesso!");
      navigate("/client/appointments");
    } catch (error: any) {
      console.error("Erro completo ao agendar:", error);
      console.error("Response data:", error.response?.data);
      console.error("Status:", error.response?.status);
      
      // Tentar extrair mensagem de erro mais específica
      let errorMessage = "Erro ao agendar. Tente novamente.";
      
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
      {/* Header */}
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
        {/* Barber Selection */}
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
                    setSelectedTime(''); // Limpar horário selecionado ao trocar barbeiro
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

        {/* Date Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Escolha o Dia</h2>
          </div>
          
          <div className="space-y-2">
            {weekDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              
              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    console.log("Selecionando data:", dateStr);
                    setSelectedDate(dateStr);
                  }}
                  className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                    selectedDate === dateStr
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
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

        {/* Time Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Escolha o Horário</h2>
          </div>
          
          {!selectedBarber || !selectedDate ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                Selecione um barbeiro e uma data primeiro
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
              {getAvailableTimesForDate(selectedBarber, selectedDate).map(({ time, horarioId }) => (
                <button
                  key={horarioId}
                  onClick={() => {
                    console.log("Selecionando horário:", time);
                    setSelectedTime(time);
                  }}
                  className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedTime === time
                      ? 'bg-yellow-500 text-white'
                      : 'border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white hover:border-yellow-500'
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
          )}
        </div>
      </div>

      {/* Booking Summary */}
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
                <span className="font-medium">Data:</span> {format(new Date(selectedDate), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            )}
            {selectedTime && (
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Horário:</span> {selectedTime}
              </p>
            )}
          </div>

          <button
            onClick={handleBooking}
            disabled={!selectedBarber || !selectedDate || !selectedTime}
            className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Confirmar Agendamento
          </button>
        </div>
      )}
    </div>
  );
}