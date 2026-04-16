import { useState, useEffect } from 'react';
import { useCart } from './hooks/useCart';
import { useFilter } from './hooks/useFilter';
import { useOrders } from './hooks/useOrders';
import { products } from './data/products';
import { Header } from './components/layout/Header';
import { FilterBar } from './components/layout/FilterBar';
import { ProductList } from './components/products/ProductList';
import { CartBar } from './components/cart/CartBar';
import { PendingOrders } from './components/orders/PendingOrders';
import { OrderHistory } from './components/orders/OrderHistory';

export default function App() {
  const [activeTab, setActiveTab] = useState('order'); // 'order' | 'pending' | 'history'
  const { cart, totalItems, getQuantity, updateQuantity, clearCart } = useCart();
  const { category, setCategory, variant, setVariant, filteredProducts } = useFilter();
  const { orders, history, addOrder, printOrder, removeOrder, deleteHistoryOrder } = useOrders();

  const visible = filteredProducts(products);

  // Determinar variantes disponibles y autoseleccionar si la actual no es válida
  const availableVariants = [...new Set(products.filter(p => p.category === category).map(p => p.variant))]
    .sort((a, b) => ['bulto', 'granel'].indexOf(a) - ['bulto', 'granel'].indexOf(b));

  useEffect(() => {
    if (availableVariants.length > 0 && !availableVariants.includes(variant)) {
      setVariant(availableVariants[0]);
    }
  }, [availableVariants.join(','), variant, setVariant]);

  const handleConfirmOrder = (orderData) => {
    addOrder(orderData);
    clearCart();
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="print:hidden">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingCount={orders.length}
        />

        {activeTab === 'order' && (
          <FilterBar
            category={category}
            onCategoryChange={setCategory}
            variant={variant}
            onVariantChange={setVariant}
            availableVariants={availableVariants}
          />
        )}
      </div>

      <main className="max-w-xl mx-auto print:max-w-none print:m-0">
        {activeTab === 'order' && (
          <>
            {visible.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-16">Sin productos en esta categoría</p>
            ) : (
              <ProductList
                products={visible}
                getQuantity={getQuantity}
                onUpdate={updateQuantity}
              />
            )}
            <div className="print:hidden">
              <CartBar cart={cart} totalItems={totalItems} onConfirm={handleConfirmOrder} />
            </div>
          </>
        )}

        {activeTab === 'pending' && (
          <PendingOrders
            orders={orders}
            onPrintOrder={printOrder}
            onRemoveOrder={removeOrder}
          />
        )}

        {activeTab === 'history' && (
          <OrderHistory history={history} onDeleteOrder={deleteHistoryOrder} />
        )}
      </main>
    </div>
  );
}