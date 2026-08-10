import { useState, useCallback } from 'react';
import { Printer, Trash2 } from 'lucide-react';
import { USERS, ROLES, sellerName, firstName } from '../../config/users';
import { useOrderPrinting } from '../../hooks/useOrderPrinting';
import { OrderList } from './OrderList';
import { HiddenPrintable } from './HiddenPrintable';

const VENDEDORES = USERS.filter((user) => user.role === ROLES.VENDEDOR);
const TODOS = 'todos';

// La cola de impresion de administracion: los pendientes de los dos vendedores
// juntos, cronologicos, mas viejo arriba.
//
// Cronologico y no agrupado por vendedor a proposito: es una cola, y lo que
// importa es que entro primero. Agrupar esconderia que el pedido de las 9 de uno
// quedo abajo del de las 11 del otro. Los chips cubren el "hoy despacho solo lo
// de Carlos".
export function PrintQueue({ orders, onPrint, onRemove }) {
  const [sellerFilter, setSellerFilter] = useState(TODOS);

  const handleAfterPrint = useCallback((order) => onPrint(order.id), [onPrint]);
  const { printingOrder, printRef, printOrder } = useOrderPrinting({
    onAfterPrint: handleAfterPrint,
  });

  const visible =
    sellerFilter === TODOS
      ? orders
      : orders.filter((order) => order.seller_id === sellerFilter);

  // Nombre de pila en los chips: son controles, no etiquetas, y en un celular
  // angosto tienen que entrar los tres en una linea. El apellido completo si va
  // en el badge de cada tarjeta.
  const chips = [
    { id: TODOS, label: 'Todos' },
    ...VENDEDORES.map((vendedor) => ({ id: vendedor.id, label: firstName(vendedor.name) })),
  ];

  return (
    <>
      <div className="flex gap-2 px-4 pt-4 overflow-x-auto no-scrollbar print:hidden">
        {chips.map((chip) => (
          <button
            key={chip.id}
            onClick={() => setSellerFilter(chip.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              sellerFilter === chip.id
                ? 'bg-brand-blue text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <OrderList
        orders={visible}
        emptyText="No hay pedidos para imprimir"
        sellerOf={(order) => sellerName(order.seller_id)}
        renderActions={(order) => (
          <>
            <button
              onClick={() => printOrder(order)}
              className="flex-1 bg-brand-blue text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-brand-blue-dark transition-colors"
            >
              <Printer size={18} />
              Imprimir
            </button>
            <button
              onClick={() => onRemove(order.id)}
              className="px-4 py-2.5 rounded-xl font-medium text-brand-red bg-brand-red-light hover:bg-red-100 transition-colors flex items-center justify-center"
              title="Eliminar pedido sin imprimir"
              aria-label="Eliminar pedido sin imprimir"
            >
              <Trash2 size={18} />
            </button>
          </>
        )}
      />

      <HiddenPrintable order={printingOrder} printRef={printRef} />
    </>
  );
}
