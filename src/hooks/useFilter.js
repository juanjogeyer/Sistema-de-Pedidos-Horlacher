import { useState } from 'react';

export function useFilter() {
  const [category, setCategory] = useState('all');
  const [variant, setVariant] = useState('unidad');
  const [subcategory, setSubcategory] = useState('all');

  function handleCategoryChange(cat) {
    setCategory(cat);
    setSubcategory('all'); // reset subcategory when switching main tab
  }

  function filteredProducts(products) {
    return products.filter((p) => {
      const categoryMatch = category === 'all' || p.category === category;
      const variantMatch = category === 'all' || p.variant === variant;
      const subcategoryMatch = subcategory === 'all' || p.subcategory === subcategory;

      return categoryMatch && variantMatch && subcategoryMatch;
    });
  }

  return {
    category, setCategory: handleCategoryChange,
    variant, setVariant,
    subcategory, setSubcategory,
    filteredProducts,
  };
}
