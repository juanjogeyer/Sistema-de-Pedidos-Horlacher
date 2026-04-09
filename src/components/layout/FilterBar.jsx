import { CATEGORIES } from '../../data/products';

export function FilterBar({ category, onCategoryChange, variant, onVariantChange, availableVariants = ['bulto', 'granel'] }) {
  const showVariantToggle = availableVariants.length > 1;

  return (
    <div className="sticky top-[105px] z-10 bg-white border-b border-gray-200">

      {/* Category tabs */}
      <div className="flex gap-2 px-4 pt-3 pb-2 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${category === cat.id
                ? 'bg-brand-blue text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-brand-blue-light hover:text-brand-blue'
              }`}
          >
            {cat.label}
          </button>
        ))}
      </div>


      {/* Variant toggle */}
      {showVariantToggle && (
        <div className="flex gap-1 px-4 pb-3">
          {availableVariants.map((v) => (
            <button
              key={v}
              onClick={() => onVariantChange(v)}
              className={`px-4 py-1 rounded-full text-xs font-medium transition-colors ${variant === v
                  ? 'bg-brand-red text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-brand-blue-light hover:text-brand-blue'
                }`}
            >
              {v === 'bulto' ? 'Por Bulto' : 'A Granel'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
