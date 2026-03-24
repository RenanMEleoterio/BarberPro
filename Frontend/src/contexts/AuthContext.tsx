import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { apiService, LoginResponse } from '../services/api';

/**
 * Define a interface para o contexto de autenticação, especificando os dados e funções disponíveis.
 */
interface AuthContextType {
  user: User | null; // O objeto do usuário autenticado, ou null se não houver usuário.
  loading: boolean; // Indica se uma operação de autenticação está em andamento.
  signIn: (email: string, password: string) => Promise<User>; // Função para realizar o login.
  signUp: ( // Função para realizar o cadastro genérico.
    email: string,
    password: string,
    name: string,
    role: 'client' | 'barber' | 'manager',
    barbershopCode?: string
  ) => Promise<User>;
  signUpBarber: ( // Função para realizar o cadastro de um barbeiro.
    email: string,
    password: string,
    name: string,
    barbershopCode: string,
    specialties?: string,
    description?: string
  ) => Promise<User>;
  signUpBarbershop: ( // Função para realizar o cadastro de uma barbearia (e seu gerente).
    name: string,
    email: string,
    password: string,
    address: string,
    phone: string
  ) => Promise<User>;
  signInWithGoogle: ( // Função para realizar o login/cadastro via Google.
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
  signOut: () => void; // Função para realizar o logout.
}

// Cria o contexto de autenticação com um valor inicial indefinido.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provedor de autenticação que gerencia o estado do usuário e as operações de autenticação.
 * @param {React.ReactNode} children - Os componentes filhos que terão acesso ao contexto.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Estado para armazenar o usuário autenticado, inicializado a partir do localStorage.
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  // Estado para controlar o status de carregamento das operações de autenticação.
  const [loading, setLoading] = useState(false);

  // Efeito para persistir o estado do usuário no localStorage sempre que ele muda.
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  /**
   * Realiza o login de um usuário com email e senha.
   * @param {string} email - O email do usuário.
   * @param {string} password - A senha do usuário.
   * @returns {Promise<User>} - Uma promessa que resolve com o objeto do usuário autenticado.
   * @throws {Error} - Lança um erro se o login falhar.
   */
  const signIn = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const response: LoginResponse = await apiService.login(email, password);
      
      // Configura o token JWT no serviço de API para futuras requisições autenticadas.
      apiService.setToken(response.token);
      
      // Mapeia a resposta da API para o formato de usuário esperado pelo frontend.
      const mappedUser: User = {
        id: response.id.toString(),
        email: response.email,
        name: response.nome,
        role: mapTipoUsuarioToRole(response.tipoUsuario), // Converte o tipo de usuário do backend para o role do frontend.
        barbeariaId: response.barbeariaId,
        created_at: new Date().toISOString(),
      };
      
      setUser(mappedUser); // Atualiza o estado do usuário.
      return mappedUser;
    } catch (error: any) {
      console.error('Erro no login:', error);
      if (error?.message) {
        throw new Error(error.message);
      }
      throw new Error('Email ou senha inválidos');
    } finally {
      setLoading(false); // Finaliza o estado de carregamento.
    }
  };

  /**
   * Realiza o cadastro de um novo usuário (cliente, barbeiro ou gerente).
   * @param {string} email - O email do novo usuário.
   * @param {string} password - A senha do novo usuário.
   * @param {string} name - O nome do novo usuário.
   * @param {'client' | 'barber' | 'manager'} role - O tipo de papel do usuário.
   * @param {string} [barbershopCode] - Opcional: código da barbearia para barbeiros.
   * @returns {Promise<User>} - Uma promessa que resolve com o objeto do usuário recém-cadastrado.
   * @throws {Error} - Lança um erro se o cadastro falhar.
   */
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
      // Preserva a mensagem de erro detalhada do backend, se disponível.
      if (error?.message) {
        throw new Error(error.message);
      }
      throw new Error('Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Realiza o cadastro de um novo barbeiro.
   * @param {string} email - O email do barbeiro.
   * @param {string} password - A senha do barbeiro.
   * @param {string} name - O nome do barbeiro.
   * @param {string} barbershopCode - O código de convite da barbearia.
   * @param {string} [specialties] - Opcional: especialidades do barbeiro.
   * @param {string} [description] - Opcional: descrição do barbeiro.
   * @returns {Promise<User>} - Uma promessa que resolve com o objeto do barbeiro recém-cadastrado.
   * @throws {Error} - Lança um erro se o cadastro falhar.
   */
  const signUpBarber = async (email: string, password: string, name: string, barbershopCode: string, specialties?: string, description?: string): Promise<User> => {
    setLoading(true);
    try {
      const response: LoginResponse = await apiService.registerBarber(email, password, name, barbershopCode, specialties, description);
      
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
    } catch (error) {
      console.error("Erro no cadastro de barbeiro:", error);
      throw new Error("Erro ao criar conta de barbeiro");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Realiza o cadastro de uma nova barbearia e seu gerente.
   * @param {string} name - O nome da barbearia.
   * @param {string} email - O email do gerente da barbearia.
   * @param {string} password - A senha do gerente da barbearia.
   * @param {string} address - O endereço da barbearia.
   * @param {string} phone - O telefone da barbearia.
   * @returns {Promise<User>} - Uma promessa que resolve com o objeto do gerente recém-cadastrado.
   * @throws {Error} - Lança um erro se o cadastro falhar.
   */
  const signUpBarbershop = async (name: string, email: string, password: string, address: string, phone: string): Promise<User> => {
    setLoading(true);
    try {
      const response: LoginResponse = await apiService.registerBarbershop(name, address, phone, email, password);
      
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
      console.error("Erro no cadastro de barbearia:", error);
      if (error?.message) {
        throw new Error(error.message);
      }
      throw new Error("Erro ao criar conta de barbearia");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Realiza o login ou cadastro de um usuário utilizando o Google OAuth.
   * @param {string} idToken - O token de ID do Google.
   * @param {'Cliente' | 'Barbeiro' | 'Gerente'} userType - O tipo de usuário a ser criado/autenticado.
   * @param {object} [additionalData] - Dados adicionais para o cadastro (código de convite, especialidades, etc.).
   * @returns {Promise<User>} - Uma promessa que resolve com o objeto do usuário autenticado.
   * @throws {Error} - Lança um erro se a autenticação falhar.
   */
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
      console.error('Erro na autenticação Google:', error);
      if (error?.message) {
        throw new Error(error.message);
      }
      throw new Error('Erro ao autenticar com Google');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Realiza o logout do usuário.
   * Limpa o estado do usuário e remove o token do serviço de API e do localStorage.
   */
  const signOut = () => {
    setUser(null);
    apiService.clearToken();
  };

  /**
   * Efeito global para escutar expiração de JWT.
   * O utilitário httpClient despacha esse evento se receber HTTP 401.
   */
  useEffect(() => {
    const handleUnauthorized = () => {
      signOut();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signUpBarber, signUpBarbershop, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Função auxiliar para mapear o tipo de usuário retornado pelo backend para o formato de role usado no frontend.
 * @param {string} tipoUsuario - O tipo de usuário retornado pela API (ex: "Cliente", "Barbeiro", "Gerente").
 * @returns {'client' | 'barber' | 'manager'} - O role correspondente no frontend.
 */
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

/**
 * Hook personalizado para consumir o contexto de autenticação.
 * Garante que o hook seja usado dentro de um AuthProvider.
 * @returns {AuthContextType} - O objeto do contexto de autenticação.
 * @throws {Error} - Lança um erro se o hook for usado fora de um AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


