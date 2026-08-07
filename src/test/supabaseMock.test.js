import { describe, it, expect, beforeEach } from 'vitest';
import { createSupabaseMock } from './supabaseMock';

// Estos tests verifican el mock en si. Si el mock miente, todos los tests que
// dependan de el dan verde con la app rota, asi que vale la pena fijarlo.

describe('createSupabaseMock', () => {
  let supabase;

  beforeEach(() => {
    supabase = createSupabaseMock();
  });

  it('resuelve con el resultado que le fijan', async () => {
    const orders = [{ id: '1', name: 'Kiosco Luna' }];
    supabase.__setResult({ data: orders });

    const { data, error } = await supabase.from('orders').select('*');

    expect(data).toEqual(orders);
    expect(error).toBeNull();
  });

  it('devuelve una lista vacia si no le fijan nada', async () => {
    const { data, error } = await supabase.from('orders').select('*');

    expect(data).toEqual([]);
    expect(error).toBeNull();
  });

  it('consume los resultados encolados en orden', async () => {
    supabase.__queueResult({ data: [{ id: 'pendiente' }] });
    supabase.__queueResult({ data: [{ id: 'impreso' }] });

    const primera = await supabase.from('orders').select('*');
    const segunda = await supabase.from('orders').select('*');

    expect(primera.data).toEqual([{ id: 'pendiente' }]);
    expect(segunda.data).toEqual([{ id: 'impreso' }]);
  });

  it('propaga errores', async () => {
    supabase.__setResult({ data: null, error: { message: 'boom' } });

    const { error } = await supabase.from('orders').insert({ id: '1' });

    expect(error.message).toBe('boom');
  });

  it('registra la cadena completa de una consulta', async () => {
    await supabase
      .from('orders')
      .select('*')
      .eq('printed', false)
      .order('date', { ascending: true });

    expect(supabase.__chain().map((c) => c.method)).toEqual([
      'select',
      'eq',
      'order',
    ]);
    expect(supabase.from).toHaveBeenCalledWith('orders');
    expect(supabase.__argsOf('eq')).toEqual(['printed', false]);
    expect(supabase.__argsOf('order')).toEqual(['date', { ascending: true }]);
  });

  it('__called encuentra una llamada con argumentos exactos', async () => {
    await supabase.from('orders').select('*').eq('seller_id', 'eduardo');

    expect(supabase.__called('eq', 'seller_id', 'eduardo')).toBe(true);
    expect(supabase.__called('eq', 'seller_id', 'carlos')).toBe(false);
  });

  it('encadena varias guardas en un delete', async () => {
    await supabase
      .from('orders')
      .delete()
      .eq('id', 'abc')
      .eq('seller_id', 'eduardo')
      .eq('printed', false)
      .select();

    const chain = supabase.__chain();
    expect(chain.map((c) => c.method)).toEqual([
      'delete',
      'eq',
      'eq',
      'eq',
      'select',
    ]);
    expect(supabase.__called('eq', 'printed', false)).toBe(true);
  });

  it('separa las cadenas de consultas distintas', async () => {
    await supabase.from('orders').select('*').eq('printed', false);
    await supabase.from('orders').select('*').eq('printed', true);

    expect(supabase.__argsOf('eq', 0)).toEqual(['printed', false]);
    expect(supabase.__argsOf('eq', 1)).toEqual(['printed', true]);
  });

  it('registra los canales de realtime y dispara sus handlers', () => {
    const visto = [];
    supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', table: 'orders' }, (p) => visto.push(p))
      .subscribe();

    expect(supabase.__channels).toHaveLength(1);
    expect(supabase.__channels[0].subscribe).toHaveBeenCalled();

    supabase.__emit({ eventType: 'INSERT' });

    expect(visto).toEqual([{ eventType: 'INSERT' }]);
  });

  it('__reset deja el mock como recien creado', async () => {
    supabase.__setResult({ data: [{ id: '1' }] });
    await supabase.from('orders').select('*');

    supabase.__reset();

    expect(supabase.__calls).toHaveLength(0);
    const { data } = await supabase.from('orders').select('*');
    expect(data).toEqual([]);
  });
});
