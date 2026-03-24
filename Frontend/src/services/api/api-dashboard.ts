import { HttpClient } from './httpClient';

export const DashboardAPI = {
  async getClientDashboard(id: number) {
    return HttpClient.request<any>(`/dashboard/client/${id}`);
  },

  async getBarberDashboard(id: number) {
    return HttpClient.request<any>(`/dashboard/barber/${id}`);
  },

  async getManagerDashboard(managerId: number) {
    return HttpClient.request<any>(`/dashboard/manager/${managerId}`);
  },

  async getManagerBarbers(managerId: number) {
    return HttpClient.request<any>(`/dashboard/manager/${managerId}/barbers`);
  },

  async getBarberStats(id: number, periodo: string = 'semana') {
    return HttpClient.request<any>(`/stats/barber/${id}?periodo=${periodo}`);
  },

  async getManagerStats(managerId: number, periodo: string = 'mes') {
    return HttpClient.request<any>(`/stats/manager/${managerId}?periodo=${periodo}`);
  }
};
