import { Plus, Minus } from 'lucide-react';
import { useLongPress } from '../../hooks/useLongPress';

export function ProductCard({ product, quantity, onUpdate }) {
  const minusProps = useLongPress(() => {
    if (quantity > 0) onUpdate(product, -1);
  });
  const plusProps = useLongPress(() => {
    onUpdate(product, 1);
  });
  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 transition-colors ${quantity > 0 ? 'bg-brand-blue-light' : 'bg-white'}`}>
      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 leading-snug">{product.name}</p>
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
          className="w-7 h-7 flex items-center justify-center bg-brand-blue rounded-full text-white hover:bg-brand-blue-dark transition-colors"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}
