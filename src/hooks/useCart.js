import { useState } from 'react';

export function useCart() {
  const [cart, setCart] = useState([]);
  const KEY = (p) => p.code; // identificador único del producto

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getQuantity = (productCode) => {
    const item = cart.find((item) => item.code === productCode);
    return item ? item.quantity : 0;
  };

  const updateQuantity = (product, delta) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.code === KEY(product));

      if (existing) {
        const newQuantity = existing.quantity + delta;
        if (newQuantity <= 0) {
          return prevCart.filter((item) => item.code !== KEY(product));
        }
        return prevCart.map((item) =>
          item.code === KEY(product) ? { ...item, quantity: newQuantity } : item
        );
      } else if (delta > 0) {
        return [...prevCart, { ...product, quantity: delta }];
      }

      return prevCart;
    });
  };

  const clearCart = () => setCart([]);

  return { cart, totalItems, getQuantity, updateQuantity, clearCart };
}
