import { HttpClient } from './httpClient';

export const ServicoAPI = {
  async getServicosByBarbeariaId(barbeariaId: number) {
    return HttpClient.request<any>(`/servico?barbeariaId=${barbeariaId}`);
  },

  async addServico(data: { nome: string; preco: number; duracaoMinutos: number; barbeariaId: number }) {
    return HttpClient.request<any>(`/servico`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

export const BarberProfileAPI = {
  async getBarberProfile(id: number) {
    return HttpClient.request<any>(`/barbeiro/perfil/${id}`);
  },

  async updateBarberProfile(id: number, data: any) {
    return HttpClient.request<any>(`/barbeiro/perfil/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async generateHorariosParaBarbearia(dataInicio?: string, dataFim?: string, intervaloMinutos: number = 30) {
    const params = new URLSearchParams();
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);
    if (intervaloMinutos) params.append('intervaloMinutos', intervaloMinutos.toString());
    const query = params.toString();
    const endpoint = query ? `/horario/gerar-barbearia?${query}` : '/horario/gerar-barbearia';
    
    return HttpClient.request<any>(endpoint, {
      method: 'POST'
    });
  }
};
