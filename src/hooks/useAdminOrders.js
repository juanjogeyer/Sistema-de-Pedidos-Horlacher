import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useOrdersQuery } from './useOrdersQuery';

// Lo que puede hacer administracion: ver los pedidos de todos los vendedores,
// imprimirlos y borrarlos. No expone cargar pedidos.

const ok = { ok: true, error: null };
const fail = (error) => ({ ok: false, error });

export function useAdminOrders() {
  // Sin sellerId: la cola es de los dos vendedores juntos.
  const { orders, history, setOrders, setHistory, refetch, refetchHistory } =
    useOrdersQuery();

  const printOrder = useCallback(
    async (id) => {
      const order = orders.find((o) => o.id === id);
      if (order) {
        setOrders((prev) => prev.filter((o) => o.id !== id));
        setHistory((prev) => [{ ...order, printed: true }, ...prev]);
      }

      // El .eq('printed', false) hace que reimprimir sea detectable, y el
      // .select() que un update sobre una fila que ya no existe no pase por
      // exito: en Postgres afecta 0 filas y devuelve OK igual.
      const { data, error } = await supabase
        .from('orders')
        .update({ printed: true })
        .eq('id', id)
        .eq('printed', false)
        .select();

      if (error) {
        console.error('Error al marcar como impreso:', error.message);
        await refetch();
        return fail('No se pudo marcar el pedido como impreso.');
      }

      if (!data?.length) {
        await refetch();
        return fail('Ese pedido ya no está: el vendedor lo canceló.');
      }

      return ok;
    },
    [orders, setOrders, setHistory, refetch]
  );

  const removeOrder = useCallback(
    async (id) => {
      setOrders((prev) => prev.filter((o) => o.id !== id));

      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) {
        console.error('Error al eliminar pedido:', error.message);
        await refetch();
        return fail('No se pudo eliminar el pedido.');
      }

      return ok;
    },
    [setOrders, refetch]
  );

  const deleteHistoryOrder = useCallback(
    async (id) => {
      setHistory((prev) => prev.filter((o) => o.id !== id));

      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) {
        console.error('Error al eliminar del historial:', error.message);
        await refetchHistory();
        return fail('No se pudo eliminar el pedido del historial.');
      }

      return ok;
    },
    [setHistory, refetchHistory]
  );

  return { orders, history, printOrder, removeOrder, deleteHistoryOrder };
}
