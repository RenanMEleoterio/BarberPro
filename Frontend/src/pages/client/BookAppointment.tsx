import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, ArrowLeft } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function BookAppointment() {
  const { barbershopId } = useParams();
  const navigate = useNavigate();
  
  const [selectedBarber, setSelectedBarber] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const barbershop = {
    id: '1',
    name: 'Barbearia Central',
    barbers: [
      { id: '1', name: 'João Silva', rating: 4.9 },
      { id: '2', name: 'Carlos Santos', rating: 4.7 }
    ]
  };

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00'
  ];

  const getWeekDays = () => {
    const today = new Date();
    const startWeek = startOfWeek(today, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(startWeek, i));
  };

  const weekDays = getWeekDays();

  const handleBooking = () => {
    if (!selectedBarber || !selectedDate || !selectedTime) {
      toast.error('Por favor, selecione todas as opções');
      return;
    }

    toast.success('Agendamento realizado com sucesso!');
    navigate('/client/appointments');
  };

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
            {barbershop.barbers.map((barber) => (
              <button
                key={barber.id}
                onClick={() => setSelectedBarber(barber.id)}
                className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                  selectedBarber === barber.id
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">{barber.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">⭐ {barber.rating}</div>
              </button>
            ))}
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
                  onClick={() => setSelectedDate(dateStr)}
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
          
          <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
            {timeSlots.map((time) => {
              const isAvailable = Math.random() > 0.3; // Simulate availability
              
              return (
                <button
                  key={time}
                  onClick={() => isAvailable && setSelectedTime(time)}
                  disabled={!isAvailable}
                  className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedTime === time
                      ? 'bg-yellow-500 text-white'
                      : isAvailable
                      ? 'border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white hover:border-yellow-500'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Booking Summary */}
      {(selectedBarber || selectedDate || selectedTime) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resumo do Agendamento</h3>
          
          <div className="space-y-2 mb-6">
            {selectedBarber && (
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Barbeiro:</span> {barbershop.barbers.find(b => b.id === selectedBarber)?.name}
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