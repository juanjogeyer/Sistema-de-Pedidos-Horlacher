import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useActionError } from './useActionError';

const ok = { ok: true, error: null };
const fail = (error) => ({ ok: false, error });

describe('useActionError', () => {
  it('arranca sin error', () => {
    const { result } = renderHook(() => useActionError());

    expect(result.current.error).toBeNull();
  });

  it('una accion que sale bien no deja error', async () => {
    const { result } = renderHook(() => useActionError());

    await act(async () => {
      await result.current.run(async () => ok);
    });

    expect(result.current.error).toBeNull();
  });

  it('guarda el mensaje de la accion que fallo', async () => {
    const { result } = renderHook(() => useActionError());

    await act(async () => {
      await result.current.run(async () => fail('Ese pedido ya fue impreso.'));
    });

    expect(result.current.error.message).toBe('Ese pedido ya fue impreso.');
  });

  it('devuelve el resultado a quien lo llamo', async () => {
    const { result } = renderHook(() => useActionError());

    let outcome;
    await act(async () => {
      outcome = await result.current.run(async () => fail('no anduvo'));
    });

    expect(outcome.ok).toBe(false);
  });

  it('reintentar vuelve a correr la misma accion', async () => {
    const action = vi.fn().mockResolvedValueOnce(fail('sin conexion')).mockResolvedValueOnce(ok);
    const { result } = renderHook(() => useActionError());

    await act(async () => {
      await result.current.run(action);
    });
    expect(result.current.error.message).toBe('sin conexion');

    await act(async () => {
      await result.current.error.retry();
    });

    expect(action).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
  });

  it('una accion posterior que sale bien limpia el error anterior', async () => {
    const { result } = renderHook(() => useActionError());

    await act(async () => {
      await result.current.run(async () => fail('primero fallo'));
    });
    await act(async () => {
      await result.current.run(async () => ok);
    });

    expect(result.current.error).toBeNull();
  });

  it('se puede cerrar el aviso a mano', async () => {
    const { result } = renderHook(() => useActionError());

    await act(async () => {
      await result.current.run(async () => fail('algo fallo'));
    });
    act(() => {
      result.current.clear();
    });

    expect(result.current.error).toBeNull();
  });

  it('tolera acciones que no devuelven nada', async () => {
    const { result } = renderHook(() => useActionError());

    await act(async () => {
      await result.current.run(async () => undefined);
    });

    expect(result.current.error).toBeNull();
  });
});
