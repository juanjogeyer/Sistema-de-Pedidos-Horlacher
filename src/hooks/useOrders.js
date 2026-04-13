import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const TELEGRAM_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

/**
 * Envía una notificación a Telegram cuando se confirma un nuevo pedido.
 * Si falla, solo loguea el error sin interrumpir el flujo principal.
 */
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
      return;
    }

    // Notificación Telegram: no debe romper el flujo si falla
    try {
      await notificarTelegram(newOrder);
    } catch (telegramError) {
      console.error('Error al enviar notificación a Telegram:', telegramError.message);
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
