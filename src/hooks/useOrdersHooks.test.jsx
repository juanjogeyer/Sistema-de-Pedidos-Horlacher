import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// El mock reemplaza al cliente real; el resto de la app no se entera.
vi.mock('../lib/supabase', async () => {
  const { createSupabaseMock } = await vi.importActual('../test/supabaseMock');
  return { supabase: createSupabaseMock() };
});
vi.mock('../lib/telegram', () => ({ notificarPedido: vi.fn() }));

import { supabase } from '../lib/supabase';
import { notificarPedido } from '../lib/telegram';
import { useOrdersQuery } from './useOrdersQuery';
import { useVendorOrders } from './useVendorOrders';
import { useAdminOrders } from './useAdminOrders';

const eduardo = { id: 'eduardo', name: 'Eduardo Horlacher', role: 'vendedor' };

const pedido = (over = {}) => ({
  id: 'p1',
  name: 'Kiosco Luna',
  billing: '9 + IVA',
  express: 'TransFer',
  date: '2026-08-07T10:00:00Z',
  printed: false,
  seller_id: 'eduardo',
  cart: [{ code: '0007', name: 'Bolita', quantity: 2 }],
  ...over,
});

// Espera a que termine el fetch inicial que dispara useOrdersQuery al montar.
const settle = () => waitFor(() => expect(supabase.from).toHaveBeenCalled());

beforeEach(() => {
  supabase.__reset();
  vi.clearAllMocks();
});

describe('useOrdersQuery', () => {
  it('trae pendientes e historial al montar', async () => {
    renderHook(() => useOrdersQuery());
    await settle();

    expect(supabase.__called('eq', 'printed', false)).toBe(true);
    expect(supabase.__called('eq', 'printed', true)).toBe(true);
  });

  it('ordena los pendientes de mas viejo a mas nuevo: es una cola', async () => {
    renderHook(() => useOrdersQuery());
    await settle();

    expect(supabase.__called('order', 'date', { ascending: true })).toBe(true);
  });

  it('ordena el historial de mas nuevo a mas viejo: es una consulta', async () => {
    renderHook(() => useOrdersQuery());
    await settle();

    expect(supabase.__called('order', 'date', { ascending: false })).toBe(true);
  });

  it('se suscribe al realtime y se desuscribe al desmontar', async () => {
    const { unmount } = renderHook(() => useOrdersQuery());
    await settle();

    expect(supabase.__channels).toHaveLength(1);
    unmount();
    expect(supabase.removeChannel).toHaveBeenCalled();
  });
});

describe('useVendorOrders', () => {
  // Caso 4 del spec: el vendedor solo ve lo suyo.
  it('filtra las dos listas por su seller_id', async () => {
    renderHook(() => useVendorOrders(eduardo));
    await settle();

    expect(supabase.__called('eq', 'seller_id', 'eduardo')).toBe(true);
    expect(supabase.__called('eq', 'seller_id', 'carlos')).toBe(false);
  });

  it('addOrder le pone el seller_id de la sesion', async () => {
    const { result } = renderHook(() => useVendorOrders(eduardo));
    await settle();

    await act(async () => {
      await result.current.addOrder({ name: 'Kiosco Luna', cart: [] });
    });

    const [insertado] = supabase.__argsOf('insert');
    expect(insertado.seller_id).toBe('eduardo');
    expect(insertado.printed).toBe(false);
  });

  it('avisa por Telegram despues de guardar', async () => {
    const { result } = renderHook(() => useVendorOrders(eduardo));
    await settle();

    await act(async () => {
      await result.current.addOrder({ name: 'Kiosco Luna', cart: [] });
    });

    expect(notificarPedido).toHaveBeenCalledOnce();
  });

  it('un Telegram caido no invalida el pedido, que ya esta guardado', async () => {
    notificarPedido.mockRejectedValueOnce(new Error('telegram caido'));
    const { result } = renderHook(() => useVendorOrders(eduardo));
    await settle();

    let outcome;
    await act(async () => {
      outcome = await result.current.addOrder({ name: 'Kiosco Luna', cart: [] });
    });

    expect(outcome.ok).toBe(true);
  });

  it('si falla el insert avisa y saca el pedido de la lista', async () => {
    const { result } = renderHook(() => useVendorOrders(eduardo));
    await settle();
    supabase.__setResult({ data: null, error: { message: 'sin conexion' } });

    let outcome;
    await act(async () => {
      outcome = await result.current.addOrder({ name: 'Kiosco Luna', cart: [] });
    });

    expect(outcome.ok).toBe(false);
    expect(outcome.error).toMatch(/no se pudo enviar/i);
    expect(result.current.orders).toHaveLength(0);
  });

  // Caso 7 del spec.
  it('cancelOrder lleva las tres guardas', async () => {
    const { result } = renderHook(() => useVendorOrders(eduardo));
    await settle();
    supabase.__setResult({ data: [pedido()] });

    await act(async () => {
      await result.current.cancelOrder('p1');
    });

    expect(supabase.__called('eq', 'id', 'p1')).toBe(true);
    expect(supabase.__called('eq', 'seller_id', 'eduardo')).toBe(true);
    expect(supabase.__called('eq', 'printed', false)).toBe(true);
  });

  it('cancelar algo ya impreso avisa en vez de fallar en silencio', async () => {
    const { result } = renderHook(() => useVendorOrders(eduardo));
    await settle();
    // Cero filas afectadas: el admin lo imprimio entre el render y el click.
    supabase.__setResult({ data: [] });

    let outcome;
    await act(async () => {
      outcome = await result.current.cancelOrder('p1');
    });

    expect(outcome.ok).toBe(false);
    expect(outcome.error).toMatch(/ya fue impreso/i);
  });

  it('no expone imprimir', async () => {
    const { result } = renderHook(() => useVendorOrders(eduardo));
    await settle();

    expect(result.current.printOrder).toBeUndefined();
    expect(result.current.deleteHistoryOrder).toBeUndefined();
  });
});

describe('useAdminOrders', () => {
  // Caso 5 del spec: el admin ve todo.
  it('no filtra por vendedor', async () => {
    renderHook(() => useAdminOrders());
    await settle();

    const filtroPorVendedor = supabase.__calls.some(
      (c) => c.method === 'eq' && c.args[0] === 'seller_id'
    );
    expect(filtroPorVendedor).toBe(false);
  });

  // Caso 6 del spec.
  it('printOrder solo marca lo que todavia no esta impreso', async () => {
    const { result } = renderHook(() => useAdminOrders());
    await settle();
    supabase.__setResult({ data: [pedido({ printed: true })] });

    await act(async () => {
      await result.current.printOrder('p1');
    });

    expect(supabase.__argsOf('update')).toEqual([{ printed: true }]);
    expect(supabase.__called('eq', 'printed', false)).toBe(true);
  });

  it('imprimir algo que el vendedor cancelo avisa', async () => {
    const { result } = renderHook(() => useAdminOrders());
    await settle();
    supabase.__setResult({ data: [] });

    let outcome;
    await act(async () => {
      outcome = await result.current.printOrder('p1');
    });

    expect(outcome.ok).toBe(false);
    expect(outcome.error).toMatch(/lo canceló/i);
  });

  it('no expone cargar pedidos', async () => {
    const { result } = renderHook(() => useAdminOrders());
    await settle();

    expect(result.current.addOrder).toBeUndefined();
    expect(result.current.cancelOrder).toBeUndefined();
  });
});
