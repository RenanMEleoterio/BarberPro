const API_BASE_URL = 'https://5000-i6hlr8op2p9tna9zvgf0u-625be998.manusvm.computer/api';

interface LoginRequest {
  email: string;
  senha: string;
  tipoUsuario: string;
}

interface LoginResponse {
  id: number;
  nome: string;
  email: string;
  tipoUsuario: string;
  barbeariaId?: number;
  nomeBarbearia?: string;
  token: string;
}

interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }
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

  // Auth endpoints
  async login(email: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        senha: password,
        tipoUsuario: 'Cliente' // Por padrão, assumir cliente
      }),
    });
  }

  async register(email: string, password: string, name: string, role: 'client' | 'barber' | 'manager', barbershopCode?: string): Promise<LoginResponse> {
    const endpoint = role === 'client' ? '/auth/cadastro-cliente' : 
                    role === 'barber' ? '/auth/cadastro-barbeiro' : 
                    '/auth/cadastro-gerente';
    
    const body: any = {
      nome: name,
      email,
      senha: password
    };

    // Adicionar campos específicos baseado no tipo de usuário
    if (role === 'barber') {
      if (!barbershopCode) {
        throw new Error('Código da barbearia é obrigatório para barbeiros');
      }
      body.codigoConvite = barbershopCode;
      body.especialidades = '';
      body.descricao = '';
    } else if (role === 'manager') {
      body.barbeariaId = 1; // ID temporário - deve ser fornecido pelo usuário
    }

    return this.request<LoginResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async registerBarber(email: string, password: string, name: string, barbershopCode: string, specialties?: string, description?: string): Promise<LoginResponse> {
    const body = {
      nome: name,
      email,
      senha: password,
      codigoConvite: barbershopCode,
      especialidades: specialties || '',
      descricao: description || ''
    };

    return this.request<LoginResponse>('/auth/cadastro-barbeiro', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async registerBarbershop(name: string, address: string, phone: string, email: string, password: string): Promise<LoginResponse> {
    const body = {
      nome: name,
      endereco: address,
      telefone: phone,
      email,
      senha: password
    };

    return this.request<LoginResponse>("/auth/cadastro-barbearia", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

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

  // Dashboard endpoints
  async getClientDashboard(id: number) {
    return this.request(`/dashboard/client/${id}`);
  }

  async getBarberDashboard(id: number) {
    return this.request(`/dashboard/barber/${id}`);
  }

  async getManagerDashboard(barbeariaId: number) {
    return this.request(`/dashboard/manager/${barbeariaId}`);
  }

  // Stats endpoints
  async getBarberStats(id: number, periodo: string = 'semana') {
    return this.request(`/stats/barber/${id}?periodo=${periodo}`);
  }

  async getManagerStats(barbeariaId: number, periodo: string = 'mes') {
    return this.request(`/stats/manager/${barbeariaId}?periodo=${periodo}`);
  }

  // Appointments endpoints
  async getMyAppointments() {
    return this.request('/agendamento/meus-agendamentos');
  }

  async createAppointment(data: any) {
    return this.request('/agendamento', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateAppointmentStatus(id: number, status: string) {
    return this.request(`/agendamento/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  async cancelAppointment(id: number) {
    return this.request(`/agendamento/${id}`, {
      method: 'DELETE'
    });
  }

  async getBarbershops() {
    return this.request('/barbearia');
  }

  async getBarbers(barbeariaId: number) {
    return this.request(`/barbearia/${barbeariaId}/barbeiros`);
  }

  // Endpoints para buscar dados reais do banco
  async getBarbershopsWithDetails() {
    const barbearias = await this.request('/barbearia');
    
    // Para cada barbearia, buscar os barbeiros
    const barbershopsWithBarbers = await Promise.all(
      barbearias.map(async (barbearia: any) => {
        try {
          const barbeiros = await this.getBarbers(barbearia.id);
          return {
            ...barbearia,
            barbers: barbeiros.map((barbeiro: any) => ({
              id: barbeiro.id.toString(),
              name: barbeiro.nome,
              rating: 4.8 // Rating padrão - pode ser implementado no futuro
            })),
            rating: 4.8, // Rating padrão
            image: 'https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg?auto=compress&cs=tinysrgb&w=400', // Imagem padrão
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

  async getMyAppointmentsWithDetails() {
    const agendamentos = await this.getMyAppointments();
    
    return agendamentos.map((agendamento: any) => ({
      id: agendamento.id.toString(),
      barbershop: 'Barbearia', // Nome da barbearia pode ser adicionado no backend
      barber: agendamento.nomeBarbeiro,
      date: agendamento.dataHora.split('T')[0],
      time: agendamento.dataHora.split('T')[1].substring(0, 5),
      status: this.mapStatusToFrontend(agendamento.status),
      service: 'Corte + Barba', // Serviço padrão - pode ser implementado no futuro
      price: 45, // Preço padrão - pode ser implementado no futuro
      address: 'Endereço da barbearia', // Pode ser implementado no futuro
      phone: '(11) 99999-9999', // Telefone padrão
      rating: 4.8 // Rating padrão
    }));
  }

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


