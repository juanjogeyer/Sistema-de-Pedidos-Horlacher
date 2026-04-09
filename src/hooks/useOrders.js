import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const POLL_INTERVAL = 8000; // fallback polling cada 8s

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const channelRef = useRef(null);

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('date', { ascending: true });

    if (!error && data) setOrders(data);
  }, []);

  useEffect(() => {
    // Carga inicial
    fetchOrders();

    // Suscripción en tiempo real (requiere Replication habilitado en Supabase)
    channelRef.current = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        fetchOrders
      )
      .subscribe();

    // Polling de respaldo: si real-time no funciona, igual se sincroniza
    const pollTimer = setInterval(fetchOrders, POLL_INTERVAL);

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      clearInterval(pollTimer);
    };
  }, [fetchOrders]);

  const addOrder = async (order) => {
    const newOrder = {
      ...order,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };

    // Actualización optimista: agrega a la UI de inmediato
    setOrders(prev => [...prev, newOrder]);

    const { error } = await supabase.from('orders').insert(newOrder);
    if (error) {
      console.error('Error al guardar pedido:', error.message);
      // Revertir si falla
      setOrders(prev => prev.filter(o => o.id !== newOrder.id));
    }
  };

  const removeOrder = async (id) => {
    // Actualización optimista: elimina de la UI de inmediato
    setOrders(prev => prev.filter(o => o.id !== id));

    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) {
      console.error('Error al eliminar pedido:', error.message);
      // Revertir si falla: vuelve a buscar el estado real
      fetchOrders();
    }
  };

  return { orders, addOrder, removeOrder };
}
