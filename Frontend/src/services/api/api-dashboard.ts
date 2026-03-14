import { HttpClient } from './httpClient';

export const DashboardAPI = {
  async getClientDashboard(id: number) {
    return HttpClient.request<any>(`/dashboard/client/${id}`);
  },

  async getBarberDashboard(id: number) {
    return HttpClient.request<any>(`/dashboard/barber/${id}`);
  },

  async getManagerDashboard(barbeariaId: number) {
    return HttpClient.request<any>(`/dashboard/manager/${barbeariaId}`);
  },

  async getManagerBarbers(barbeariaId: number) {
    return HttpClient.request<any>(`/dashboard/manager/${barbeariaId}/barbers`);
  },

  async getBarberStats(id: number, periodo: string = 'semana') {
    return HttpClient.request<any>(`/stats/barber/${id}?periodo=${periodo}`);
  },

  async getManagerStats(barbeariaId: number, periodo: string = 'mes') {
    return HttpClient.request<any>(`/stats/manager/${barbeariaId}?periodo=${periodo}`);
  }
};
