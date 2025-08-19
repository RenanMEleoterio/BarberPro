import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { apiService, LoginResponse } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (
    email: string,
    password: string,
    name: string,
    role: 'client' | 'barber' | 'manager',
    barbershopCode?: string
  ) => Promise<User>;
  signUpBarber: (
    email: string,
    password: string,
    name: string,
    barbershopCode: string,
    specialties?: string,
    description?: string
  ) => Promise<User>;
  // Aceita chamada curta (name, email, password) opcionalmente com address e phone
  signUpBarbershop: (
    name: string,
    email: string,
    password: string,
    address: string,
    phone: string
  ) => Promise<User>;
  signInWithGoogle: (
    idToken: string,
    userType: 'Cliente' | 'Barbeiro' | 'Gerente',
    additionalData?: {
      codigoConvite?: string;
      especialidades?: string;
      descricao?: string;
      endereco?: string;
      telefone?: string;
    }
  ) => Promise<User>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const signIn = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const response: LoginResponse = await apiService.login(email, password);
      
      // Configurar token no serviço de API
      apiService.setToken(response.token);
      
      // Mapear resposta da API para formato do frontend
      const mappedUser: User = {
        id: response.id.toString(),
        email: response.email,
        name: response.nome,
        role: mapTipoUsuarioToRole(response.tipoUsuario),
        barbeariaId: response.barbeariaId,
        created_at: new Date().toISOString(),
      };
      
      setUser(mappedUser);
      return mappedUser;
    } catch (error) {
      console.error('Erro no login:', error);
      throw new Error('Email ou senha inválidos');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: 'client' | 'barber' | 'manager',
    barbershopCode?: string
  ): Promise<User> => {
    setLoading(true);
    try {
      const response: LoginResponse = await apiService.register(email, password, name, role, barbershopCode);
      
      apiService.setToken(response.token);
      
      const mappedUser: User = {
        id: response.id.toString(),
        email: response.email,
        name: response.nome,
        role: mapTipoUsuarioToRole(response.tipoUsuario),
        barbeariaId: response.barbeariaId,
        created_at: new Date().toISOString(),
      };
      
      setUser(mappedUser);
      return mappedUser;
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      // Preservar mensagem detalhada do backend quando possível
      if (error?.message) {
        throw new Error(error.message);
      }
      throw new Error('Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const signUpBarber = async (email: string, password: string, name: string, barbershopCode: string, specialties?: string, description?: string): Promise<User> => {
    setLoading(true);
    try {
      const response: LoginResponse = await apiService.registerBarber(email, password, name, barbershopCode, specialties, description);
      
      // Configurar token no serviço de API
      apiService.setToken(response.token);
      
      // Mapear resposta da API para formato do frontend
      const mappedUser: User = {
        id: response.id.toString(),
        email: response.email,
        name: response.nome,
        role: mapTipoUsuarioToRole(response.tipoUsuario),
        barbeariaId: response.barbeariaId,
        created_at: new Date().toISOString(),
      };
      
      setUser(mappedUser);
      return mappedUser;
    } catch (error) {
      console.error("Erro no cadastro de barbeiro:", error);
      throw new Error("Erro ao criar conta de barbeiro");
    } finally {
      setLoading(false);
    }
  };

  const signUpBarbershop = async (name: string, email: string, password: string, address: string, phone: string): Promise<User> => {
    setLoading(true);
    try {
      const response: LoginResponse = await apiService.registerBarbershop(name, address, phone, email, password);
      
      // Configurar token no serviço de API
      apiService.setToken(response.token);
      
      // Mapear resposta da API para formato do frontend
      const mappedUser: User = {
        id: response.id.toString(),
        email: response.email,
        name: response.nome,
        role: mapTipoUsuarioToRole(response.tipoUsuario),
        barbeariaId: response.barbeariaId,
        created_at: new Date().toISOString(),
      };
      
      setUser(mappedUser);
      return mappedUser;
    } catch (error: any) {
      console.error("Erro no cadastro de barbearia:", error);
      if (error?.message) {
        throw new Error(error.message);
      }
      throw new Error("Erro ao criar conta de barbearia");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (
    idToken: string,
    userType: 'Cliente' | 'Barbeiro' | 'Gerente',
    additionalData?: {
      codigoConvite?: string;
      especialidades?: string;
      descricao?: string;
      endereco?: string;
      telefone?: string;
    }
  ): Promise<User> => {
    setLoading(true);
    try {
      const response: LoginResponse = await apiService.googleAuth(idToken, userType, additionalData);
      
      // Configurar token no serviço de API
      apiService.setToken(response.token);
      
      // Mapear resposta da API para formato do frontend
      const mappedUser: User = {
        id: response.id.toString(),
        email: response.email,
        name: response.nome,
        role: mapTipoUsuarioToRole(response.tipoUsuario),
        barbeariaId: response.barbeariaId,
        created_at: new Date().toISOString(),
      };
      
      setUser(mappedUser);
      return mappedUser;
    } catch (error: any) {
      console.error('Erro na autenticação Google:', error);
      if (error?.message) {
        throw new Error(error.message);
      }
      throw new Error('Erro ao autenticar com Google');
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    apiService.clearToken();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signUpBarber, signUpBarbershop, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

function mapTipoUsuarioToRole(tipoUsuario: string): 'client' | 'barber' | 'manager' {
  switch (tipoUsuario.toLowerCase()) {
    case 'cliente':
      return 'client';
    case 'barbeiro':
      return 'barber';
    case 'gerente':
      return 'manager';
    default:
      return 'client';
  }
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


