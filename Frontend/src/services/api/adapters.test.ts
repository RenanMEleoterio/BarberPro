import { describe, expect, it } from 'vitest';
import {
  normalizeBarbershopCard,
  normalizeBarbershopConfig,
  normalizeManagerBarbersData,
  normalizeManagerStatsData,
} from './adapters';

describe('api adapters', () => {
  it('normaliza configuracao da barbearia com defaults e workDays em array', () => {
    const result = normalizeBarbershopConfig({
      Id: 1,
      Nome: 'Barber Pro',
      Endereco: 'Rua 1',
      Telefone: '11999999999',
      WorkDays: 'monday, wednesday, friday',
    });

    expect(result.id).toBe(1);
    expect(result.name).toBe('Barber Pro');
    expect(result.openTime).toBe('08:00');
    expect(result.closeTime).toBe('18:00');
    expect(result.workDays).toEqual(['monday', 'wednesday', 'friday']);
  });

  it('normaliza resposta de barbeiros do manager com PascalCase e camelCase', () => {
    const result = normalizeManagerBarbersData({
      Barbeiros: [
        {
          Id: 10,
          Name: 'Diego',
          Email: 'diego@barberpro.com',
          Phone: '11999999999',
          Specialties: ['corte', 'barba'],
          Rating: 4.9,
          TotalClients: 15,
          MonthlyRevenue: 3200,
          Status: 'active',
          JoinDate: '2026-01-10T00:00:00Z',
        },
      ],
      Estatisticas: {
        TotalBarbeiros: 1,
        BarbeirosAtivos: 1,
        ReceitaTotal: 3200,
        AvaliacaoMedia: 4.9,
      },
    });

    expect(result.barbeiros[0]).toMatchObject({
      id: '10',
      name: 'Diego',
      specialties: ['corte', 'barba'],
      status: 'active',
    });
    expect(result.estatisticas.totalBarbeiros).toBe(1);
    expect(result.estatisticas.receitaTotal).toBe(3200);
  });

  it('normaliza stats do manager com defaults atuais', () => {
    const result = normalizeManagerStatsData({
      ReceitaTotal: 5400,
      TotalClientes: 27,
      TotalAgendamentos: 44,
      AvaliacaoMedia: 4.7,
      PerformanceMensal: [{ Mes: 'Abr', Receita: 5400, Agendamentos: 44 }],
      RankingBarbeiros: [{ Nome: 'Sandro', Receita: 3000, Clientes: 12, Avaliacao: 4.8 }],
      ServicosPopulares: [{ Servico: 'Corte', Quantidade: 20, Receita: 1000, Porcentagem: 55 }],
    });

    expect(result.totalRevenue).toBe(5400);
    expect(result.monthlyGrowth).toBe(0);
    expect(result.monthlyData[0]).toEqual({ month: 'Abr', revenue: 5400, appointments: 44 });
    expect(result.metaMensal.receita).toBe(20000);
    expect(result.eficiencia.tempoMedioCorte).toBe(25);
  });

  it('normaliza stats do manager serializados em camelCase pela API ASP.NET', () => {
    const result = normalizeManagerStatsData({
      receitaTotal: 5400,
      totalClientes: 27,
      totalAgendamentos: 44,
      avaliacaoMedia: 4.7,
      performanceMensal: [{ mes: 'Abr', receita: 5400, agendamentos: 44 }],
      rankingBarbeiros: [{ nome: 'Sandro', receita: 3000, clientes: 12, avaliacao: 4.8 }],
      servicosPopulares: [{ servico: 'Corte', quantidade: 20, receita: 1000, porcentagem: 55 }],
      metaMensal: { meta: 20000, progresso: 27 },
      eficiencia: { tempoMedioCorte: 25, tempoMedioBarba: 15, tempoMedioCompleto: 40 },
      satisfacao: { excelente: 78, bom: 18, regular: 4 },
    });

    expect(result.totalRevenue).toBe(5400);
    expect(result.totalClients).toBe(27);
    expect(result.totalAppointments).toBe(44);
    expect(result.averageRating).toBe(4.7);
    expect(result.monthlyData[0]).toEqual({ month: 'Abr', revenue: 5400, appointments: 44 });
    expect(result.topBarbers[0]).toEqual({ name: 'Sandro', revenue: 3000, clients: 12, rating: 4.8 });
    expect(result.serviceStats[0]).toEqual({ service: 'Corte', count: 20, revenue: 1000, percentage: 55 });
    expect(result.metaMensal).toEqual({ receita: 20000, progresso: 27 });
    expect(result.eficiencia.tempoMedioCorte).toBe(25);
    expect(result.satisfacao.excelente).toBe(78);
  });

  it('normaliza card de barbearia aproveitando barbeiros embarcados', () => {
    const result = normalizeBarbershopCard({
      id: 3,
      nome: 'Centro',
      endereco: 'Av. Central',
      telefone: '1133334444',
      openTime: '09:00',
      closeTime: '19:00',
      barbers: [{ id: 1, nome: 'Joao' }],
    });

    expect(result.barbers).toEqual([{ id: '1', name: 'Joao', rating: 4.8 }]);
    expect(result.address).toBe('Av. Central');
    expect(result.phone).toBe('1133334444');
  });
});
