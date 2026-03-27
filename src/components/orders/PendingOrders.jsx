import { useState, useRef } from 'react';
import { Printer, Trash2 } from 'lucide-react';
import { PrintableOrder } from './PrintableOrder';

export function PendingOrders({ orders, onRemoveOrder }) {
  const [printingOrder, setPrintingOrder] = useState(null);

  const handlePrint = (order) => {
    setPrintingOrder(order);
    
    // Allow React to render the PrintableOrder component
    setTimeout(() => {
      window.print();
      // Optionally remove right after printing dialog closes
      onRemoveOrder(order.id);
      setPrintingOrder(null);
    }, 100);
  };

  if (orders.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-400">No hay pedidos pendientes</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 p-4 print:hidden">
        {orders.map((order) => {
          const totalItems = order.cart.reduce((sum, item) => sum + item.quantity, 0);
          
          return (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">{order.name}</h3>
                  {order.billing && <p className="text-sm text-gray-600">Facturación: {order.billing}</p>}
                  {order.express && <p className="text-sm text-gray-600">Expreso: {order.express}</p>}
                  <p className="text-xs text-gray-400 mt-1 flex gap-2">
                    <span>{new Date(order.date).toLocaleDateString()}</span>
                    <span>{new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                      <span className="font-medium">{item.quantity}x</span>
                      <span className="truncate">{item.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handlePrint(order)}
                  className="flex-1 bg-black text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                >
                  <Printer size={18} />
                  Imprimir
                </button>
                <button
                  onClick={() => onRemoveOrder(order.id)}
                  className="px-4 py-2.5 rounded-xl font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center"
                  title="Eliminar pedido sin imprimir"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hidden print renderer */}
      <div className="hidden print:block">
        {printingOrder && <PrintableOrder order={printingOrder} />}
      </div>
    </>
  );
}
