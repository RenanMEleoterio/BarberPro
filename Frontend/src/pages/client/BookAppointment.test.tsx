import React from 'react';
import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import BookAppointment from './BookAppointment';
import { apiService } from '../../services/api';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useParams: () => ({ barbershopId: '1' }),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ state: {} }),
}));

vi.mock('../../services/api', () => ({
  apiService: {
    getBarbeariaById: vi.fn(),
    getBarbeirosComHorarios: vi.fn(),
    getServicosByBarbeariaId: vi.fn(),
    createAgendamento: vi.fn(),
    updateAgendamento: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('BookAppointment Component', () => {
  const mockBarbearia = {
    id: 1,
    name: 'Barbearia Teste',
    workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    openTime: '09:00',
    closeTime: '18:00',
  };

  const mockBarbeiros = [
    {
      id: 101,
      nome: 'João Barbeiro',
      horariosDisponiveis: [
        { id: 1, dataHora: '2024-01-22T10:00:00', estaDisponivel: true },
        { id: 2, dataHora: '2024-01-22T11:00:00', estaDisponivel: true },
      ],
    },
  ];

  const mockServicos = [
    { id: 1, nome: 'Corte Simples', preco: 30.00, duracaoMinutos: 30, barbeariaId: 1 },
    { id: 2, nome: 'Barba', preco: 20.00, duracaoMinutos: 20, barbeariaId: 1 },
    { id: 3, nome: 'Corte + Barba', preco: 45.00, duracaoMinutos: 50, barbeariaId: 1 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (apiService.getBarbeariaById as any).mockResolvedValue(mockBarbearia);
    (apiService.getBarbeirosComHorarios as any).mockResolvedValue(mockBarbeiros);
    (apiService.getServicosByBarbeariaId as any).mockResolvedValue(mockServicos);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deve carregar e exibir a lista de serviços corretamente', async () => {
    render(<BookAppointment />);

    await waitForElementToBeRemoved(() => screen.queryByText('Carregando dados...'));

    await waitFor(() => {
      expect(screen.getByText('Corte Simples')).toBeInTheDocument();
      expect(screen.getByText('Barba')).toBeInTheDocument();
      expect(screen.getByText('Corte + Barba')).toBeInTheDocument();
    });

    expect(screen.getByText('R$ 30.00')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
  });

  it('deve calcular o preço e duração total ao selecionar múltiplos serviços', async () => {
    render(<BookAppointment />);

    await waitForElementToBeRemoved(() => screen.queryByText('Carregando dados...'));
    await waitFor(() => screen.getByText('Corte Simples'));

    // Selecionar serviços
    fireEvent.click(screen.getByTestId('service-1')); // Corte de Cabelo
    
    // Verificar totais parciais
    await waitFor(() => {
        const totalElement = screen.getByTestId('total-price');
        expect(totalElement.textContent).toContain('30.00');
    });

    fireEvent.click(screen.getByTestId('service-2')); // Barba

    // Verificar novos totais (50.00, 50 min)
    await waitFor(() => {
        const totalElement = screen.getByTestId('total-price');
        expect(totalElement.textContent).toContain('50.00');
        
        const durationElement = screen.getByTestId('total-duration');
        expect(durationElement.textContent).toContain('50 min');
    });

    // Remover um serviço
    fireEvent.click(screen.getByTestId('service-1')); // Remove Corte de Cabelo
    
    // Wait for button to be deselected
    await waitFor(() => {
        expect(screen.getByTestId('service-1')).not.toHaveClass('border-yellow-500');
    });
    
    // Verificar totais atualizados (20.00, 20 min)
    await waitFor(() => {
        const totalElement = screen.getByTestId('total-price');
        expect(totalElement.textContent).toContain('20.00');
        expect(screen.getByTestId('total-duration').textContent).toContain('20 min');
    });
  });

  it('deve validar que pelo menos um serviço foi selecionado antes de agendar', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2024, 0, 22)); // 22 Jan 2024 (Segunda)
    
    render(<BookAppointment />);

    await waitForElementToBeRemoved(() => screen.queryByText('Carregando dados...'));
    await waitFor(() => screen.getByText('João Barbeiro'));
 
    fireEvent.click(screen.getByText('João Barbeiro'));
    
    // Selecionar Data (22/01)
    const dateText = screen.getByText('22/01');
    const dateButton = dateText.closest('button');
    expect(dateButton).not.toBeDisabled();
    if (dateButton) fireEvent.click(dateButton);
    
    // Selecionar Horário
    await waitFor(() => screen.getByText('10:00'));
    fireEvent.click(screen.getByText('10:00'));
    
    // Botão de Confirmar
    const confirmButton = screen.getByText('Confirmar Agendamento');
    expect(confirmButton).not.toBeDisabled();
    
    // Clicar sem selecionar serviços
    fireEvent.click(confirmButton);
    
    const toast = await import('react-hot-toast');
    expect(toast.default.error).toHaveBeenCalledWith('Por favor, selecione pelo menos um serviço');
    
    vi.useRealTimers();
  });

  it('deve enviar os dados corretos para a API ao agendar', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2024, 0, 22));
    
    render(<BookAppointment />);

    await waitForElementToBeRemoved(() => screen.queryByText('Carregando dados...'));
    await waitFor(() => screen.getByText('Corte Simples'));

    // Selecionar Serviços
    fireEvent.click(screen.getByTestId('service-1')); // 30.00
    fireEvent.click(screen.getByTestId('service-2')); // 20.00
    
    // Selecionar Barbeiro
    fireEvent.click(screen.getByText('João Barbeiro'));
    
    const dateText = screen.getByText('22/01');
    const dateButton = dateText.closest('button');
    if (dateButton) fireEvent.click(dateButton);
    
    await waitFor(() => screen.getByText('10:00'));
    fireEvent.click(screen.getByText('10:00'));
    
    // Confirmar
    fireEvent.click(screen.getByText('Confirmar Agendamento'));
    
    await waitFor(() => {
      expect(apiService.createAgendamento).toHaveBeenCalledWith({
        barbeiroId: 101,
        dataHora: '2024-01-22T10:00:00',
        observacoes: 'Duração estimada: 50 min',
        tipoServico: 'Corte Simples + Barba',
        precoServico: 50.00,
        servicoIds: [1, 2]
      });
    });
    
    vi.useRealTimers();
  });
});
