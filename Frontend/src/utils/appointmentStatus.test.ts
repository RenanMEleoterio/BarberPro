import { describe, expect, it } from 'vitest';
import {
  getBarberScheduleStatusBadgeClass,
  getAppointmentStatusBadgeClass,
  isCompletedAppointmentStatus,
  isConfirmedAppointmentStatus,
  mapAppointmentStatusToFrontend,
} from './appointmentStatus';

describe('appointmentStatus', () => {
  it('deve identificar status concluídos equivalentes', () => {
    expect(isCompletedAppointmentStatus('Realizado')).toBe(true);
    expect(isCompletedAppointmentStatus('Concluído')).toBe(true);
    expect(isCompletedAppointmentStatus('Atendido')).toBe(true);
    expect(isCompletedAppointmentStatus('Pendente')).toBe(false);
  });

  it('deve identificar o status confirmado usado nas ações do dashboard', () => {
    expect(isConfirmedAppointmentStatus('Confirmado')).toBe(true);
    expect(isConfirmedAppointmentStatus('Pendente')).toBe(false);
  });

  it('deve mapear o status do backend para o status usado no frontend legado', () => {
    expect(mapAppointmentStatusToFrontend('Pendente')).toBe('pending');
    expect(mapAppointmentStatusToFrontend('Realizado')).toBe('attended');
    expect(mapAppointmentStatusToFrontend('Expirado')).toBe('expired');
  });

  it('deve retornar classes consistentes para o badge visual', () => {
    expect(getAppointmentStatusBadgeClass('Confirmado')).toContain('bg-blue-100');
    expect(getAppointmentStatusBadgeClass('Pendente')).toContain('bg-yellow-100');
    expect(getAppointmentStatusBadgeClass('Cancelado')).toContain('bg-red-100');
    expect(getBarberScheduleStatusBadgeClass('Confirmado')).toContain('bg-green-100');
    expect(getBarberScheduleStatusBadgeClass('Realizado')).toContain('bg-blue-100');
  });
});
