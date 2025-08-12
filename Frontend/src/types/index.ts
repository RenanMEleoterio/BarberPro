export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: 'client' | 'barber' | 'manager';
  created_at: string;
}

export interface Barbershop {
  id: string;
  name: string;
  address: string;
  phone: string;
  code: string;
  manager_id: string;
  created_at: string;
}

export interface Barber {
  id: string;
  user_id: string;
  barbershop_id: string;
  percentage: number;
  weekly_earnings: number;
  is_active: boolean;
  created_at: string;
  user?: User;
}

export interface Appointment {
  id: string;
  client_id: string;
  barber_id: string;
  barbershop_id: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  service_price?: number;
  payment_method?: 'cash' | 'card' | 'pix';
  created_at: string;
  client?: User;
  barber?: Barber;
  barbershop?: Barbershop;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  appointment?: Appointment;
}

export interface WeeklyStats {
  total_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  no_show_appointments: number;
  total_earnings: number;
  payment_methods: {
    cash: number;
    card: number;
    pix: number;
  };
}