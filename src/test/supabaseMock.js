import { vi } from 'vitest';

// Mock del cliente de Supabase.
//
// La idea: el codigo de produccion arma cadenas como
//
//   supabase.from('orders').select('*').eq('printed', false).order('date', {...})
//
// y despues las await-ea. El mock devuelve un objeto encadenable que registra
// cada eslabon y que, al await-earlo, resuelve con el resultado que le fijemos.
// Asi los tests afirman sobre *la consulta que se arma*, no sobre datos
// inventados: si alguien saca el .eq('seller_id', ...), el test lo ve.

// Metodos que devuelven el mismo builder para seguir encadenando.
const CHAINABLE = [
  'select',
  'insert',
  'update',
  'delete',
  'eq',
  'neq',
  'in',
  'is',
  'order',
  'limit',
  'single',
  'maybeSingle',
];

const EMPTY = { data: [], error: null };

export function createSupabaseMock() {
  /** Toda llamada hecha sobre cualquier builder, en orden. */
  const calls = [];
  /** Cadenas completas, una por cada .from(). */
  const queries = [];
  /** Resultados encolados; se consumen en orden. */
  const queued = [];
  /** Resultado por defecto cuando la cola esta vacia. */
  let fallback = EMPTY;
  /** Filas sembradas: si hay, las consultas se resuelven filtrandolas. */
  let seeded = null;
  /** Canales de realtime creados. */
  const channels = [];

  function nextResult(chain) {
    if (queued.length > 0) return queued.shift();

    // Con filas sembradas el mock deja de devolver lo que le fijaron y aplica
    // los .eq() de verdad. Sin esto, un test de aislamiento entre vendedores
    // pasaria igual aunque el filtro no existiera.
    if (seeded) {
      const filters = chain.filter((call) => call.method === 'eq');
      const data = seeded.filter((row) =>
        filters.every(({ args: [column, value] }) => row[column] === value)
      );
      return { data, error: null };
    }

    return fallback;
  }

  function makeQuery(table) {
    const chain = [];
    const query = {};

    for (const method of CHAINABLE) {
      query[method] = vi.fn((...args) => {
        const call = { table, method, args };
        chain.push(call);
        calls.push(call);
        return query;
      });
    }

    // Thenable: `await query` resuelve con el resultado configurado.
    // Tiene que ser una funcion comun, no un vi.fn que devuelva el builder,
    // o el await entraria en loop.
    query.then = (onFulfilled, onRejected) =>
      Promise.resolve(nextResult(chain)).then(onFulfilled, onRejected);

    query.__table = table;
    query.__chain = chain;
    queries.push(query);
    return query;
  }

  const client = {
    from: vi.fn((table) => makeQuery(table)),

    channel: vi.fn((name) => {
      const handlers = [];
      const channel = {
        name,
        handlers,
        on: vi.fn((event, filter, handler) => {
          handlers.push({ event, filter, handler });
          return channel;
        }),
        subscribe: vi.fn(() => channel),
      };
      channels.push(channel);
      return channel;
    }),

    removeChannel: vi.fn(),
  };

  // --- Helpers para los tests -------------------------------------------

  /** Fija el resultado que devuelve cualquier consulta sin resultado encolado. */
  client.__setResult = (result) => {
    fallback = { ...EMPTY, ...result };
  };

  /** Encola un resultado para la proxima consulta. Se consumen en orden. */
  client.__queueResult = (result) => {
    queued.push({ ...EMPTY, ...result });
  };

  /**
   * Siembra filas y hace que las consultas apliquen sus .eq() de verdad, en vez
   * de devolver un resultado fijo. Es la unica forma de que un test de
   * aislamiento entre vendedores falle cuando el filtro desaparece.
   */
  client.__seed = (rows) => {
    seeded = rows;
  };

  /** Todas las llamadas hechas, en orden. */
  client.__calls = calls;

  /** La cadena de la ultima consulta armada, o de la n-esima. */
  client.__chain = (index = -1) => {
    const query = index < 0 ? queries[queries.length + index] : queries[index];
    return query ? query.__chain : [];
  };

  /** Devuelve los argumentos de la primera llamada a `method` en la consulta. */
  client.__argsOf = (method, index = -1) =>
    client.__chain(index).find((c) => c.method === method)?.args;

  /** true si alguna consulta uso `method` con esos argumentos exactos. */
  client.__called = (method, ...args) =>
    calls.some(
      (c) =>
        c.method === method &&
        c.args.length === args.length &&
        c.args.every((a, i) => JSON.stringify(a) === JSON.stringify(args[i]))
    );

  /** Canales de realtime creados. */
  client.__channels = channels;

  /** Dispara los handlers de realtime, como si Postgres hubiera avisado. */
  client.__emit = (payload = {}) => {
    channels.forEach((ch) => ch.handlers.forEach(({ handler }) => handler(payload)));
  };

  /** Limpia todo lo registrado, dejando el mock como recien creado. */
  client.__reset = () => {
    calls.length = 0;
    queries.length = 0;
    queued.length = 0;
    channels.length = 0;
    fallback = EMPTY;
    seeded = null;
  };

  return client;
}
