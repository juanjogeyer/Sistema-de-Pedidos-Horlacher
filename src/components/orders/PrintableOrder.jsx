import { forwardRef } from 'react';
import { APP_NAME } from '../../config/app';

export const PrintableOrder = forwardRef(({ order }, ref) => {
  if (!order) return null;

  const totalItems = order.cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div ref={ref} className="print-only p-8 max-w-2xl mx-auto bg-white text-black">
      <div className="text-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold mb-2">{APP_NAME}</h1>
        <h2 className="text-xl">Comprobante de Pedido</h2>
        <p className="text-gray-500 mt-2">
          Fecha: {new Date(order.date).toLocaleString()}
        </p>
      </div>

      <div className="mb-6">
        <p className="text-lg"><strong>Cliente:</strong> {order.name}</p>
        {order.billing && <p className="text-lg"><strong>Facturación:</strong> {order.billing}</p>}
        {order.express && <p className="text-lg"><strong>Expreso:</strong> {order.express}</p>}
      </div>

      <table className="w-full text-left border-collapse mb-8">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="py-2">Código</th>
            <th className="py-2">Producto</th>
            <th className="py-2">Cantidad</th>
          </tr>
        </thead>
        <tbody>
          {order.cart.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-300">
              <td className="py-2">{item.code}</td>
              <td className="py-2">{item.name}</td>
              <td className="py-2 text-center">{item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-center border-t-2 border-black pt-4">
        <span className="text-xl font-bold">Total Ítems:</span>
        <span className="text-xl font-bold">{totalItems}</span>
      </div>

      <div className="mt-12 text-center text-sm text-gray-500">
        ¡Gracias por tu pedido!
      </div>
    </div>
  );
});

PrintableOrder.displayName = 'PrintableOrder';
