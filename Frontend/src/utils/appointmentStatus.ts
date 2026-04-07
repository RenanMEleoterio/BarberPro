const COMPLETED_STATUSES = ['realizado', 'concluido', 'concluído', 'atendido'];

function normalizeStatus(status?: string): string {
  return (status ?? '').trim();
}

export function isCompletedAppointmentStatus(status?: string): boolean {
  return COMPLETED_STATUSES.includes(normalizeStatus(status).toLowerCase());
}

export function isConfirmedAppointmentStatus(status?: string): boolean {
  return normalizeStatus(status) === 'Confirmado';
}

export function getAppointmentStatusBadgeClass(status?: string): string {
  switch (normalizeStatus(status)) {
    case 'Confirmado':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'Pendente':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'Realizado':
    case 'Concluído':
    case 'Atendido':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'Cancelado':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
}

export function getBarberScheduleStatusBadgeClass(status?: string): string {
  switch (normalizeStatus(status)) {
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
}

export function mapAppointmentStatusToFrontend(status?: string): string {
  switch (normalizeStatus(status).toLowerCase()) {
    case 'pendente':
      return 'pending';
    case 'atendido':
    case 'confirmado':
    case 'realizado':
      return 'attended';
    case 'cancelado':
      return 'cancelled';
    case 'expirado':
      return 'expired';
    default:
      return 'pending';
  }
}
