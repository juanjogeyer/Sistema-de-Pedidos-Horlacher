import { useCallback } from 'react';
import { Printer, Trash2 } from 'lucide-react';
import { PrintableOrder } from './PrintableOrder';
import { OrderCard } from './OrderCard';
import { useOrderPrinting } from '../../hooks/useOrderPrinting';

export function PendingOrders({ orders, onPrintOrder, onRemoveOrder }) {
  // Imprimir marca el pedido como impreso: pasa a Historial.
  const handleAfterPrint = useCallback(
    (order) => onPrintOrder(order.id),
    [onPrintOrder]
  );
  const { printingOrder, printRef, printOrder } = useOrderPrinting({
    onAfterPrint: handleAfterPrint,
  });

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
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            actions={
              <>
                <button
                  onClick={() => printOrder(order)}
                  className="flex-1 bg-brand-blue text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-brand-blue-dark transition-colors"
                >
                  <Printer size={18} />
                  Imprimir
                </button>
                <button
                  onClick={() => onRemoveOrder(order.id)}
                  className="px-4 py-2.5 rounded-xl font-medium text-brand-red bg-brand-red-light hover:bg-red-100 transition-colors flex items-center justify-center"
                  title="Eliminar pedido sin imprimir"
                >
                  <Trash2 size={18} />
                </button>
              </>
            }
          />
        ))}
      </div>

      {/* Hidden print renderer */}
      <div className="fixed left-[-9999px] top-[-9999px] print:static print:left-auto print:top-auto">
        <div ref={printRef} className="w-[800px] bg-white p-4 print:w-auto print:p-0">
          {printingOrder && <PrintableOrder order={printingOrder} />}
        </div>
      </div>
    </>
  );
}
