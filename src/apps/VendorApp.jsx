import { useState, useEffect, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { products, VARIANTS } from '../data/products';
import { useCart } from '../hooks/useCart';
import { useFilter } from '../hooks/useFilter';
import { useVendorOrders } from '../hooks/useVendorOrders';
import { Header } from '../components/layout/Header';
import { FilterBar } from '../components/layout/FilterBar';
import { ProductList } from '../components/products/ProductList';
import { CartBar } from '../components/cart/CartBar';
import { OrderList } from '../components/orders/OrderList';

// La app del vendedor: carga pedidos, mira los suyos, cancela los que todavia
// no se imprimieron. No tiene boton de imprimir en ninguna pantalla, y no por
// estar oculto: el modulo que imprime no se importa desde aca.

export function VendorApp({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('order'); // 'order' | 'pending' | 'history'
  const { cart, totalItems, getQuantity, updateQuantity, clearCart } = useCart();
  const { category, setCategory, variant, setVariant, filteredProducts } = useFilter();
  const { orders, history, addOrder, cancelOrder } = useVendorOrders(user);

  const visible = filteredProducts(products);

  // Variantes disponibles para la categoria elegida. Memoizado para que la
  // referencia sea estable y el efecto de abajo dependa del array.
  const availableVariants = useMemo(() => {
    const variantOrder = VARIANTS.map((v) => v.id);
    return [...new Set(products.filter((p) => p.category === category).map((p) => p.variant))]
      .sort((a, b) => variantOrder.indexOf(a) - variantOrder.indexOf(b));
  }, [category]);

  useEffect(() => {
    if (availableVariants.length > 0 && !availableVariants.includes(variant)) {
      setVariant(availableVariants[0]);
    }
  }, [availableVariants, variant, setVariant]);

  const handleConfirmOrder = (orderData) => {
    addOrder(orderData);
    clearCart();
  };

  const tabs = [
    { id: 'order', label: 'Hacer pedido' },
    { id: 'pending', label: 'Mis pendientes', badge: orders.length },
    { id: 'history', label: 'Mi historial' },
  ];

  return (
    <div className="min-h-screen pb-20">
      <div className="print:hidden">
        <Header
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          user={user}
          onLogout={onLogout}
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
              <p className="text-center text-gray-400 text-sm py-16">
                Sin productos en esta categoría
              </p>
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
          <OrderList
            orders={orders}
            emptyText="No tenés pedidos pendientes"
            renderActions={(order) => (
              <button
                onClick={() => cancelOrder(order.id)}
                className="px-4 py-2.5 rounded-xl font-medium text-brand-red bg-brand-red-light hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                title="Cancelar pedido"
              >
                <Trash2 size={18} />
                Cancelar
              </button>
            )}
          />
        )}

        {activeTab === 'history' && (
          // Solo lectura: sin reimprimir y sin tacho.
          <OrderList orders={history} emptyText="Todavía no tenés pedidos impresos" />
        )}
      </main>
    </div>
  );
}
