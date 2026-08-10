import { useState } from 'react';
import { useAdminOrders } from '../hooks/useAdminOrders';
import { Header } from '../components/layout/Header';
import { PrintQueue } from '../components/orders/PrintQueue';
import { AdminHistory } from '../components/orders/AdminHistory';

// La app de administracion: una cola de impresion con los pedidos de los dos
// vendedores y el historial completo. Sin catalogo y sin carrito, porque el
// admin no carga pedidos.

export function AdminApp({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'history'
  const { orders, history, printOrder, removeOrder, deleteHistoryOrder } = useAdminOrders();

  const tabs = [
    { id: 'queue', label: 'Cola de impresión', badge: orders.length },
    { id: 'history', label: 'Historial' },
  ];

  return (
    <div className="min-h-screen pb-8">
      <div className="print:hidden">
        <Header
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          user={user}
          onLogout={onLogout}
        />
      </div>

      <main className="max-w-xl mx-auto print:max-w-none print:m-0">
        {activeTab === 'queue' && (
          <PrintQueue orders={orders} onPrint={printOrder} onRemove={removeOrder} />
        )}

        {activeTab === 'history' && (
          <AdminHistory history={history} onDelete={deleteHistoryOrder} />
        )}
      </main>
    </div>
  );
}
