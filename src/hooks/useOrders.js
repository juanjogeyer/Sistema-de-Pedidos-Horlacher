import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const POLL_INTERVAL = 8000;

export function useOrders() {
  const [orders, setOrders] = useState([]);       // pendientes
  const [history, setHistory] = useState([]);     // impresos
  const channelRef = useRef(null);

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('printed', false)
      .order('date', { ascending: true });
    if (!error && data) setOrders(data);
  }, []);

  const fetchHistory = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('printed', true)
      .order('date', { ascending: false });
    if (!error && data) setHistory(data);
  }, []);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchOrders(), fetchHistory()]);
  }, [fetchOrders, fetchHistory]);

  useEffect(() => {
    fetchAll();

    // Real-time: cualquier cambio en la tabla actualiza ambas listas
    channelRef.current = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchAll)
      .subscribe();

    // Polling de respaldo
    const pollTimer = setInterval(fetchAll, POLL_INTERVAL);

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      clearInterval(pollTimer);
    };
  }, [fetchAll]);

  const addOrder = async (order) => {
    const newOrder = {
      ...order,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      printed: false,
    };

    // Optimistic update
    setOrders(prev => [...prev, newOrder]);

    const { error } = await supabase.from('orders').insert(newOrder);
    if (error) {
      console.error('Error al guardar pedido:', error.message);
      setOrders(prev => prev.filter(o => o.id !== newOrder.id));
    }
  };

  // Marcar como impreso → pasa a historial
  const printOrder = async (id) => {
    // Optimistic update: sacar de pendientes y poner en historial
    const order = orders.find(o => o.id === id);
    if (order) {
      setOrders(prev => prev.filter(o => o.id !== id));
      setHistory(prev => [{ ...order, printed: true }, ...prev]);
    }

    const { error } = await supabase
      .from('orders')
      .update({ printed: true })
      .eq('id', id);

    if (error) {
      console.error('Error al marcar como impreso:', error.message);
      fetchAll(); // revertir
    }
  };

  // Eliminar completamente (solo desde pendientes, con el botón basura)
  const removeOrder = async (id) => {
    setOrders(prev => prev.filter(o => o.id !== id));

    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) {
      console.error('Error al eliminar pedido:', error.message);
      fetchOrders();
    }
  };

  // Eliminar definitivamente del historial
  const deleteHistoryOrder = async (id) => {
    setHistory(prev => prev.filter(o => o.id !== id));
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) {
      console.error('Error al eliminar del historial:', error.message);
      fetchHistory();
    }
  };

  return { orders, history, addOrder, printOrder, removeOrder, deleteHistoryOrder };
}
