import React, { useState, useEffect, useCallback } from 'react';
import { Filter, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Product, Gender } from '../types.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { apiFetch } from '../lib/api.ts';

interface CatalogPageProps {
  gender: Gender;
  onNavigate: (path: string) => void;
}

export function CatalogPage({ gender, onNavigate }: CatalogPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<'featured' | 'newest' | 'price-low' | 'price-high'>('featured');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [priceRange, setPriceRange] = useState<number>(1000);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const categories = gender === 'women'
    ? ['Dresses', 'Jackets', 'Tops', 'Trousers', 'Jeans', 'Accessories']
    : ['Jackets', 'Shirts', 'Hoodies', 'Jeans', 'Accessories'];

  const sizes = gender === 'women'
    ? ['XS', 'S', 'M', 'L', 'XL', '25', '26', '27', '28', '29', '30']
    : ['S', 'M', 'L', 'XL', '30', '32', '34', '36', '38R', '40R', '42R', '44R'];

  const colors = ['Black', 'White', 'Camel', 'Navy', 'Grey', 'Olive', 'Espresso', 'Champagne'];

  const fetchFilteredProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('gender', gender);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedSort) params.append('sort', selectedSort);
      if (selectedSize) params.append('size', selectedSize);
      if (selectedColor) params.append('color', selectedColor);
      if (inStockOnly) params.append('inStock', 'true');
      if (priceRange < 1000) params.append('maxPrice', priceRange.toString());

      const res = await apiFetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Error filtering products', err);
    } finally {
      setLoading(false);
    }
  }, [gender, selectedCategory, selectedSort, selectedSize, selectedColor, inStockOnly, priceRange]);

  useEffect(() => {
    // Reset category when gender changes
    setSelectedCategory('all');
    setSelectedSize('');
    setSelectedColor('');
  }, [gender]);

  useEffect(() => {
    fetchFilteredProducts();
  }, [fetchFilteredProducts]);

  const activeFilterCount = [
    selectedCategory !== 'all',
    selectedSize !== '',
    selectedColor !== '',
    inStockOnly,
    priceRange < 1000
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedSize('');
    setSelectedColor('');
    setInStockOnly(false);
    setPriceRange(1000);
    setSelectedSort('featured');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Banner */}
      <div className="mb-10 text-center space-y-3">
        <span className="text-xs uppercase tracking-[0.3em] text-neutral-400 font-semibold block">
          VELOUR Haute Prêt-à-Porter
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-neutral-900 font-light capitalize">
          {gender}&apos;s Collection
        </h1>
        <p className="text-sm text-neutral-500 max-w-xl mx-auto font-light leading-relaxed">
          {gender === 'women'
            ? 'Sculptural elegance, natural silk draping, and architectural tailoring crafted with timeless restraint.'
            : 'Sartorial luxury deconstructed for daily life. Fine Italian wools, Japanese selvedge denim, and washed pure linens.'}
        </p>
      </div>

      {/* Control Bar: Categories, Filters & Sort */}
      <div className="sticky top-20 z-30 bg-[#FAFAFA]/95 backdrop-blur-md border-y border-neutral-200 py-3.5 mb-8 flex flex-wrap items-center justify-between gap-4">
        {/* Category Pills (Desktop) */}
        <div className="hidden lg:flex items-center space-x-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 text-xs uppercase tracking-wider transition-colors ${
              selectedCategory === 'all'
                ? 'bg-black text-white font-medium'
                : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            All Pieces
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs uppercase tracking-wider transition-colors ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-black text-white font-medium'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Mobile Filter Trigger */}
        <button
          onClick={() => setIsFilterDrawerOpen(true)}
          className="lg:hidden flex items-center gap-2 px-3.5 py-2 bg-white border border-neutral-300 text-xs uppercase tracking-wider text-neutral-800 font-medium"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
        </button>

        {/* Right: Sort Dropdown & Product Count */}
        <div className="flex items-center space-x-4 ml-auto">
          <span className="text-xs text-neutral-500 tracking-wider">
            {products.length} {products.length === 1 ? 'Garment' : 'Garments'}
          </span>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 hidden sm:inline" />
            <select
              value={selectedSort}
              onChange={e => setSelectedSort(e.target.value as any)}
              className="bg-white border border-neutral-200 px-3 py-1.5 text-xs uppercase tracking-wider text-neutral-800 focus:outline-none focus:border-black cursor-pointer font-medium"
            >
              <option value="featured">Featured Curations</option>
              <option value="newest">Newest Releases</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Sidebar Filters + Products Grid */}
      <div className="flex gap-10">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-8">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-neutral-800" />
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-neutral-900">
                Filter Archive
              </span>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-[11px] uppercase tracking-wider text-neutral-500 hover:text-black transition-colors"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Size Filter */}
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-widest text-neutral-900 font-semibold block">
              Size
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {sizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                  className={`py-1.5 text-xs border text-center transition-colors ${
                    selectedSize === size
                      ? 'bg-black text-white border-black font-semibold'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-black'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Color Filter */}
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-widest text-neutral-900 font-semibold block">
              Palette
            </span>
            <div className="flex flex-wrap gap-1.5">
              {colors.map(col => (
                <button
                  key={col}
                  onClick={() => setSelectedColor(selectedColor === col ? '' : col)}
                  className={`px-2.5 py-1 text-xs border transition-colors ${
                    selectedColor === col
                      ? 'bg-black text-white border-black font-medium'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-black'
                  }`}
                >
                  {col}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs uppercase tracking-wider text-neutral-800">
              <span className="font-semibold">Maximum Price</span>
              <span className="font-bold">${priceRange}</span>
            </div>
            <input
              type="range"
              min="50"
              max="1000"
              step="25"
              value={priceRange}
              onChange={e => setPriceRange(Number(e.target.value))}
              className="w-full accent-black cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>$50</span>
              <span>$1000+</span>
            </div>
          </div>

          {/* In Stock Only */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer text-xs uppercase tracking-wider text-neutral-700 font-medium">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={e => setInStockOnly(e.target.checked)}
                className="w-4 h-4 accent-black cursor-pointer rounded-none"
              />
              <span>In-Stock Pieces Only</span>
            </label>
          </div>
        </aside>

        {/* Product Grid */}
        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-[3/4] bg-neutral-200" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-24 text-center border border-dashed border-neutral-300 p-8">
              <p className="font-serif text-2xl text-neutral-800">No matching garments found</p>
              <p className="text-xs uppercase tracking-widest text-neutral-500 mt-2">
                Try widening your search filters or resetting all parameters.
              </p>
              <button
                onClick={resetFilters}
                className="mt-6 px-6 py-2.5 bg-black text-white text-xs uppercase tracking-widest font-medium hover:bg-neutral-800 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Drawer */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm lg:hidden">
          <div className="ml-auto w-full max-w-xs bg-white h-full p-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
                <span className="font-serif text-xl font-normal">Filters</span>
                <button
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="p-1 text-neutral-400 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-widest font-bold text-neutral-900 block">
                  Category
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1 text-xs uppercase tracking-wider ${
                      selectedCategory === 'all' ? 'bg-black text-white' : 'border border-neutral-200'
                    }`}
                  >
                    All
                  </button>
                  {categories.map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedCategory(c)}
                      className={`px-3 py-1 text-xs uppercase tracking-wider ${
                        selectedCategory === c ? 'bg-black text-white' : 'border border-neutral-200'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-widest font-bold text-neutral-900 block">
                  Size
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {sizes.map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(selectedSize === s ? '' : s)}
                      className={`py-1 text-xs border text-center ${
                        selectedSize === s ? 'bg-black text-white' : 'border-neutral-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* In stock */}
              <label className="flex items-center gap-3 text-xs uppercase tracking-wider font-medium text-neutral-800">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={e => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 accent-black"
                />
                <span>In-Stock Only</span>
              </label>
            </div>

            <div className="pt-6 border-t border-neutral-200 space-y-2">
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="w-full py-3 bg-black text-white text-xs uppercase tracking-widest font-semibold"
              >
                Show {products.length} Results
              </button>
              <button
                onClick={resetFilters}
                className="w-full py-2.5 border border-neutral-300 text-neutral-700 text-xs uppercase tracking-widest"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
