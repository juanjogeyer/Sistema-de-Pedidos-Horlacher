import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';
import { AuthProvider } from '../components/auth/AuthProvider';
import { sellerName } from '../config/users';

const STORAGE_KEY = 'pedidos.session';

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

const mount = () => renderHook(() => useAuth(), { wrapper });

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('arranca sin sesion', () => {
    const { result } = mount();

    expect(result.current.user).toBeNull();
  });

  // Caso 1 del spec.
  it('resuelve el id guardado contra USERS', () => {
    localStorage.setItem(STORAGE_KEY, 'eduardo');

    const { result } = mount();

    expect(result.current.user).toEqual({
      id: 'eduardo',
      name: 'Eduardo Horlacher',
      role: 'vendedor',
    });
  });

  it('un id guardado que ya no existe limpia la sesion', () => {
    localStorage.setItem(STORAGE_KEY, 'alguien-que-se-fue');

    const { result } = mount();

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  // Caso 2 del spec.
  it('sobrevive a un localStorage que tira excepcion', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('storage no disponible');
    });
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('storage no disponible');
    });

    const { result } = mount();
    expect(result.current.user).toBeNull();

    // Y se puede loguear igual: lo que se pierde es la persistencia, no el uso.
    act(() => {
      expect(result.current.login('carlos', '003')).toBe(true);
    });
    expect(result.current.user.id).toBe('carlos');
  });

  // Caso 3 del spec.
  it('entra con el PIN correcto y lo persiste', () => {
    const { result } = mount();

    act(() => {
      expect(result.current.login('eduardo', '002')).toBe(true);
    });

    expect(result.current.user.name).toBe('Eduardo Horlacher');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('eduardo');
  });

  it('rechaza el PIN incorrecto sin dejar sesion', () => {
    const { result } = mount();

    act(() => {
      expect(result.current.login('eduardo', '999')).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('rechaza un usuario que no existe', () => {
    const { result } = mount();

    act(() => {
      expect(result.current.login('nadie', '002')).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });

  it('no acepta el PIN de otro usuario', () => {
    const { result } = mount();

    // 001 es el PIN del admin, no el de Eduardo.
    act(() => {
      expect(result.current.login('eduardo', '001')).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });

  it('nunca expone ni persiste el PIN', () => {
    const { result } = mount();

    act(() => {
      result.current.login('admin', '001');
    });

    expect(result.current.user.pin).toBeUndefined();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('admin');
  });

  it('salir borra la sesion de memoria y de localStorage', () => {
    const { result } = mount();

    act(() => {
      result.current.login('admin', '001');
    });
    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('falla claro si se usa fuera del provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/);
  });
});

describe('sellerName', () => {
  it('traduce el slug a nombre para mostrar', () => {
    expect(sellerName('carlos')).toBe('Carlos Riera');
  });

  it('devuelve el slug crudo si el vendedor ya no esta en la lista', () => {
    expect(sellerName('un-vendedor-viejo')).toBe('un-vendedor-viejo');
  });
});
