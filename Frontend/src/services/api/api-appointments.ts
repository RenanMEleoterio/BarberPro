import { HttpClient } from './httpClient';
import { mapAppointmentStatusToFrontend } from '../../utils/appointmentStatus';

export const AppointmentAPI = {
  async getMyAppointments() {
    return HttpClient.request<any>('/agendamento/meus-agendamentos');
  },

  async createAgendamento(data: any) {
    return HttpClient.request<any>('/agendamento', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateAgendamento(id: number, data: any) {
    return HttpClient.request<any>(`/agendamento/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async updateAppointmentStatus(id: number, status: string) {
    return HttpClient.request<any>(`/agendamento/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  async cancelAppointment(id: number) {
    return HttpClient.request<any>(`/agendamento/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Obtém os agendamentos do usuário logado com detalhes adicionais formatados para o frontend.
   */
  async getMyAppointmentsWithDetails() {
    const response = await this.getMyAppointments();
    const agendamentos = Array.isArray(response) ? response : [];

    return agendamentos.map((agendamento: any) => ({
      id: agendamento.id.toString(),
      barbershopId: agendamento.barbeariaId,
      barbershop: agendamento.nomeBarbearia || 'Barbearia', 
      barberId: agendamento.barbeiroId,
      barber: agendamento.nomeBarbeiro,
      date: agendamento.dataHora.split('T')[0],
      time: agendamento.dataHora.split('T')[1].substring(0, 5),
      status: this.mapStatusToFrontend(agendamento.status),
      service: agendamento.tipoServico || 'Serviço não informado',
      price: agendamento.precoServico || 0,
      servicoIds: agendamento.servicoIds || [],
      address: 'Endereço da barbearia', 
      phone: '(11) 99999-9999',
      rating: 4.8
    }));
  },

  mapStatusToFrontend(status: string): string {
    return mapAppointmentStatusToFrontend(status);
  }
};
