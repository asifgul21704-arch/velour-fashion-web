import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CartItem } from '../types.ts';
import { useAuth } from './AuthContext.tsx';
import { useToast } from './ToastContext.tsx';
import { apiFetch } from '../lib/api.ts';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  discountCode: string;
  loading: boolean;
  addToCart: (productId: string, size: string, color: string, quantity?: number) => Promise<{ success: boolean; error?: string }>;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => Promise<{ success: boolean; error?: string }>;
  removeFromCart: (productId: string, size: string, color: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyDiscountCode: (code: string) => boolean;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_CART_KEY = 'velour_guest_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(GUEST_CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [discountCode, setDiscountCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Sync state to local storage backup
  const syncLocal = (newItems: CartItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(newItems));
    } catch (e) {
      // Ignore quota error
    }
  };

  // Load cart based on server or local state
  const refreshCart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        if (data.cart?.items && Array.isArray(data.cart.items)) {
          // If server returned items, sync them
          if (data.cart.items.length > 0 || isAuthenticated) {
            syncLocal(data.cart.items);
            setLoading(false);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Could not sync cart with server, utilizing local cache', err);
    }

    // Fallback to local storage
    try {
      const local = localStorage.getItem(GUEST_CART_KEY);
      if (local) {
        setItems(JSON.parse(local));
      }
    } catch (e) {
      setItems([]);
    }
    setLoading(false);
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Local fallback addition helper
  const addLocally = async (productId: string, size: string, color: string, quantity: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const pRes = await apiFetch(`/api/products/${productId}`);
      const pData = await pRes.json();
      if (!pRes.ok || !pData.product) {
        showToast('Item currently unavailable', 'error');
        return { success: false, error: 'Product unavailable' };
      }

      const product = pData.product;
      const existingIdx = items.findIndex(
        i => i.productId === productId && i.size === size && i.color === color
      );

      let updated: CartItem[];
      if (existingIdx > -1) {
        const newQty = items[existingIdx].quantity + quantity;
        if (newQty > product.stock) {
          showToast(`Only ${product.stock} pieces in stock for this variant`, 'error');
          return { success: false, error: 'Stock exceeded' };
        }
        updated = [...items];
        updated[existingIdx].quantity = newQty;
      } else {
        if (quantity > product.stock) {
          showToast(`Only ${product.stock} pieces available`, 'error');
          return { success: false, error: 'Stock exceeded' };
        }
        updated = [
          ...items,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            salePrice: product.salePrice,
            image: product.images[0] || '',
            size,
            color,
            quantity,
            stock: product.stock
          }
        ];
      }

      syncLocal(updated);
      showToast('Added to bag', 'success');
      return { success: true };
    } catch (e: any) {
      showToast('Added to bag', 'success');
      return { success: true };
    }
  };

  const addToCart = async (productId: string, size: string, color: string, quantity = 1): Promise<{ success: boolean; error?: string }> => {
    if (!size || !color) {
      showToast('Please select both a size and color before adding to cart', 'error');
      return { success: false, error: 'Size and color required' };
    }

    try {
      const res = await apiFetch('/api/cart/add', {
        method: 'POST',
        body: JSON.stringify({ productId, size, color, quantity })
      });
      const data = await res.json();

      if (res.ok && data.cart?.items) {
        syncLocal(data.cart.items);
        showToast('Added to bag', 'success');
        return { success: true };
      } else {
        // If server responded with an error, check if it was stock or if we should fall back locally
        if (data.error && !data.error.includes('Authentication')) {
          showToast(data.error, 'error');
          return { success: false, error: data.error };
        }
        // If auth or unexpected error, seamlessly add locally
        return await addLocally(productId, size, color, quantity);
      }
    } catch (err: any) {
      // Offline / network fallback
      return await addLocally(productId, size, color, quantity);
    }
  };

  const updateQuantity = async (productId: string, size: string, color: string, quantity: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiFetch('/api/cart/update', {
        method: 'PATCH',
        body: JSON.stringify({ productId, size, color, quantity })
      });
      const data = await res.json();

      if (res.ok && data.cart?.items) {
        syncLocal(data.cart.items);
        return { success: true };
      }
    } catch (err: any) {
      // fallback to local update below
    }

    // Local fallback update
    if (quantity <= 0) {
      const updated = items.filter(i => !(i.productId === productId && i.size === size && i.color === color));
      syncLocal(updated);
    } else {
      const updated = items.map(i => {
        if (i.productId === productId && i.size === size && i.color === color) {
          if (quantity > i.stock) {
            showToast(`Maximum available stock is ${i.stock}`, 'error');
            return i;
          }
          return { ...i, quantity };
        }
        return i;
      });
      syncLocal(updated);
    }
    return { success: true };
  };

  const removeFromCart = async (productId: string, size: string, color: string) => {
    try {
      const res = await apiFetch('/api/cart/remove', {
        method: 'DELETE',
        body: JSON.stringify({ productId, size, color })
      });
      const data = await res.json();
      if (res.ok && data.cart?.items) {
        syncLocal(data.cart.items);
        showToast('Item removed from bag', 'info');
        return;
      }
    } catch (e) {
      // Local fallback
    }

    const updated = items.filter(i => !(i.productId === productId && i.size === size && i.color === color));
    syncLocal(updated);
    showToast('Item removed from bag', 'info');
  };

  const clearCart = async () => {
    try {
      await apiFetch('/api/cart/clear', { method: 'DELETE' });
    } catch (e) {
      // Ignore
    }
    localStorage.removeItem(GUEST_CART_KEY);
    setItems([]);
  };

  const applyDiscountCode = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    if (clean === 'VELOUR10') {
      setDiscountCode('VELOUR10');
      showToast('Promotion applied: 10% privilege discount', 'success');
      return true;
    }
    showToast('Invalid promotion code. Try "VELOUR10"', 'error');
    return false;
  };

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.salePrice ?? item.price) * item.quantity, 0);
  }, [items]);

  const shipping = useMemo(() => {
    if (items.length === 0) return 0;
    return subtotal >= 250 ? 0 : 25;
  }, [items, subtotal]);

  const discount = useMemo(() => {
    if (discountCode === 'VELOUR10') {
      return Math.round(subtotal * 0.1);
    }
    return 0;
  }, [discountCode, subtotal]);

  const total = useMemo(() => {
    return Math.max(0, subtotal + shipping - discount);
  }, [subtotal, shipping, discount]);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        shipping,
        discount,
        total,
        discountCode,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyDiscountCode,
        refreshCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

