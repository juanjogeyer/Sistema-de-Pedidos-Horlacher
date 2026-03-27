import { ProductCard } from './ProductCard';

export function ProductList({ products, getQuantity, onUpdate }) {
  return (
    <div className="flex flex-col">
      {products.map((product) => (
        <ProductCard
          key={product.code}
          product={product}
          quantity={getQuantity(product.code)}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}
