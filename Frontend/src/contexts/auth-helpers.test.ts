import { describe, expect, it, vi } from 'vitest';
import {
  getUserBarbershopId,
  mapLoginResponseToUser,
  mapTipoUsuarioToRole,
  requireUserBarbershopId,
} from './auth-helpers';

describe('auth-helpers', () => {
  it('deve mapear o tipo de usuário do backend para o role do frontend', () => {
    expect(mapTipoUsuarioToRole('Cliente')).toBe('client');
    expect(mapTipoUsuarioToRole('Barbeiro')).toBe('barber');
    expect(mapTipoUsuarioToRole('Gerente')).toBe('manager');
  });

  it('deve mapear o payload de login para o formato de usuário consumido no frontend', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-22T12:00:00Z'));

    expect(
      mapLoginResponseToUser({
        id: 7,
        nome: 'Usuário Teste',
        email: 'teste@barberpro.com',
        tipoUsuario: 'Barbeiro',
        barbeariaId: 12,
        token: 'jwt-token',
      })
    ).toEqual({
      id: '7',
      email: 'teste@barberpro.com',
      name: 'Usuário Teste',
      role: 'barber',
      barbeariaId: 12,
      created_at: '2024-01-22T12:00:00.000Z',
    });

    vi.useRealTimers();
  });

  it('deve retornar o id da barbearia do usuario autenticado quando existir', () => {
    expect(
      getUserBarbershopId({
        id: '1',
        email: 'manager@barberpro.com',
        name: 'Manager',
        role: 'manager',
        barbeariaId: 9,
        created_at: '2024-01-22T12:00:00.000Z',
      })
    ).toBe(9);
  });

  it('deve falhar quando o usuario nao estiver vinculado a uma barbearia', () => {
    expect(() =>
      requireUserBarbershopId({
        id: '1',
        email: 'client@barberpro.com',
        name: 'Cliente',
        role: 'client',
        created_at: '2024-01-22T12:00:00.000Z',
      })
    ).toThrow('ID da barbearia não encontrado nos dados do usuário.');
  });
});
