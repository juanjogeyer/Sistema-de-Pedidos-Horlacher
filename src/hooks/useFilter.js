import { useState } from 'react';

export function useFilter() {
  const [category, setCategory] = useState('snacks');
  const [variant, setVariant] = useState('bulto');

  function filteredProducts(products) {
    return products.filter((p) => {
      const categoryMatch = p.category === category;
      const variantMatch = p.variant === variant;
      return categoryMatch && variantMatch;
    });
  }

  return {
    category, setCategory,
    variant, setVariant,
    filteredProducts,
  };
}
