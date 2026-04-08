import type { LoginResponse } from '../services/api';
import type { User } from '../types';

export function mapTipoUsuarioToRole(tipoUsuario: string): User['role'] {
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

export function mapLoginResponseToUser(response: LoginResponse): User {
  return {
    id: response.id.toString(),
    email: response.email,
    name: response.nome,
    role: mapTipoUsuarioToRole(response.tipoUsuario),
    barbeariaId: response.barbeariaId,
    created_at: new Date().toISOString(),
  };
}

export function getUserBarbershopId(user: User | null): number | null {
  if (!user || typeof user.barbeariaId !== 'number' || user.barbeariaId <= 0) {
    return null;
  }

  return user.barbeariaId;
}

export function requireUserBarbershopId(user: User | null): number {
  const barbershopId = getUserBarbershopId(user);

  if (!barbershopId) {
    throw new Error('ID da barbearia não encontrado nos dados do usuário.');
  }

  return barbershopId;
}
