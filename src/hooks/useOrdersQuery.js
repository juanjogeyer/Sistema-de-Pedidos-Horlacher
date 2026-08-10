import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const POLL_INTERVAL = 8000;

// Trae los pedidos y los mantiene frescos. Sin mutaciones: eso lo ponen encima
// useVendorOrders y useAdminOrders, que es donde cambian los permisos.
//
// `sellerId` null significa "todos": es el admin. Un vendedor pasa el suyo y no
// ve los del otro.

async function fetchList(sellerId, { printed, ascending }) {
  let query = supabase.from('orders').select('*').eq('printed', printed);
  if (sellerId) query = query.eq('seller_id', sellerId);

  const { data, error } = await query.order('date', { ascending });
  if (error) {
    console.error('Error al traer pedidos:', error.message);
    return null;
  }
  return data;
}

export function useOrdersQuery(sellerId = null) {
  // Pendientes: mas viejo arriba, porque es una cola de trabajo.
  const [orders, setOrders] = useState([]);
  // Historial: mas nuevo arriba, porque es una consulta.
  const [history, setHistory] = useState([]);
  const channelRef = useRef(null);

  const refetchOrders = useCallback(async () => {
    const data = await fetchList(sellerId, { printed: false, ascending: true });
    if (data) setOrders(data);
  }, [sellerId]);

  const refetchHistory = useCallback(async () => {
    const data = await fetchList(sellerId, { printed: true, ascending: false });
    if (data) setHistory(data);
  }, [sellerId]);

  const refetch = useCallback(async () => {
    await Promise.all([refetchOrders(), refetchHistory()]);
  }, [refetchOrders, refetchHistory]);

  useEffect(() => {
    // Traer al montar es justamente sincronizar con un sistema externo. refetch
    // es async y setea recien cuando responde Supabase, no de forma sincrona.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();

    // Realtime: cualquier cambio en la tabla vuelve a traer las dos listas.
    channelRef.current = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, refetch)
      .subscribe();

    // Polling de respaldo por si el realtime se cae.
    const pollTimer = setInterval(refetch, POLL_INTERVAL);

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      clearInterval(pollTimer);
    };
  }, [refetch]);

  return {
    orders,
    history,
    setOrders,
    setHistory,
    refetch,
    refetchOrders,
    refetchHistory,
  };
}
