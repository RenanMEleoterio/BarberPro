import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ManagerBarber, ManagerStatsData } from '../../../services/api/adapters';
import {
  ManagerBarbersListSection,
  ManagerBarbersSummaryCards,
} from './ManagerBarbersSections';
import {
  ManagerStatsDetailsPanels,
  ManagerStatsInsightPanels,
  ManagerStatsSummaryCards,
} from './ManagerStatsSections';

const statsFixture: ManagerStatsData = {
  totalRevenue: 5400,
  totalClients: 27,
  totalAppointments: 44,
  averageRating: 4.7,
  monthlyGrowth: 0,
  barbersCount: 0,
  activeBarbers: 0,
  topBarbers: [{ name: 'Sandro', revenue: 3000, clients: 12, rating: 4.8 }],
  monthlyData: [{ month: 'Abr', revenue: 5400, appointments: 44 }],
  serviceStats: [{ service: 'Corte', count: 20, revenue: 1000, percentage: 55 }],
  metaMensal: { receita: 20000, progresso: 27 },
  eficiencia: { tempoMedioCorte: 25, tempoMedioBarba: 15, tempoMedioCompleto: 40 },
  satisfacao: { excelente: 78, bom: 18, regular: 4 },
};

const barberFixture: ManagerBarber = {
  id: '10',
  name: 'Diego',
  email: 'diego@barberpro.com',
  phone: '11999999999',
  specialties: ['corte', 'barba'],
  rating: 4.9,
  totalClients: 15,
  monthlyRevenue: 3200,
  status: 'active',
  joinDate: '2026-01-10T12:00:00Z',
};

describe('manager sections', () => {
  it('renderiza os blocos principais de estatisticas com os dados normalizados', () => {
    render(
      <>
        <ManagerStatsSummaryCards stats={statsFixture} />
        <ManagerStatsDetailsPanels stats={statsFixture} />
        <ManagerStatsInsightPanels stats={statsFixture} />
      </>
    );

    expect(screen.getByText('Receita Total')).toBeInTheDocument();
    expect(screen.getByText('Performance Mensal')).toBeInTheDocument();
    expect(screen.getByText('Top Barbeiros')).toBeInTheDocument();
    expect(screen.getByText('Serviços Populares')).toBeInTheDocument();
    expect(screen.getByText('Meta Mensal')).toBeInTheDocument();
    expect(screen.getByText('Métricas de Eficiência')).toBeInTheDocument();
    expect(screen.getByText('Sandro')).toBeInTheDocument();
    expect(screen.getByText('Corte')).toBeInTheDocument();
    expect(screen.getByText('27.0%')).toBeInTheDocument();
  });

  it('renderiza a lista de barbeiros com data formatada em pt-BR', () => {
    render(
      <>
        <ManagerBarbersSummaryCards
          stats={{
            totalBarbeiros: 1,
            barbeirosAtivos: 1,
            receitaTotal: 3200,
            avaliacaoMedia: 4.9,
          }}
        />
        <ManagerBarbersListSection barbers={[barberFixture]} searchTerm="" />
      </>
    );

    expect(screen.getByText('Lista de Barbeiros')).toBeInTheDocument();
    expect(screen.getByText('Diego')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.getByText('Desde 10/01/2026')).toBeInTheDocument();
  });

  it('mantem a mensagem vazia quando nao ha barbeiros cadastrados', () => {
    render(<ManagerBarbersListSection barbers={[]} searchTerm="" />);

    expect(screen.getByText('Nenhum barbeiro cadastrado na barbearia.')).toBeInTheDocument();
    expect(
      screen.getByText('Compartilhe o código da barbearia para que os barbeiros possam se cadastrar.')
    ).toBeInTheDocument();
  });
});
