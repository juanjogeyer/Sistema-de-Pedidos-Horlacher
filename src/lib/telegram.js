const TELEGRAM_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

/**
 * Avisa por Telegram que entro un pedido nuevo. El aviso le llega a
 * administracion, que es quien imprime.
 *
 * Tira si la API responde error; quien llama decide si eso arruina el envio del
 * pedido o no (no lo arruina: el pedido ya esta guardado).
 */
export async function notificarPedido(order) {
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

  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: mensaje,
        parse_mode: 'Markdown',
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Telegram API error: ${err.description}`);
  }
}
