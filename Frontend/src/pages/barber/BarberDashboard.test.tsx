
import { render, screen, waitFor } from '@testing-library/react';
import { format } from 'date-fns';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BarberDashboard from './BarberDashboard';
import { apiService } from '../../services/api';

vi.mock('../../services/api', () => ({
  apiService: {
    getMyAppointments: vi.fn(),
    updateAppointmentStatus: vi.fn(),
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', nome: 'Barbeiro Teste', role: 'barber' },
  }),
}));

describe('BarberDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve exibir os contadores corretamente quando houver agendamentos no período', async () => {
    const hoje = format(new Date(), 'yyyy-MM-dd');

    (apiService.getMyAppointments as any).mockResolvedValue([
      {
        id: 1,
        dataHora: `${hoje}T09:00:00`,
        status: 'Realizado',
        precoServico: 50,
        nomeCliente: 'Cliente 1',
      },
      {
        id: 2,
        dataHora: `${hoje}T11:00:00`,
        status: 'Pendente',
        precoServico: 45,
        nomeCliente: 'Cliente 2',
      },
    ]);

    render(<BarberDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Cliente 1')).toBeInTheDocument();
    });

    expect(screen.getByText('Agendamentos Hoje')).toBeInTheDocument();
    expect(screen.getByText('Concluídos Hoje')).toBeInTheDocument();
    expect(screen.getByText('Total na Semana')).toBeInTheDocument();
    expect(screen.getByText('Ganhos da Semana')).toBeInTheDocument();
    expect(screen.getByText('R$ 50.00')).toBeInTheDocument();
    expect(screen.getByText('Cliente 1')).toBeInTheDocument();
    expect(screen.getByText('Cliente 2')).toBeInTheDocument();
  });

  it('deve lidar com lista vazia de agendamentos', async () => {
    (apiService.getMyAppointments as any).mockResolvedValue([]);

    render(<BarberDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Agendamentos Hoje')).toBeInTheDocument();
    });

    expect(screen.getByText('R$ 0.00')).toBeInTheDocument();
    expect(screen.getByText('Nenhum agendamento para hoje')).toBeInTheDocument();
  });

  it('deve montar fallback com zeros quando a API falhar', async () => {
    (apiService.getMyAppointments as any).mockRejectedValue(new Error('Falha'));

    render(<BarberDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Ganhos da Semana')).toBeInTheDocument();
    });

    expect(screen.getByText('R$ 0.00')).toBeInTheDocument();
  });
});
