import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { Product } from '../types.ts';
import { apiFetch } from '../lib/api.ts';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export function QuickSearchModal({ isOpen, onClose, onNavigate }: QuickSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/products?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.products || []);
        }
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelectProduct = (id: string) => {
    onClose();
    onNavigate(`/product/${id}`);
  };

  const handleFullSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onClose();
      onNavigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div 
        className="relative w-full max-w-2xl bg-white shadow-2xl border border-neutral-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-5 py-4 border-b border-neutral-100">
          <Search className="w-5 h-5 text-neutral-400 mr-3 shrink-0" />
          <form onSubmit={handleFullSearch} className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by collection, garment, fabric, or SKU..."
              className="w-full text-base sm:text-lg tracking-wide placeholder-neutral-400 bg-transparent border-none outline-none font-sans"
            />
          </form>
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs tracking-wider uppercase text-neutral-400 hover:text-neutral-900 mr-3 px-2 py-1"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6 divide-y divide-neutral-100">
          {loading && (
            <div className="py-12 text-center text-sm text-neutral-500 tracking-wider uppercase">
              Searching archives...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-base text-neutral-800 font-serif">No pieces found matching &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-neutral-500 mt-1 uppercase tracking-widest">
                Try searching for &lsquo;coat&rsquo;, &lsquo;cashmere&rsquo;, &lsquo;dress&rsquo;, or &lsquo;blazer&rsquo;
              </p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div>
              <div className="flex items-center justify-between pb-3 text-xs tracking-widest uppercase text-neutral-400">
                <span>Matching Wardrobe ({results.length})</span>
                <button
                  onClick={handleFullSearch}
                  className="hover:text-black flex items-center gap-1 font-medium transition-colors"
                >
                  View all results <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {results.slice(0, 6).map(product => (
                  <div
                    key={product.id}
                    onClick={() => handleSelectProduct(product.id)}
                    className="flex items-center gap-3 p-2 hover:bg-neutral-50 cursor-pointer transition-colors group"
                  >
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-14 h-18 object-cover bg-neutral-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] tracking-widest uppercase text-neutral-400 block font-medium">
                        {product.brand} &bull; {product.category}
                      </span>
                      <h4 className="text-xs sm:text-sm font-medium text-neutral-900 truncate group-hover:text-neutral-600 transition-colors">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-semibold text-neutral-900">
                          ${product.salePrice ?? product.price}
                        </span>
                        {product.salePrice && (
                          <span className="text-xs line-through text-neutral-400">
                            ${product.price}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!query && (
            <div className="py-4">
              <span className="text-[11px] uppercase tracking-widest text-neutral-400 block mb-3 font-semibold">
                Popular Searches
              </span>
              <div className="flex flex-wrap gap-2">
                {['Cashmere Trench', 'Italian Blazer', 'Silk Dress', 'Raw Denim', 'Calfskin Boots', 'Merino Knit'].map(term => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-xs text-neutral-700 tracking-wide transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
