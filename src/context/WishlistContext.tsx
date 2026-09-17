import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product } from '../types.ts';
import { useAuth } from './AuthContext.tsx';
import { useToast } from './ToastContext.tsx';
import { apiFetch } from '../lib/api.ts';

interface WishlistContextType {
  wishlistIds: string[];
  wishlistProducts: Product[];
  loading: boolean;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const GUEST_WISHLIST_KEY = 'velour_guest_wishlist';

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshWishlist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/wishlist');
      if (res.ok) {
        const data = await res.json();
        setWishlistIds(data.productIds || []);
        setWishlistProducts(data.products || []);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Failed to load server wishlist, using local cache', err);
    }

    try {
      const local = localStorage.getItem(GUEST_WISHLIST_KEY);
      const ids: string[] = local ? JSON.parse(local) : [];
      setWishlistIds(ids);

      if (ids.length > 0) {
        const prods: Product[] = [];
        for (const id of ids) {
          const r = await apiFetch(`/api/products/${id}`);
          if (r.ok) {
            const d = await r.json();
            if (d.product) prods.push(d.product);
          }
        }
        setWishlistProducts(prods);
      } else {
        setWishlistProducts([]);
      }
    } catch (e) {
      setWishlistIds([]);
      setWishlistProducts([]);
    }
    setLoading(false);
  }, [isAuthenticated]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const toggleWishlist = async (productId: string) => {
    try {
      const res = await apiFetch('/api/wishlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ productId })
      });
      const data = await res.json();
      if (res.ok && data.productIds) {
        setWishlistIds(data.productIds);
        if (data.isInWishlist) {
          showToast('Saved to your wishlist', 'success');
        } else {
          showToast('Removed from your wishlist', 'info');
        }
        await refreshWishlist();
        return;
      }
    } catch (e) {
      // Fallback to local
    }

    const exists = wishlistIds.includes(productId);
    let updated: string[];
    if (exists) {
      updated = wishlistIds.filter(id => id !== productId);
      showToast('Removed from your wishlist', 'info');
    } else {
      updated = [...wishlistIds, productId];
      showToast('Saved to your wishlist', 'success');
    }
    setWishlistIds(updated);
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(updated));
    await refreshWishlist();
  };

  const removeFromWishlist = async (productId: string) => {
    if (isInWishlist(productId)) {
      await toggleWishlist(productId);
    }
  };

  const clearWishlist = async () => {
    setWishlistIds([]);
    setWishlistProducts([]);
    try {
      localStorage.removeItem(GUEST_WISHLIST_KEY);
    } catch {}
    showToast('Wishlist cleared', 'info');
  };

  const isInWishlist = (productId: string) => {
    return wishlistIds.includes(productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistProducts,
        loading,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
        refreshWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
}
