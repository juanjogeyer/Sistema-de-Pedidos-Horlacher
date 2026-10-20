import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { notificarPedido } from './telegram';

const order = {
  id: 'a1',
  name: 'Kiosco Luna',
  billing: '9 + IVA',
  express: 'TransFer',
  seller_id: 'eduardo',
  cart: [{ code: '0007', name: 'Bolita', qty: 2 }],
};

let fetchMock;

// El texto enviado, para no repetir el desarmado del body en cada test.
function mensajeEnviado() {
  const [, options] = fetchMock.mock.calls[0];
  return JSON.parse(options.body).text;
}

describe('notificarPedido', () => {
  beforeEach(() => {
    fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('nombra al vendedor antes que al cliente', async () => {
    await notificarPedido(order);

    const texto = mensajeEnviado();
    expect(texto).toContain('*Vendedor:* Eduardo Horlacher');
    expect(texto.indexOf('Vendedor:')).toBeLessThan(texto.indexOf('Cliente:'));
  });

  it('cae al slug si ese vendedor ya no esta en la lista', async () => {
    await notificarPedido({ ...order, seller_id: 'un-vendedor-viejo' });

    expect(mensajeEnviado()).toContain('*Vendedor:* un-vendedor-viejo');
  });

  it('omite la linea si el pedido no tiene vendedor', async () => {
    await notificarPedido({ ...order, seller_id: null });

    expect(mensajeEnviado()).not.toContain('Vendedor:');
  });

  it('incluye cliente, facturacion, expreso y total de items', async () => {
    await notificarPedido(order);

    const texto = mensajeEnviado();
    expect(texto).toContain('Kiosco Luna');
    expect(texto).toContain('9 + IVA');
    expect(texto).toContain('TransFer');
    expect(texto).toContain('*Total de ítems:* 2');
  });

  it('tira si la API de Telegram responde error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        json: async () => ({ description: 'chat not found' }),
      }))
    );

    await expect(notificarPedido(order)).rejects.toThrow(/chat not found/);
  });
});
