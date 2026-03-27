/**
 * Construye la URL de WhatsApp con el mensaje del pedido pre-formateado.
 * @param {Array} cart - Items del carrito [{ name, quantity }]
 * @param {string} customerName - Nombre del cliente
 * @param {string} phone - Número de teléfono destino (sin '+')
 * @returns {string} URL lista para abrir en WhatsApp
 */
export function buildWhatsAppUrl(cart, customerName, phone) {
  let message = `*NUEVO PEDIDO* 🛒\n\n`;
  message += `*Cliente:* ${customerName}\n\n`;
  message += `*Detalle del Pedido:*\n`;

  cart.forEach((item) => {
    message += `- ${item.quantity}x ${item.name}\n`;
  });

  message += `\n¡Gracias por tu pedido!`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
