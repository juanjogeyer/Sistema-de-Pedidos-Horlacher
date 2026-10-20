import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { notificarPedido } from '../lib/telegram';
import { useOrdersQuery } from './useOrdersQuery';

// Lo que puede hacer un vendedor: cargar pedidos y cancelar los propios que
// todavia no se imprimieron. No expone imprimir, y a proposito: el modulo del
// admin ni se importa desde el arbol del vendedor.

const ok = { ok: true, error: null };
const fail = (error) => ({ ok: false, error });

export function useVendorOrders(user) {
  const { orders, history, setOrders, refetch, refetchOrders } = useOrdersQuery(user.id);

  const addOrder = useCallback(
    async (orderData) => {
      const newOrder = {
        ...orderData,
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        printed: false,
        // El dueno sale de la sesion, no del formulario: por eso CartBar no
        // necesita enterarse de que existen vendedores.
        seller_id: user.id,
      };

      setOrders((prev) => [...prev, newOrder]);

      const { error } = await supabase.from('orders').insert(newOrder);
      if (error) {
        console.error('Error al guardar pedido:', error.message);
        setOrders((prev) => prev.filter((o) => o.id !== newOrder.id));
        return fail('No se pudo enviar el pedido. Revisá la conexión y probá de nuevo.');
      }

      try {
        await notificarPedido(newOrder);
      } catch (telegramError) {
        // El pedido ya esta guardado. Que falle el aviso no lo invalida.
        console.error('Error al enviar notificación a Telegram:', telegramError.message);
      }

      return ok;
    },
    [user.id, setOrders]
  );

  const cancelOrder = useCallback(
    async (id) => {
      setOrders((prev) => prev.filter((o) => o.id !== id));

      // Las tres guardas viajan en la propia consulta. No son seguridad -el
      // cliente arma la query- pero convierten un bug de UI en un no-op: si el
      // boton aparece donde no debe, el DELETE no borra nada.
      const { data, error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id)
        .eq('seller_id', user.id)
        .eq('printed', false)
        .select();

      if (error) {
        console.error('Error al cancelar pedido:', error.message);
        await refetchOrders();
        return fail('No se pudo cancelar el pedido. Probá de nuevo.');
      }

      if (!data?.length) {
        // Cero filas afectadas: el admin lo imprimio entre que se dibujo la
        // lista y el click.
        await refetch();
        return fail('Ese pedido ya fue impreso. Hablá con administración.');
      }

      return ok;
    },
    [user.id, setOrders, refetch, refetchOrders]
  );

  return { orders, history, addOrder, cancelOrder };
}
