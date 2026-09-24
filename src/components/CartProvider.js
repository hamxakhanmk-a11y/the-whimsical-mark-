'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import CartDrawer from '@/components/CartDrawer';

const CartContext = createContext(null);
const STORAGE_KEY = 'twm-cart';

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(saved)) setItems(saved.filter(item => item && item.variantId));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
  }, [items, loaded]);

  // Each painting is one of a kind, so a painting is either in the cart once or not at all.
  const addItem = useCallback(item => {
    setItems(current => current.some(i => i.variantId === item.variantId) ? current : [...current, item]);
    setOpen(true);
  }, []);

  const removeItem = useCallback(variantId => {
    setItems(current => current.filter(i => i.variantId !== variantId));
  }, []);

  const value = useMemo(() => ({
    items,
    count: items.length,
    hasItem: variantId => items.some(i => i.variantId === variantId),
    addItem,
    removeItem,
    open,
    setOpen,
  }), [items, addItem, removeItem, open]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
