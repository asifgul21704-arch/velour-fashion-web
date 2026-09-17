import React, { useState, useEffect } from 'react';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Product } from '../types.ts';
import { useWishlist } from '../context/WishlistContext.tsx';
import { ProductCard } from '../components/ProductCard.tsx';
import { apiFetch } from '../lib/api.ts';

interface WishlistPageProps {
  onNavigate: (path: string) => void;
}

export function WishlistPage({ onNavigate }: WishlistPageProps) {
  const { wishlistIds, removeFromWishlist, clearWishlist } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWishlistItems() {
      setLoading(true);
      try {
        const res = await apiFetch('/api/wishlist');
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (err) {
        console.error('Failed to load wishlist items', err);
      } finally {
        setLoading(false);
      }
    }
    loadWishlistItems();
  }, [wishlistIds]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-neutral-200 pb-6 mb-8 gap-4">
        <div>
          <span className="text-xs uppercase tracking-[0.28em] text-neutral-400 font-semibold block mb-1">
            Private Atelier Curation
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-neutral-900 font-light">
            My Wishlist ({products.length})
          </h1>
        </div>

        {products.length > 0 && (
          <button
            onClick={clearWishlist}
            className="text-xs uppercase tracking-widest text-neutral-400 hover:text-rose-600 transition-colors self-start sm:self-auto"
          >
            Clear All Saved Pieces
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <div className="inline-block animate-spin w-8 h-8 border-2 border-black border-t-transparent mb-3" />
          <p className="text-xs uppercase tracking-widest text-neutral-500">Accessing Saved Archive...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-neutral-200 p-16 text-center space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400">
            <Heart className="w-8 h-8 stroke-1" />
          </div>
          <h2 className="font-serif text-2xl text-neutral-800">Your Wishlist is Empty</h2>
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-light leading-relaxed">
            Click the heart icon on any piece across our collections to bookmark your personal favorites.
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <button
              onClick={() => onNavigate('/women')}
              className="px-6 py-3 bg-black text-white text-xs uppercase tracking-widest font-semibold hover:bg-neutral-800 transition-colors"
            >
              Browse Women
            </button>
            <button
              onClick={() => onNavigate('/men')}
              className="px-6 py-3 border border-neutral-300 text-neutral-900 text-xs uppercase tracking-widest font-semibold hover:bg-neutral-50 transition-colors"
            >
              Browse Men
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
