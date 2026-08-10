import { OrderCard } from './OrderCard';

// Lista de pedidos. No sabe de roles: recibe que pedidos mostrar, que decir si
// no hay ninguno, y que botones ponerle a cada uno.
//
// @param {Function} [sellerOf]      order => nombre del vendedor, o nada.
// @param {Function} [renderActions] order => botones de esa tarjeta.
export function OrderList({ orders, emptyText, sellerOf, renderActions }) {
  if (orders.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-400">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 print:hidden">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          seller={sellerOf?.(order)}
          actions={renderActions?.(order)}
        />
      ))}
    </div>
  );
}
