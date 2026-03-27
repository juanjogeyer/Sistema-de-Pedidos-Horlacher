import { useState, useEffect } from 'react';

export function useOrders() {
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('pending_orders');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading orders', e);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('pending_orders', JSON.stringify(orders));
  }, [orders]);

  const addOrder = (order) => {
    const newOrder = {
      ...order,
      id: crypto.randomUUID(),
      date: new Date().toISOString()
    };

    // Agregar a pedidos pendientes (estado actual)
    setOrders((prev) => [...prev, newOrder]);

    // Guardar en el historial permanente (localStorage persistente)
    try {
      const history = JSON.parse(localStorage.getItem('order_history') || '[]');
      localStorage.setItem('order_history', JSON.stringify([...history, newOrder]));
    } catch (e) {
      console.error('Error saving to history', e);
    }

    // Guardar automáticamente en el disco (vía servidor local)
    fetch('/api/save-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    }).catch(err => console.error('Error auto-saving file:', err));
  };

  const removeOrder = (id) => {
    setOrders((prev) => prev.filter(o => o.id !== id));
  };

  return { orders, addOrder, removeOrder };
}
