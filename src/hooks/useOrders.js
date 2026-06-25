import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const POLL_INTERVAL = 8000;

const TELEGRAM_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

async function notificarTelegram(order) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram: credenciales no configuradas, notificación omitida.');
    return;
  }

  const totalItems = (order.cart ?? []).reduce((sum, item) => sum + (item.qty ?? 1), 0);

  const mensaje =
    `🛒 *Nuevo pedido confirmado*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Cliente:* ${order.name}\n` +
    `🧾 *Facturación:* ${order.billing}\n` +
    `🚚 *Expreso:* ${order.express}\n` +
    `📦 *Total de ítems:* ${totalItems}\n` +
    (order.notes ? `📝 *Observaciones:* ${order.notes}\n` : '') +
    `━━━━━━━━━━━━━━━━━━━━`;

  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: mensaje,
      parse_mode: 'Markdown',
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Telegram API error: ${err.description}`);
  }
}

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
      return;
    }

    try {
      await notificarTelegram(newOrder);
    } catch (telegramError) {
      console.error('Error al enviar notificación a Telegram:', telegramError.message);
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
