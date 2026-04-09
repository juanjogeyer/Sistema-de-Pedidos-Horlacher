import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Carga inicial de pedidos
    fetchOrders();

    // Suscripción en tiempo real — cualquier cambio en la tabla llega al instante
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders(); // recarga cuando hay INSERT, UPDATE o DELETE
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('date', { ascending: true });

    if (!error && data) {
      setOrders(data);
    }
  }

  const addOrder = async (order) => {
    const newOrder = {
      ...order,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };

    const { error } = await supabase.from('orders').insert(newOrder);
    if (error) console.error('Error al guardar pedido:', error.message);
    // No hace falta actualizar el estado manualmente:
    // la suscripción en tiempo real lo detecta y llama a fetchOrders()
  };

  const removeOrder = async (id) => {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) console.error('Error al eliminar pedido:', error.message);
    // Ídem — la suscripción actualiza automáticamente
  };

  return { orders, addOrder, removeOrder };
}
