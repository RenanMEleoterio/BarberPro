const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'https://barberpro-op6v.onrender.com/api';

/**
 * Interface que define a estrutura de uma requisição de login.
 */
interface LoginRequest {
  email: string;
  senha: string;
  tipoUsuario: string;
}

/**
 * Interface que define a estrutura de uma resposta de login bem-sucedida.
 */
interface LoginResponse {
  id: number;
  nome: string;
  email: string;
  tipoUsuario: string;
  barbeariaId?: number;
  nomeBarbearia?: string;
  token: string;
}

/**
 * Interface que define a estrutura de um erro retornado pela API.
 */
interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Classe de serviço para interagir com a API do backend.
 * Gerencia a autenticação (tokens) e faz requisições HTTP para diferentes endpoints.
 */
class ApiService {
  private token: string | null = null;

  /**
   * Construtor da classe ApiService.
   * Tenta carregar o token de autenticação do localStorage ao ser instanciada.
   */
  constructor() {
    this.token = localStorage.getItem('token');
  }

  /**
   * Define o token de autenticação e o armazena no localStorage.
   * @param {string} token - O token JWT a ser armazenado.
   */
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  /**
   * Limpa o token de autenticação do estado e do localStorage.
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  /**
   * Método privado genérico para fazer requisições HTTP à API.
   * Adiciona automaticamente o token de autenticação (se disponível) e trata erros.
   * @template T - O tipo esperado da resposta da API.
   * @param {string} endpoint - O endpoint da API (ex: '/auth/login').
   * @param {RequestInit} options - Opções de configuração para a requisição fetch.
   * @returns {Promise<T>} - Uma promessa que resolve com os dados da resposta da API.
   * @throws {Error} - Lança um erro se a requisição não for bem-sucedida.
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage = 'Erro na requisição';
        
        try {
          const parsedError = JSON.parse(errorData);
          errorMessage = JSON.stringify(parsedError);
        } catch {
          errorMessage = errorData || `Erro ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro na requisição:', error);
      throw error;
    }
  }

  // Endpoints de Autenticação

  /**
   * Realiza o login de um usuário (cliente, barbeiro ou gerente).
   * @param {string} email - O email do usuário.
   * @param {string} password - A senha do usuário.
   * @returns {Promise<LoginResponse>} - Uma promessa que resolve com os dados de login.
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        senha: password,
        tipoUsuario: 'Cliente' // Por padrão, assume-se cliente, mas o backend deve validar.
      }),
    });
  }

  /**
   * Registra um novo usuário (cliente, barbeiro ou gerente).
   * Redireciona para o registro de barbearia se a role for 'manager'.
   * @param {string} email - O email do novo usuário.
   * @param {string} password - A senha do novo usuário.
   * @param {string} name - O nome do novo usuário.
   * @param {'client' | 'barber' | 'manager'} role - A role do usuário a ser registrado.
   * @param {string} [barbershopCode] - Opcional: Código da barbearia para registro de barbeiro.
   * @param {string} [barbershopName] - Opcional: Nome da barbearia para registro de gerente.
   * @param {string} [barbershopAddress] - Opcional: Endereço da barbearia para registro de gerente.
   * @param {string} [barbershopPhone] - Opcional: Telefone da barbearia para registro de gerente.
   * @returns {Promise<LoginResponse>} - Uma promessa que resolve com os dados de login do novo usuário.
   * @throws {Error} - Lança um erro se faltarem dados para o registro de gerente ou barbeiro.
   */
  async register(email: string, password: string, name: string, role: 'client' | 'barber' | 'manager', barbershopCode?: string, barbershopName?: string, barbershopAddress?: string, barbershopPhone?: string): Promise<LoginResponse> {
    if (role === 'manager') {
      // Para gerente, usa o endpoint de cadastro de barbearia.
      if (!barbershopName || !barbershopAddress || !barbershopPhone) {
        throw new Error('Nome, endereço e telefone da barbearia são obrigatórios para gerentes');
      }
      return this.registerBarbershop(barbershopName, email, password, barbershopAddress, barbershopPhone);
    }

    const endpoint = role === 'client' ? '/auth/cadastro-cliente' : '/auth/cadastro-barbeiro';
    
    const body: any = {
      nome: name,
      email,
      senha: password
    };

    // Adiciona campos específicos baseado no tipo de usuário.
    if (role === 'barber') {
      if (!barbershopCode) {
        throw new Error('Código da barbearia é obrigatório para barbeiros');
      }
      body.codigoBarbearia = barbershopCode;
      body.especialidades = ''; // Pode ser preenchido posteriormente.
      body.descricao = ''; // Pode ser preenchido posteriormente.
    }

    return this.request<LoginResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Registra um novo barbeiro na barbearia.
   * @param {string} email - O email do barbeiro.
   * @param {string} password - A senha do barbeiro.
   * @param {string} name - O nome do barbeiro.
   * @param {string} barbershopCode - O código da barbearia à qual o barbeiro será associado.
   * @param {string} [specialties] - Opcional: Especialidades do barbeiro.
   * @param {string} [description] - Opcional: Descrição do barbeiro.
   * @returns {Promise<LoginResponse>} - Uma promessa que resolve com os dados de login do barbeiro.
   */
  async registerBarber(email: string, password: string, name: string, barbershopCode: string, specialties?: string, description?: string): Promise<LoginResponse> {
    const body = {
      nome: name,
      email,
      senha: password,
      codigoBarbearia: barbershopCode,
      especialidades: specialties || '',
      descricao: description || ''
    };

    return this.request<LoginResponse>('/auth/cadastro-barbeiro', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Registra uma nova barbearia e seu gerente.
   * @param {string} name - O nome da barbearia.
   * @param {string} email - O email do gerente da barbearia.
   * @param {string} password - A senha do gerente.
   * @param {string} address - O endereço da barbearia.
   * @param {string} phone - O telefone da barbearia.
   * @returns {Promise<LoginResponse>} - Uma promessa que resolve com os dados de login do gerente.
   */
  async registerBarbershop(name: string, email: string, password: string, address: string, phone: string): Promise<LoginResponse> {
    const body = {
      nome: name, // Nome da barbearia
      endereco: address,
      telefone: phone,
      email,
      senha: password,
    };

    return this.request<LoginResponse>("/auth/cadastro-barbearia", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /**
   * Realiza a autenticação via Google.
   * @param {string} idToken - O ID Token fornecido pelo Google.
   * @param {'Cliente' | 'Barbeiro' | 'Gerente'} userType - O tipo de usuário que está se autenticando.
   * @param {object} [additionalData] - Dados adicionais dependendo do tipo de usuário (código de convite, especialidades, etc.).
   * @returns {Promise<LoginResponse>} - Uma promessa que resolve com os dados de login.
   */
  async googleAuth(
    idToken: string,
    userType: 'Cliente' | 'Barbeiro' | 'Gerente',
    additionalData?: {
      codigoConvite?: string;
      especialidades?: string;
      descricao?: string;
      endereco?: string;
      telefone?: string;
    }
  ): Promise<LoginResponse> {
    const body = {
      idToken,
      tipoUsuario: userType,
      ...additionalData
    };

    return this.request<LoginResponse>('/auth/google-auth', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Endpoints de Dashboard

  /**
   * Obtém os dados do dashboard para um cliente específico.
   * @param {number} id - O ID do cliente.
   * @returns {Promise<any>} - Uma promessa que resolve com os dados do dashboard do cliente.
   */
  async getClientDashboard(id: number) {
    return this.request(`/dashboard/client/${id}`);
  }

  /**
   * Obtém os dados do dashboard para um barbeiro específico.
   * @param {number} id - O ID do barbeiro.
   * @returns {Promise<any>} - Uma promessa que resolve com os dados do dashboard do barbeiro.
   */
  async getBarberDashboard(id: number) {
    return this.request(`/dashboard/barber/${id}`);
  }

  /**
   * Obtém os dados do dashboard para o gerente de uma barbearia específica.
   * @param {number} barbeariaId - O ID da barbearia.
   * @returns {Promise<any>} - Uma promessa que resolve com os dados do dashboard do gerente.
   */
  async getManagerDashboard(barbeariaId: number) {
    return this.request(`/dashboard/manager/${barbeariaId}`);
  }

  /**
   * Obtém a lista de barbeiros e suas estatísticas para o gerente de uma barbearia.
   * @param {number} barbeariaId - O ID da barbearia.
   * @returns {Promise<any>} - Uma promessa que resolve com os dados dos barbeiros e estatísticas.
   */
  async getManagerBarbers(barbeariaId: number) {
    return this.request(`/dashboard/manager/${barbeariaId}/barbers`);
  }

  // Endpoints de Estatísticas

  /**
   * Obtém as estatísticas para um barbeiro específico em um determinado período.
   * @param {number} id - O ID do barbeiro.
   * @param {string} [periodo=\'semana\'] - O período para o qual as estatísticas devem ser obtidas (ex: 'semana', 'mes').
   * @returns {Promise<any>} - Uma promessa que resolve com os dados de estatísticas do barbeiro.
   */
  async getBarberStats(id: number, periodo: string = 'semana') {
    return this.request(`/stats/barber/${id}?periodo=${periodo}`);
  }

  /**
   * Obtém as estatísticas para o gerente de uma barbearia em um determinado período.
   * @param {number} barbeariaId - O ID da barbearia.
   * @param {string} [periodo=\'mes\'] - O período para o qual as estatísticas devem ser obtidas (ex: 'semana', 'mes').
   * @returns {Promise<any>} - Uma promessa que resolve com os dados de estatísticas do gerente.
   */
  async getManagerStats(barbeariaId: number, periodo: string = 'mes') {
    return this.request(`/stats/manager/${barbeariaId}?periodo=${periodo}`);
  }

  // Endpoints de Agendamentos

  /**
   * Obtém todos os agendamentos do usuário logado.
   * @returns {Promise<any>} - Uma promessa que resolve com a lista de agendamentos.
   */
  async getMyAppointments() {
    return this.request('/agendamento/meus-agendamentos');
  }

  /**
   * Cria um novo agendamento.
   * @param {any} data - Os dados do agendamento a ser criado.
   * @returns {Promise<any>} - Uma promessa que resolve com a confirmação do agendamento.
   */
  async createAgendamento(data: any) {
    return this.request('/agendamento', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Atualiza o status de um agendamento existente.
   * @param {number} id - O ID do agendamento a ser atualizado.
   * @param {string} status - O novo status do agendamento.
   * @returns {Promise<any>} - Uma promessa que resolve com a confirmação da atualização.
   */
  async updateAppointmentStatus(id: number, status: string) {
    return this.request(`/agendamento/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  /**
   * Cancela um agendamento.
   * @param {number} id - O ID do agendamento a ser cancelado.
   * @returns {Promise<any>} - Uma promessa que resolve com a confirmação do cancelamento.
   */
  async cancelAppointment(id: number) {
    return this.request(`/agendamento/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Obtém a lista de todas as barbearias cadastradas.
   * @returns {Promise<any>} - Uma promessa que resolve com a lista de barbearias.
   */
  async getBarbershops() {
    return this.request('/barbearia');
  }

  /**
   * Obtém a lista de barbeiros de uma barbearia específica.
   * @param {number} barbeariaId - O ID da barbearia.
   * @returns {Promise<any>} - Uma promessa que resolve com a lista de barbeiros.
   */
  async getBarbers(barbeariaId: number) {
    return this.request(`/barbearia/${barbeariaId}/barbeiros`);
  }

  /**
   * Obtém a lista de barbeiros que possuem horários disponíveis.
   * @returns {Promise<any>} - Uma promessa que resolve com a lista de barbeiros e seus horários.
   */
  async getBarbeirosComHorarios() {
    return this.request('/agendamento/barbeiros');
  }

  /**
   * Obtém os detalhes de uma barbearia pelo seu ID.
   * @param {number} id - O ID da barbearia.
   * @returns {Promise<any>} - Uma promessa que resolve com os detalhes da barbearia.
   */
  async getBarbeariaById(id: number) {
    return this.request(`/barbearia/${id}`);
  }

  /**
   * Obtém detalhes completos de uma barbearia, incluindo informações adicionais.
   * @param {number} id - O ID da barbearia.
   * @returns {Promise<any>} - Uma promessa que resolve com os detalhes completos da barbearia.
   */
  async getBarbeariaDetalhes(id: number) {
    return this.request(`/barbearia/${id}/detalhes`);
  }

  /**
   * Atualiza os dados de uma barbearia existente.
   * @param {number} id - O ID da barbearia a ser atualizada.
   * @param {any} data - Os dados da barbearia a serem atualizados.
   * @returns {Promise<any>} - Uma promessa que resolve com a confirmação da atualização.
   */
  async updateBarbearia(id: number, data: any) {
    return this.request(`/barbearia/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * Obtém a lista de serviços oferecidos por uma barbearia específica.
   * @param {number} barbeariaId - O ID da barbearia.
   * @returns {Promise<any>} - Uma promessa que resolve com a lista de serviços.
   */
  async getServicosByBarbeariaId(barbeariaId: number) {
    return this.request(`/servico?barbeariaId=${barbeariaId}`);
  }

  /**
   * Adiciona um novo serviço a uma barbearia.
   * @param {object} data - Os dados do novo serviço (nome, preço, duração, ID da barbearia).
   * @returns {Promise<any>} - Uma promessa que resolve com a confirmação da adição do serviço.
   */
  async addServico(data: { nome: string; preco: number; duracaoMinutos: number; barbeariaId: number }) {
    return this.request(`/servico`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Endpoints para buscar dados com detalhes adicionais (Frontend-specific)

  /**
   * Obtém a lista de barbearias com detalhes adicionais, como barbeiros e avaliações.
   * Realiza múltiplas chamadas à API para enriquecer os dados das barbearias.
   * @returns {Promise<any[]>} - Uma promessa que resolve com a lista de barbearias detalhadas.
   */
  async getBarbershopsWithDetails() {
    const barbearias = await this.request('/barbearia');
    
    // Para cada barbearia, busca os barbeiros associados.
    const barbershopsWithBarbers = await Promise.all(
      barbearias.map(async (barbearia: any) => {
        try {
          const barbeiros = await this.getBarbers(barbearia.id);
          return {
            ...barbearia,
            barbers: barbeiros.map((barbeiro: any) => ({
              id: barbeiro.id.toString(),
              name: barbeiro.nome,
              rating: 4.8 // Rating padrão - pode ser implementado no futuro com dados reais.
            })),
            rating: 4.8, // Rating padrão - pode ser implementado no futuro com dados reais.
            image: 'https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg?auto=compress&cs=tinysrgb&w=400', // Imagem padrão.
            openTime: '08:00',
            closeTime: '19:00',
            phone: barbearia.telefone || '(11) 99999-9999',
            address: barbearia.endereco || 'Endereço não informado'
          };
        } catch (error) {
          console.error(`Erro ao buscar barbeiros para barbearia ${barbearia.id}:`, error);
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
        }
      })
    );
    
    return barbershopsWithBarbers;
  }

  /**
   * Obtém os agendamentos do usuário logado com detalhes adicionais formatados para o frontend.
   * @returns {Promise<any[]>} - Uma promessa que resolve com a lista de agendamentos detalhados.
   */
  async getMyAppointmentsWithDetails() {
    const agendamentos = await this.getMyAppointments();
    
    return agendamentos.map((agendamento: any) => ({
      id: agendamento.id.toString(),
      barbershop: 'Barbearia', // Nome da barbearia pode ser adicionado no backend.
      barber: agendamento.nomeBarbeiro,
      date: agendamento.dataHora.split('T')[0],
      time: agendamento.dataHora.split('T')[1].substring(0, 5),
      status: this.mapStatusToFrontend(agendamento.status),
      service: 'Corte + Barba', // Serviço padrão - pode ser implementado no futuro com dados reais.
      price: 45, // Preço padrão - pode ser implementado no futuro com dados reais.
      address: 'Endereço da barbearia', // Pode ser implementado no futuro com dados reais.
      phone: '(11) 99999-9999', // Telefone padrão.
      rating: 4.8 // Rating padrão.
    }));
  }

  // Endpoints de Perfil de Barbeiro

  /**
   * Obtém o perfil de um barbeiro específico.
   * @param {number} id - O ID do barbeiro.
   * @returns {Promise<any>} - Uma promessa que resolve com os dados do perfil do barbeiro.
   */
  async getBarberProfile(id: number) {
    return this.request(`/barbeiro/perfil/${id}`);
  }

  /**
   * Atualiza o perfil de um barbeiro específico.
   * @param {number} id - O ID do barbeiro a ser atualizado.
   * @param {any} data - Os dados do perfil do barbeiro a serem atualizados.
   * @returns {Promise<any>} - Uma promessa que resolve com a confirmação da atualização.
   */
  async updateBarberProfile(id: number, data: any) {
    return this.request(`/barbeiro/perfil/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * Mapeia o status de agendamento do backend para um formato de frontend mais amigável.
   * @param {string} status - O status do agendamento retornado pelo backend.
   * @returns {string} - O status mapeado para o frontend ('scheduled', 'completed', 'cancelled').
   */
  private mapStatusToFrontend(status: string): string {
    switch (status.toLowerCase()) {
      case 'confirmado':
        return 'scheduled';
      case 'realizado':
        return 'completed';
      case 'cancelado':
        return 'cancelled';
      default:
        return 'scheduled';
    }
  }
}

export const apiService = new ApiService();
export type { LoginResponse, ApiError };


