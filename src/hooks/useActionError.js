import { useState, useCallback } from 'react';

// Corre una accion que devuelve {ok, error} y se queda con el mensaje si fallo.
//
// Antes un fallo de Supabase era un console.error y la fila desaparecia del
// estado optimista: el vendedor veia esfumarse su pedido sin saber por que.
// Con esto el fallo tiene cara, y se puede reintentar sin rehacer nada.
export function useActionError() {
  const [error, setError] = useState(null); // { message, retry } | null

  const run = useCallback(async function run(action) {
    const result = await action();

    if (result?.ok === false) {
      setError({ message: result.error, retry: () => run(action) });
    } else {
      setError(null);
    }

    return result;
  }, []);

  const clear = useCallback(() => setError(null), []);

  return { error, run, clear };
}
