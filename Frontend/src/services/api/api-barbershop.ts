import { HttpClient } from './httpClient';
import { normalizeBarbershopCard, normalizeBarbershopConfig } from './adapters';

export const BarbershopAPI = {
  async getBarbershops() {
    return HttpClient.request<any>('/barbearia');
  },

  async getBarbers(barbeariaId: number) {
    return HttpClient.request<any>(`/barbearia/${barbeariaId}/barbeiros`);
  },

  async getBarbeirosComHorarios(barbeariaId?: number, reschedulingId?: number) {
    const params = new URLSearchParams();
    if (barbeariaId) params.append('barbeariaId', barbeariaId.toString());
    if (reschedulingId) params.append('reschedulingId', reschedulingId.toString());
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return HttpClient.request<any>(`/agendamento/barbeiros${queryString}`);
  },

  async getBarbeariaById(id: number) {
    const response = await HttpClient.request<any>(`/barbearia/${id}`);
    return normalizeBarbershopConfig(response);
  },

  async getBarbeariaDetalhes(id: number) {
    return HttpClient.request<any>(`/barbearia/${id}/detalhes`);
  },

  async updateBarbearia(id: number, data: any) {
    return HttpClient.request<any>(`/barbearia/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  /**
   * Obtém a lista de barbearias com detalhes adicionais, como barbeiros e avaliações.
   * Realiza múltiplas chamadas à API para enriquecer os dados das barbearias.
   */
  async getBarbershopsWithDetails() {
    const response = await this.getBarbershops();
    const barbearias = Array.isArray(response) ? response : [];
    const hasEmbeddedBarbers = barbearias.every(
      (barbearia: any) => Array.isArray(barbearia.barbers) || Array.isArray(barbearia.Barbers)
    );

    if (hasEmbeddedBarbers) {
      return barbearias.map((barbearia: any) => normalizeBarbershopCard(barbearia));
    }

    return Promise.all(
      barbearias.map(async (barbearia: any) => {
        try {
          const responseBarbeiros = await this.getBarbers(barbearia.id);
          return normalizeBarbershopCard(barbearia, responseBarbeiros);
          /*
          const barbeiros = Array.isArray(responseBarbeiros) ? responseBarbeiros : [];

          return {
            ...barbearia,
            barbers: barbeiros.map((barbeiro: any) => ({
              id: barbeiro.id.toString(),
              name: barbeiro.nome,
              rating: 4.8 
            })),
            rating: 4.8, 
            image: 'https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg?auto=compress&cs=tinysrgb&w=400',
            openTime: '08:00',
            closeTime: '19:00',
            phone: barbearia.telefone || '(11) 99999-9999',
            address: barbearia.endereco || 'Endereço não informado'
          };
          */
        } catch (error) {
          console.error(`Erro ao buscar barbeiros para barbearia ${barbearia.id}:`, error);
          return normalizeBarbershopCard(barbearia, []);
          /*
          return {
            ...barbearia,
            barbers: [],
            rating: 4.8,
            image: 'https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg?auto=compress&cs=tinysrgb&w=400',
            openTime: '08:00',
            closeTime: '19:00',
            phone: barbearia.telefone || '(11) 99999-9999',
            address: 'Endereço não informado'
          };
          */
        }
      })
    );
  }
};
