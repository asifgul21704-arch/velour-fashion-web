import React, { useState, useEffect } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { Product } from '../types.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { apiFetch } from '../lib/api.ts';

interface SearchPageProps {
  initialQuery?: string;
  onNavigate: (path: string) => void;
}

export function SearchPage({ initialQuery = '', onNavigate }: SearchPageProps) {
  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setProducts([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await apiFetch(`/api/products?q=${encodeURIComponent(searchTerm.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (e) {
      console.error('Search error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Search Header */}
      <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
        <span className="text-xs uppercase tracking-[0.3em] text-neutral-400 font-semibold block">
          Archive Search
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-neutral-900 font-normal">
          Discover VELOUR Essentials
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 font-light max-w-md mx-auto">
          Query our catalogue by garment name, silhouette, textile composition, or SKU reference code.
        </p>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="relative max-w-xl mx-auto mt-6">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by silk, coat, linen, blazer, SKU..."
            className="w-full pl-12 pr-28 py-3.5 bg-white border border-neutral-300 text-xs sm:text-sm tracking-wider placeholder-neutral-400 focus:outline-none focus:border-black transition-colors shadow-sm"
          />
          <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-3.5" />
          <button
            type="submit"
            className="absolute right-2 top-2 bottom-2 px-5 bg-black text-white text-xs uppercase tracking-widest font-semibold hover:bg-neutral-800 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Results */}
      <div>
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin w-8 h-8 border-2 border-black border-t-transparent mb-3" />
            <p className="text-xs uppercase tracking-widest text-neutral-500">Searching Atelier Records...</p>
          </div>
        ) : hasSearched && products.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-neutral-300 p-8 max-w-xl mx-auto">
            <p className="font-serif text-2xl text-neutral-800 mb-2">No Matching Garments</p>
            <p className="text-xs uppercase tracking-widest text-neutral-500 mb-6">
              We couldn&apos;t find any archive pieces matching &ldquo;{query}&rdquo;.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Cashmere', 'Dress', 'Tailored', 'Blazer', 'Denim'].map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    setQuery(tag);
                    handleSearch(tag);
                  }}
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-xs text-neutral-800 tracking-wider transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ) : products.length > 0 ? (
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 mb-8">
              <span className="text-xs uppercase tracking-widest text-neutral-500">
                Found {products.length} {products.length === 1 ? 'Garment' : 'Garments'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-xs uppercase tracking-widest text-neutral-400">
            Enter a search term above to browse specific wardrobe pieces.
          </div>
        )}
      </div>
    </div>
  );
}
