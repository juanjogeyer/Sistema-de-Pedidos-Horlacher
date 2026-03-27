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

export default function App() {
  const [activeTab, setActiveTab] = useState('order'); // 'order' or 'pending'
  const { cart, totalItems, getQuantity, updateQuantity, clearCart } = useCart();
  const { category, setCategory, variant, setVariant, subcategory, setSubcategory, filteredProducts } = useFilter();
  const { orders, addOrder, removeOrder } = useOrders();

  const visible = filteredProducts(products);

  // Determinar variantes disponibles y autoseleccionar si la actual no es válida
  const categoryProducts = products.filter(p => p.category === category && (subcategory === 'all' || p.subcategory === subcategory));
  const availableVariantsSet = new Set(categoryProducts.map(p => p.variant));
  const availableVariants = [];
  if (availableVariantsSet.has('unidad')) availableVariants.push('unidad');
  if (availableVariantsSet.has('bulto')) availableVariants.push('bulto');
  if (availableVariantsSet.has('granel')) availableVariants.push('granel');

  useEffect(() => {
    if (availableVariants.length > 0 && !availableVariants.includes(variant)) {
      setVariant(availableVariants[0]);
    }
  }, [availableVariants.join(','), variant, setVariant]);

  const handleConfirmOrder = (orderData) => {
    addOrder(orderData);
    clearCart();
    // Opcional: navegar a pendientes
    // setActiveTab('pending');
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
            subcategory={subcategory}
            onSubcategoryChange={setSubcategory}
            availableVariants={availableVariants}
          />
        )}
      </div>

      <main className="max-w-xl mx-auto print:max-w-none print:m-0">
        {activeTab === 'order' ? (
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
        ) : (
          <PendingOrders orders={orders} onRemoveOrder={removeOrder} />
        )}
      </main>
    </div>
  );
}