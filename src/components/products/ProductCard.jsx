import { Plus, Minus } from 'lucide-react';
import { useLongPress } from '../../hooks/useLongPress';

const formatPrice = (price) => {
  if (price === 0) return 'Consultar';
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);
};

export function ProductCard({ product, quantity, onUpdate }) {
  const minusProps = useLongPress(() => {
    if (quantity > 0) onUpdate(product, -1);
  });
  const plusProps = useLongPress(() => {
    onUpdate(product, 1);
  });
  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 transition-colors ${quantity > 0 ? 'bg-gray-50' : 'bg-white'}`}>
      {/* Name + price */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 leading-snug truncate">{product.name}</p>
        <p className="text-xs font-semibold text-gray-500 mt-0.5">{formatPrice(product.price)}</p>
      </div>

      {/* Qty controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          {...minusProps}
          disabled={quantity === 0}
          className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-30"
        >
          <Minus size={12} />
        </button>
        <span className="text-sm font-medium w-5 text-center">{quantity}</span>
        <button
          {...plusProps}
          className="w-7 h-7 flex items-center justify-center bg-gray-900 rounded-full text-white hover:bg-gray-700 transition-colors"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}
