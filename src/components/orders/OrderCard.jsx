// Tarjeta de pedido. Presentacional puro: no sabe de roles ni de permisos,
// dibuja el pedido y abajo pone los botones que le pasen.
//
// La misma tarjeta se usa en las tres listas (pendientes del vendedor, cola del
// admin, historial). Antes estaba duplicada, asi que agregar un campo al pedido
// obligaba a tocar dos archivos.
export function OrderCard({ order, seller = null, actions = null }) {
  const totalItems = order.cart.reduce((sum, item) => sum + item.quantity, 0);
  const date = new Date(order.date);
  const hasBadges = Boolean(order.printed || seller);

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 ${
        order.printed ? 'opacity-80' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className={`flex items-center gap-2 ${hasBadges ? 'mb-0.5' : ''}`}>
            <h3 className="font-medium text-gray-900">{order.name}</h3>
            {order.printed && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                Impreso
              </span>
            )}
            {seller && (
              <span className="text-xs bg-blue-50 text-brand-blue px-2 py-0.5 rounded-full font-medium">
                {seller}
              </span>
            )}
          </div>
          {order.billing && (
            <p className="text-sm text-gray-600">Facturación: {order.billing}</p>
          )}
          {order.express && (
            <p className="text-sm text-gray-600">Expreso: {order.express}</p>
          )}
          <p className="text-xs text-gray-400 mt-1 flex gap-2">
            <span>{date.toLocaleDateString()}</span>
            <span>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </p>
        </div>
        <div className="text-sm font-medium bg-gray-100 px-2 py-1 rounded-lg">
          {totalItems} ítems
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 mb-4 max-h-32 overflow-y-auto">
        <ul className="space-y-1">
          {order.cart.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-medium flex-shrink-0">{item.quantity}x</span>
              <span>{item.name}</span>
            </li>
          ))}
        </ul>
      </div>

      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
