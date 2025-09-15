/**
 * Interface que representa um usuário no sistema.
 */
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string; // URL opcional para o avatar do usuário.
  role: 'client' | 'barber' | 'manager'; // Papel do usuário no sistema.
  barbeariaId?: number; // ID da barbearia associada, se for barbeiro ou gerente.
  created_at: string; // Data de criação do usuário.
}

/**
 * Interface que representa uma barbearia.
 */
export interface Barbershop {
  id: string;
  name: string;
  address: string;
  phone: string;
  code: string; // Código único da barbearia para registro de barbeiros.
  manager_id: string; // ID do gerente responsável pela barbearia.
  created_at: string; // Data de criação da barbearia.
}

/**
 * Interface que representa um barbeiro.
 */
export interface Barber {
  id: string;
  user_id: string; // ID do usuário associado a este barbeiro.
  barbershop_id: string; // ID da barbearia onde o barbeiro trabalha.
  percentage: number; // Porcentagem de comissão do barbeiro.
  weekly_earnings: number; // Ganhos semanais do barbeiro.
  is_active: boolean; // Indica se o barbeiro está ativo.
  created_at: string; // Data de criação do registro do barbeiro.
  user?: User; // Dados do usuário associado, opcionalmente populado.
}

/**
 * Interface que representa um agendamento.
 */
export interface Appointment {
  id: string;
  client_id: string; // ID do cliente que fez o agendamento.
  barber_id: string; // ID do barbeiro que realizará o serviço.
  barbershop_id: string; // ID da barbearia onde o agendamento foi feito.
  date: string; // Data do agendamento.
  time: string; // Hora do agendamento.
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'; // Status do agendamento.
  service_price?: number; // Preço do serviço, opcional.
  payment_method?: 'cash' | 'card' | 'pix'; // Método de pagamento, opcional.
  created_at: string; // Data de criação do agendamento.
  client?: User; // Dados do cliente, opcionalmente populado.
  barber?: Barber; // Dados do barbeiro, opcionalmente populado.
  barbershop?: Barbershop; // Dados da barbearia, opcionalmente populado.
}

/**
 * Interface que representa um slot de horário disponível.
 */
export interface TimeSlot {
  time: string; // Hora do slot.
  available: boolean; // Indica se o slot está disponível.
  appointment?: Appointment; // Agendamento associado, se o slot não estiver disponível.
}

/**
 * Interface que representa as estatísticas semanais.
 */
export interface WeeklyStats {
  total_appointments: number; // Total de agendamentos.
  completed_appointments: number; // Agendamentos concluídos.
  cancelled_appointments: number; // Agendamentos cancelados.
  no_show_appointments: number; // Agendamentos de não comparecimento.
  total_earnings: number; // Ganhos totais.
  payment_methods: { // Detalhes dos métodos de pagamento.
    cash: number;
    card: number;
    pix: number;
  };
}


