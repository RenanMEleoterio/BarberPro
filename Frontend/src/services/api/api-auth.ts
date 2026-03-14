import { HttpClient } from './httpClient';

export interface LoginResponse {
  id: number;
  nome: string;
  email: string;
  tipoUsuario: string;
  barbeariaId?: number;
  nomeBarbearia?: string;
  token: string;
}

export const AuthAPI = {
  async login(email: string, password: string): Promise<LoginResponse> {
    return HttpClient.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        senha: password,
        tipoUsuario: 'Cliente'
      }),
    });
  },

  async register(
    email: string,
    password: string,
    name: string,
    role: 'client' | 'barber' | 'manager',
    barbershopCode?: string,
    barbershopName?: string,
    barbershopAddress?: string,
    barbershopPhone?: string
  ): Promise<LoginResponse> {
    if (role === 'manager') {
      if (!barbershopName || !barbershopAddress || !barbershopPhone) {
        throw new Error('Nome, endereço e telefone da barbearia são obrigatórios para gerentes');
      }
      return this.registerBarbershop(barbershopName, email, password, barbershopAddress, barbershopPhone);
    }

    const endpoint = role === 'client' ? '/auth/cadastro-cliente' : '/auth/cadastro-barbeiro';
    const body: any = { nome: name, email, senha: password };

    if (role === 'barber') {
      if (!barbershopCode) throw new Error('Código da barbearia é obrigatório para barbeiros');
      body.codigoBarbearia = barbershopCode;
      body.especialidades = '';
      body.descricao = '';
    }

    return HttpClient.request<LoginResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async registerBarber(email: string, password: string, name: string, barbershopCode: string, specialties?: string, description?: string): Promise<LoginResponse> {
    const body = {
      nome: name,
      email,
      senha: password,
      codigoBarbearia: barbershopCode,
      especialidades: specialties || '',
      descricao: description || ''
    };

    return HttpClient.request<LoginResponse>('/auth/cadastro-barbeiro', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async registerBarbershop(name: string, email: string, password: string, address: string, phone: string): Promise<LoginResponse> {
    const body = { nome: name, endereco: address, telefone: phone, email, senha: password };
    return HttpClient.request<LoginResponse>("/auth/cadastro-barbearia", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async googleAuth(
    idToken: string,
    userType: 'Cliente' | 'Barbeiro' | 'Gerente',
    additionalData?: { codigoConvite?: string; especialidades?: string; descricao?: string; endereco?: string; telefone?: string; }
  ): Promise<LoginResponse> {
    const body = { idToken, tipoUsuario: userType, ...additionalData };
    return HttpClient.request<LoginResponse>('/auth/google-auth', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
};
