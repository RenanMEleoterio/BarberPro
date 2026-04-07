
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BarberSchedule from './BarberSchedule';
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

describe('BarberSchedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve exibir o serviço real quando retornado pela API', async () => {
    (apiService.getMyAppointments as any).mockResolvedValue([
      {
        id: '1',
        dataHora: '2024-01-22T10:00:00',
        status: 'Pendente',
        tipoServico: 'Corte Degradê',
        precoServico: 35.0,
        nomeCliente: 'Cliente Teste',
        telefoneCliente: '11999999999',
      },
    ]);

    render(<BarberSchedule />);

    await waitFor(() => {
      expect(screen.getByText('Corte Degradê')).toBeInTheDocument();
    });

    expect(screen.getAllByText('R$ 35.00').length).toBeGreaterThan(0);
    expect(screen.queryByText('Corte + Barba')).not.toBeInTheDocument();
  });

  it('deve exibir o valor padrão quando o serviço for nulo ou vazio', async () => {
    (apiService.getMyAppointments as any).mockResolvedValue([
      {
        id: '2',
        dataHora: '2024-01-22T11:00:00',
        status: 'Pendente',
        tipoServico: '',
        precoServico: 0,
        nomeCliente: 'Cliente Sem Servico',
      },
    ]);

    render(<BarberSchedule />);

    await waitFor(() => {
      expect(screen.getByText('Corte + Barba')).toBeInTheDocument();
    });

    expect(screen.getAllByText('R$ 0.00').length).toBeGreaterThan(0);
  });

  it('deve exibir múltiplos serviços concatenados e ação de confirmação quando aplicável', async () => {
    (apiService.getMyAppointments as any).mockResolvedValue([
      {
        id: '3',
        dataHora: '2024-01-22T14:00:00',
        status: 'Pendente',
        tipoServico: 'Corte + Barba + Sobrancelha',
        precoServico: 65.0,
        nomeCliente: 'Cliente VIP',
      },
    ]);

    render(<BarberSchedule />);

    await waitFor(() => {
      expect(screen.getByText('Corte + Barba + Sobrancelha')).toBeInTheDocument();
    });

    expect(screen.getAllByText('R$ 65.00').length).toBeGreaterThan(0);
    expect(screen.getByTitle('Confirmar Agendamento')).toBeInTheDocument();
  });
});
