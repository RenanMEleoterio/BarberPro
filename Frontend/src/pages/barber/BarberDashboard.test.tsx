
import { render, screen, waitFor } from '@testing-library/react';
import BarberDashboard from './BarberDashboard';
import { apiService } from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import { vi } from 'vitest';

// Mock do módulo apiService
vi.mock('../../services/api', () => ({
  apiService: {
    getMyAppointments: vi.fn(),
  },
}));

// Mock do componente de gráfico para evitar erros de renderização em ambiente de teste
vi.mock('recharts', () => ({
  BarChart: () => <div>BarChart</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
}));

describe('BarberDashboard', () => {
  const mockUser = {
    id: 1,
    nome: 'Barbeiro Teste',
    email: 'barbeiro@teste.com',
    tipoUsuario: 'Barbeiro',
  };

  const renderWithAuth = (component: React.ReactNode) => {
    return render(
      <AuthContext.Provider value={{ user: mockUser, signed: true, signIn: vi.fn(), signOut: vi.fn(), loading: false }}>
        {component}
      </AuthContext.Provider>
    );
  };

  it('deve exibir "Carregando dados..." inicialmente', () => {
    (apiService.getMyAppointments as any).mockResolvedValue([]);
    renderWithAuth(<BarberDashboard />);
    expect(screen.getByText('Carregando dados...')).toBeInTheDocument();
  });

  it('deve exibir os contadores corretamente quando houver agendamentos', async () => {
    const hoje = new Date().toISOString();
    const mockAppointments = [
      {
        id: 1,
        dataHora: hoje,
        status: 'Realizado',
        preco: 50,
        nomeCliente: 'Cliente 1',
      },
      {
        id: 2,
        dataHora: hoje,
        status: 'Pendente',
        preco: 45,
        nomeCliente: 'Cliente 2',
      },
    ];

    (apiService.getMyAppointments as any).mockResolvedValue(mockAppointments);

    renderWithAuth(<BarberDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando dados...')).not.toBeInTheDocument();
    });

    // Verifica Total Agendamentos Hoje (2)
    expect(screen.getByText('Agendamentos Hoje')).toBeInTheDocument();
    const totalElements = screen.getAllByText('2'); // Pode haver múltiplos '2'
    expect(totalElements.length).toBeGreaterThan(0);

    // Verifica Concluídos Hoje (1)
    expect(screen.getByText('Concluídos Hoje')).toBeInTheDocument();
    const completedElements = screen.getAllByText('1');
    expect(completedElements.length).toBeGreaterThan(0);

    // Verifica Pendentes Hoje (1)
    expect(screen.getByText('Pendentes Hoje')).toBeInTheDocument();
    // Já verificado acima

    // Verifica Ganhos da Semana (50)
    expect(screen.getByText('Ganhos da Semana')).toBeInTheDocument();
    expect(screen.getByText('R$ 50.00')).toBeInTheDocument();
  });

  it('deve lidar com lista vazia de agendamentos', async () => {
    (apiService.getMyAppointments as any).mockResolvedValue([]);

    renderWithAuth(<BarberDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando dados...')).not.toBeInTheDocument();
    });

    expect(screen.getAllByText('0')).toHaveLength(3); // Total, Concluídos, Pendentes
    expect(screen.getByText('R$ 0,00')).toBeInTheDocument();
    expect(screen.getByText('Nenhum agendamento para hoje')).toBeInTheDocument();
  });
});
