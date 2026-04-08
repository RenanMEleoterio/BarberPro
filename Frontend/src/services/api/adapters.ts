const DEFAULT_WORK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DEFAULT_OPEN_TIME = '08:00';
const DEFAULT_CLOSE_TIME = '18:00';
const DEFAULT_RATING = 4.8;
const DEFAULT_BARBERSHOP_IMAGE = 'https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg?auto=compress&cs=tinysrgb&w=400';
const DEFAULT_PHONE = '(11) 99999-9999';
const DEFAULT_ADDRESS = 'Endereco nao informado';

type ApiRecord = Record<string, any>;

function pickFirstDefined<T>(...values: T[]): T | undefined {
  return values.find((value) => value !== undefined && value !== null);
}

function toNumber(value: unknown, fallback: number = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeWorkDays(workDays: unknown): string[] {
  if (Array.isArray(workDays)) {
    const normalized = workDays
      .map((day) => (typeof day === 'string' ? day.trim() : ''))
      .filter(Boolean);

    return normalized.length > 0 ? normalized : [...DEFAULT_WORK_DAYS];
  }

  if (typeof workDays === 'string') {
    const normalized = workDays
      .split(',')
      .map((day) => day.trim())
      .filter(Boolean);

    return normalized.length > 0 ? normalized : [...DEFAULT_WORK_DAYS];
  }

  return [...DEFAULT_WORK_DAYS];
}

export function normalizeBarbershopConfig(barbershop: ApiRecord) {
  const id = toNumber(pickFirstDefined(barbershop.id, barbershop.Id));
  const nome = pickFirstDefined(barbershop.nome, barbershop.Nome, barbershop.name, barbershop.Name, '');
  const endereco = pickFirstDefined(barbershop.endereco, barbershop.Endereco, barbershop.address, barbershop.Address, '');
  const telefone = pickFirstDefined(barbershop.telefone, barbershop.Telefone, barbershop.phone, barbershop.Phone, '');
  const email = pickFirstDefined(barbershop.email, barbershop.Email, '');
  const openTime = pickFirstDefined(barbershop.openTime, barbershop.OpenTime, DEFAULT_OPEN_TIME) ?? DEFAULT_OPEN_TIME;
  const closeTime = pickFirstDefined(barbershop.closeTime, barbershop.CloseTime, DEFAULT_CLOSE_TIME) ?? DEFAULT_CLOSE_TIME;
  const workDays = normalizeWorkDays(pickFirstDefined(barbershop.workDays, barbershop.WorkDays));

  return {
    ...barbershop,
    id,
    nome,
    name: pickFirstDefined(barbershop.name, barbershop.Name, nome),
    endereco,
    address: pickFirstDefined(barbershop.address, barbershop.Address, endereco),
    telefone,
    phone: pickFirstDefined(barbershop.phone, barbershop.Phone, telefone),
    email,
    openTime,
    closeTime,
    workDays,
  };
}

function normalizeBarberList(barbers: unknown) {
  if (!Array.isArray(barbers)) {
    return [];
  }

  return barbers.map((barber: ApiRecord) => ({
    id: pickFirstDefined(barber.id, barber.Id, '').toString(),
    name: pickFirstDefined(barber.name, barber.Name, barber.nome, barber.Nome, 'Barbeiro'),
    rating: toNumber(pickFirstDefined(barber.rating, barber.Rating), DEFAULT_RATING),
  }));
}

export function normalizeBarbershopCard(barbershop: ApiRecord, barbersOverride?: unknown) {
  const normalizedConfig = normalizeBarbershopConfig(barbershop);
  const embeddedBarbers = pickFirstDefined(barbersOverride, barbershop.barbers, barbershop.Barbers);

  return {
    ...normalizedConfig,
    barbers: normalizeBarberList(embeddedBarbers),
    rating: toNumber(pickFirstDefined(barbershop.rating, barbershop.Rating), DEFAULT_RATING),
    image: pickFirstDefined(barbershop.image, barbershop.Image, DEFAULT_BARBERSHOP_IMAGE),
    openTime: normalizedConfig.openTime || DEFAULT_OPEN_TIME,
    closeTime: normalizedConfig.closeTime || DEFAULT_CLOSE_TIME,
    phone: normalizedConfig.phone || DEFAULT_PHONE,
    address: normalizedConfig.address || DEFAULT_ADDRESS,
  };
}

export interface ManagerBarber {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  rating: number;
  totalClients: number;
  monthlyRevenue: number;
  status: 'active' | 'inactive';
  joinDate: string;
  avatar?: string;
}

export interface ManagerBarbersData {
  barbeiros: ManagerBarber[];
  estatisticas: {
    totalBarbeiros: number;
    barbeirosAtivos: number;
    receitaTotal: number;
    avaliacaoMedia: number;
  };
}

export function normalizeManagerBarbersData(data: ApiRecord): ManagerBarbersData {
  const barbeirosList = pickFirstDefined(data.barbeiros, data.Barbeiros, []);
  const estatisticas = pickFirstDefined(data.estatisticas, data.Estatisticas, {});

  return {
    barbeiros: Array.isArray(barbeirosList)
      ? barbeirosList.map((barber: ApiRecord) => ({
          id: pickFirstDefined(barber.id, barber.Id, '').toString(),
          name: pickFirstDefined(barber.name, barber.Name, 'Barbeiro'),
          email: pickFirstDefined(barber.email, barber.Email, ''),
          phone: pickFirstDefined(barber.phone, barber.Phone, ''),
          specialties: Array.isArray(pickFirstDefined(barber.specialties, barber.Specialties))
            ? pickFirstDefined(barber.specialties, barber.Specialties)
            : [],
          rating: toNumber(pickFirstDefined(barber.rating, barber.Rating)),
          totalClients: toNumber(pickFirstDefined(barber.totalClients, barber.TotalClients)),
          monthlyRevenue: toNumber(pickFirstDefined(barber.monthlyRevenue, barber.MonthlyRevenue)),
          status: pickFirstDefined(barber.status, barber.Status, 'inactive'),
          joinDate: pickFirstDefined(barber.joinDate, barber.JoinDate, new Date().toISOString()),
          avatar: pickFirstDefined(barber.avatar, barber.Avatar),
        }))
      : [],
    estatisticas: {
      totalBarbeiros: toNumber(pickFirstDefined(estatisticas.totalBarbeiros, estatisticas.TotalBarbeiros)),
      barbeirosAtivos: toNumber(pickFirstDefined(estatisticas.barbeirosAtivos, estatisticas.BarbeirosAtivos)),
      receitaTotal: toNumber(pickFirstDefined(estatisticas.receitaTotal, estatisticas.ReceitaTotal)),
      avaliacaoMedia: toNumber(pickFirstDefined(estatisticas.avaliacaoMedia, estatisticas.AvaliacaoMedia)),
    },
  };
}

export interface ManagerStatsData {
  totalRevenue: number;
  totalClients: number;
  totalAppointments: number;
  averageRating: number;
  monthlyGrowth: number;
  barbersCount: number;
  activeBarbers: number;
  topBarbers: Array<{
    name: string;
    revenue: number;
    clients: number;
    rating: number;
  }>;
  monthlyData: Array<{
    month: string;
    revenue: number;
    appointments: number;
  }>;
  serviceStats: Array<{
    service: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  metaMensal: {
    receita: number;
    progresso: number;
  };
  eficiencia: {
    tempoMedioCorte: number;
    tempoMedioBarba: number;
    tempoMedioCompleto: number;
  };
  satisfacao: {
    excelente: number;
    bom: number;
    regular: number;
  };
}

export function normalizeManagerStatsData(data: ApiRecord): ManagerStatsData {
  const performanceMensal = pickFirstDefined(data.performanceMensal, data.PerformanceMensal, []);
  const rankingBarbeiros = pickFirstDefined(data.rankingBarbeiros, data.RankingBarbeiros, []);
  const servicosPopulares = pickFirstDefined(data.servicosPopulares, data.ServicosPopulares, []);
  const metaMensal = pickFirstDefined(data.metaMensal, data.MetaMensal, {});
  const eficiencia = pickFirstDefined(data.eficiencia, data.Eficiencia, {});
  const satisfacao = pickFirstDefined(data.satisfacao, data.Satisfacao, {});

  return {
    totalRevenue: toNumber(pickFirstDefined(data.receitaTotal, data.ReceitaTotal)),
    totalClients: toNumber(pickFirstDefined(data.totalClientes, data.TotalClientes)),
    totalAppointments: toNumber(pickFirstDefined(data.totalAgendamentos, data.TotalAgendamentos)),
    averageRating: toNumber(pickFirstDefined(data.avaliacaoMedia, data.AvaliacaoMedia)),
    monthlyGrowth: 0,
    barbersCount: 0,
    activeBarbers: 0,
    topBarbers: Array.isArray(rankingBarbeiros)
      ? rankingBarbeiros.map((barber: ApiRecord) => ({
          name: pickFirstDefined(barber.nome, barber.Nome, barber.name, 'Barbeiro'),
          revenue: toNumber(pickFirstDefined(barber.receita, barber.Receita, barber.revenue)),
          clients: toNumber(pickFirstDefined(barber.clientes, barber.Clientes, barber.clients)),
          rating: toNumber(pickFirstDefined(barber.avaliacao, barber.Avaliacao, barber.rating)),
        }))
      : [],
    monthlyData: Array.isArray(performanceMensal)
      ? performanceMensal.map((month: ApiRecord) => ({
          month: pickFirstDefined(month.mes, month.Mes, month.month, 'Mes'),
          revenue: toNumber(pickFirstDefined(month.receita, month.Receita, month.revenue)),
          appointments: toNumber(pickFirstDefined(month.agendamentos, month.Agendamentos, month.appointments)),
        }))
      : [],
    serviceStats: Array.isArray(servicosPopulares)
      ? servicosPopulares.map((service: ApiRecord) => ({
          service: pickFirstDefined(service.servico, service.Servico, service.service, 'Servico'),
          count: toNumber(pickFirstDefined(service.quantidade, service.Quantidade, service.count)),
          revenue: toNumber(pickFirstDefined(service.receita, service.Receita, service.revenue)),
          percentage: toNumber(pickFirstDefined(service.porcentagem, service.Porcentagem, service.percentage)),
        }))
      : [],
    metaMensal: {
      receita: toNumber(pickFirstDefined(metaMensal.meta, metaMensal.Meta), 20000),
      progresso: toNumber(pickFirstDefined(metaMensal.progresso, metaMensal.Progresso)),
    },
    eficiencia: {
      tempoMedioCorte: toNumber(pickFirstDefined(eficiencia.tempoMedioCorte, eficiencia.TempoMedioCorte), 25),
      tempoMedioBarba: toNumber(pickFirstDefined(eficiencia.tempoMedioBarba, eficiencia.TempoMedioBarba), 15),
      tempoMedioCompleto: toNumber(pickFirstDefined(eficiencia.tempoMedioCompleto, eficiencia.TempoMedioCompleto), 40),
    },
    satisfacao: {
      excelente: toNumber(pickFirstDefined(satisfacao.excelente, satisfacao.Excelente), 78),
      bom: toNumber(pickFirstDefined(satisfacao.bom, satisfacao.Bom), 18),
      regular: toNumber(pickFirstDefined(satisfacao.regular, satisfacao.Regular), 4),
    },
  };
}
