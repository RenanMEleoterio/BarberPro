
import React from 'react';
import { Calendar, Clock, CheckCircle } from 'lucide-react';
import { getAppointmentStatusBadgeClass, isConfirmedAppointmentStatus } from '../../../utils/appointmentStatus';
import { toBrazilTimeValue } from '../../../utils/brazilDateTime';

interface Appointment {
  id: number;
  nomeCliente: string;
  dataHora: string;
  status: string;
}

interface AppointmentsListProps {
  appointments: Appointment[];
  loading?: boolean;
  onMarkAsDone?: (id: number) => void;
}

export const AppointmentsList: React.FC<AppointmentsListProps> = ({ appointments, loading, onMarkAsDone }) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                </div>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-full">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Agendamentos de Hoje</h2>
      </div>
      <div className="p-6">
        {appointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Nenhum agendamento para hoje</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Aproveite o tempo livre ou prepare-se para amanhã!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors group">
                <div className="flex items-center space-x-4">
                  <div className="bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded-lg group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/40 transition-colors">
                    <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{appointment.nomeCliente}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {toBrazilTimeValue(appointment.dataHora)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getAppointmentStatusBadgeClass(appointment.status)}`}>
                    {appointment.status}
                  </span>
                  {isConfirmedAppointmentStatus(appointment.status) && onMarkAsDone && (
                    <button 
                      onClick={() => onMarkAsDone(appointment.id)}
                      className="bg-green-500 hover:bg-green-600 text-white p-1.5 rounded-lg transition-colors shadow-sm"
                      title="Marcar como Feito"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
