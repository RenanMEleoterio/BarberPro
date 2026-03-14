import { AuthAPI, LoginResponse } from './api/api-auth';
import { HttpClient, ApiError } from './api/httpClient';
import { DashboardAPI } from './api/api-dashboard';
import { AppointmentAPI } from './api/api-appointments';
import { BarbershopAPI } from './api/api-barbershop';
import { ServicoAPI, BarberProfileAPI } from './api/api-services';

/**
 * ApiService Wrapper (Retrocompatibilidade)
 * Este arquivo foi refatorado. Toda a lógica pesada foi dividida dentro da pasta /api/.
 * A classe ApiService agora atua apenas como um Proxy para não quebrar os imports 
 * nos diversos componentes React atuais.
 */
class ApiService {
  
  // Auth & Token Control
  setToken(token: string) { HttpClient.setToken(token); }
  clearToken() { HttpClient.clearToken(); }

  async login(email: string, password: string) { 
    return AuthAPI.login(email, password); 
  }
  
  async register(email: string, password: string, name: string, role: 'client' | 'barber' | 'manager', barbershopCode?: string, barbershopName?: string, barbershopAddress?: string, barbershopPhone?: string) {
    return AuthAPI.register(email, password, name, role, barbershopCode, barbershopName, barbershopAddress, barbershopPhone);
  }

  async registerBarber(email: string, password: string, name: string, barbershopCode: string, specialties?: string, description?: string) {
    return AuthAPI.registerBarber(email, password, name, barbershopCode, specialties, description);
  }

  async googleAuth(idToken: string, userType: 'Cliente' | 'Barbeiro' | 'Gerente', additionalData?: any) {
    return AuthAPI.googleAuth(idToken, userType, additionalData);
  }

  // Dashboard
  async getClientDashboard(id: number) { return DashboardAPI.getClientDashboard(id); }
  async getBarberDashboard(id: number) { return DashboardAPI.getBarberDashboard(id); }
  async getManagerDashboard(barbeariaId: number) { return DashboardAPI.getManagerDashboard(barbeariaId); }
  async getManagerBarbers(barbeariaId: number) { return DashboardAPI.getManagerBarbers(barbeariaId); }
  async getBarberStats(id: number, periodo?: string) { return DashboardAPI.getBarberStats(id, periodo); }
  async getManagerStats(barbeariaId: number, periodo?: string) { return DashboardAPI.getManagerStats(barbeariaId, periodo); }

  // Appointments
  async getMyAppointments() { return AppointmentAPI.getMyAppointments(); }
  async createAgendamento(data: any) { return AppointmentAPI.createAgendamento(data); }
  async updateAgendamento(id: number, data: any) { return AppointmentAPI.updateAgendamento(id, data); }
  async updateAppointmentStatus(id: number, status: string) { return AppointmentAPI.updateAppointmentStatus(id, status); }
  async cancelAppointment(id: number) { return AppointmentAPI.cancelAppointment(id); }
  async getMyAppointmentsWithDetails() { return AppointmentAPI.getMyAppointmentsWithDetails(); }

  // Barbershop
  async getBarbershops() { return BarbershopAPI.getBarbershops(); }
  async getBarbers(barbeariaId: number) { return BarbershopAPI.getBarbers(barbeariaId); }
  async getBarbeirosComHorarios(barbeariaId?: number, reschedulingId?: number) { return BarbershopAPI.getBarbeirosComHorarios(barbeariaId, reschedulingId); }
  async getBarbeariaById(id: number) { return BarbershopAPI.getBarbeariaById(id); }
  async getBarbeariaDetalhes(id: number) { return BarbershopAPI.getBarbeariaDetalhes(id); }
  async updateBarbearia(id: number, data: any) { return BarbershopAPI.updateBarbearia(id, data); }
  async getBarbershopsWithDetails() { return BarbershopAPI.getBarbershopsWithDetails(); }

  // Services & Barber Profile
  async getServicosByBarbeariaId(barbeariaId: number) { return ServicoAPI.getServicosByBarbeariaId(barbeariaId); }
  async addServico(data: any) { return ServicoAPI.addServico(data); }
  async getBarberProfile(id: number) { return BarberProfileAPI.getBarberProfile(id); }
  async updateBarberProfile(id: number, data: any) { return BarberProfileAPI.updateBarberProfile(id, data); }
  async generateHorariosParaBarbearia(dataInicio?: string, dataFim?: string, intervaloMinutos: number = 30) {
    return BarberProfileAPI.generateHorariosParaBarbearia(dataInicio, dataFim, intervaloMinutos);
  }
}

export const apiService = new ApiService();
export type { LoginResponse, ApiError };


