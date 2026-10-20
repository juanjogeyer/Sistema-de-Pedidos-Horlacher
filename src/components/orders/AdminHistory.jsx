import { Printer, Trash2 } from 'lucide-react';
import { sellerName } from '../../config/users';
import { useOrderPrinting } from '../../hooks/useOrderPrinting';
import { useActionError } from '../../hooks/useActionError';
import { OrderList } from './OrderList';
import { HiddenPrintable } from './HiddenPrintable';
import { ErrorBanner } from '../layout/ErrorBanner';

// Historial completo, de los dos vendedores. Solo administracion lo ve asi: el
// vendedor tiene su propio historial y es de solo lectura.
//
// Reimprimir no cambia nada en la base, pero saca papel, y el papel es lo que va
// al expreso. Por eso vive aca y no del lado del vendedor.
export function AdminHistory({ history, onDelete }) {
  const { printingOrder, printRef, printOrder } = useOrderPrinting();
  const { error, run, clear } = useActionError();

  return (
    <>
      <ErrorBanner error={error} onDismiss={clear} />

      <OrderList
        orders={history}
        emptyText="No hay pedidos en el historial"
        sellerOf={(order) => sellerName(order.seller_id)}
        renderActions={(order) => (
          <>
            <button
              onClick={() => printOrder(order)}
              className="flex-1 bg-gray-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
            >
              <Printer size={18} />
              Reimprimir
            </button>
            <button
              onClick={() => run(() => onDelete(order.id))}
              className="px-3 py-2.5 rounded-xl bg-brand-red-light text-brand-red hover:text-black hover:bg-red-400 transition-colors flex items-center justify-center"
              title="Eliminar del historial"
              aria-label="Eliminar del historial"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      />

      <HiddenPrintable order={printingOrder} printRef={printRef} />
    </>
  );
}
