import { Printer, Trash2 } from 'lucide-react';
import { PrintableOrder } from './PrintableOrder';
import { OrderCard } from './OrderCard';
import { useOrderPrinting } from '../../hooks/useOrderPrinting';

export function OrderHistory({ history, onDeleteOrder }) {
  // Reimprimir no cambia nada en la base: solo regenera el PDF.
  const { printingOrder, printRef, printOrder } = useOrderPrinting();

  if (history.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-400">No hay pedidos en el historial</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 p-4 print:hidden">
        {history.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            actions={
              <>
                <button
                  onClick={() => printOrder(order)}
                  className="flex-1 bg-gray-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                >
                  <Printer size={18} />
                  Reimprimir
                </button>
                <button
                  onClick={() => onDeleteOrder(order.id)}
                  className="px-3 py-2.5 rounded-xl bg-brand-red-light text-brand-red hover:text-black hover:bg-red-400 transition-colors flex items-center justify-center"
                  title="Eliminar del historial"
                >
                  <Trash2 size={16} />
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
