import React, { useState, useEffect } from 'react';
import { Heart, ShoppingBag, Truck, ShieldCheck, ChevronRight, Check, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Product } from '../types.ts';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { ProductCard } from '../components/ProductCard.tsx';
import { apiFetch } from '../lib/api.ts';

interface ProductDetailPageProps {
  productId: string;
  onNavigate: (path: string) => void;
}

export function ProductDetailPage({ productId, onNavigate }: ProductDetailPageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Variant States
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [validationError, setValidationError] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { showToast } = useToast();

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/products/${productId}`);
        if (res.ok) {
          const data = await res.json();
          const prod: Product = data.product;
          setProduct(prod);

          // Pre-select if only 1 option
          if (prod.sizes.length === 1) setSelectedSize(prod.sizes[0]);
          else setSelectedSize('');

          if (prod.colors.length === 1) setSelectedColor(prod.colors[0]);
          else setSelectedColor('');

          setQuantity(1);
          setValidationError('');
          setSelectedImageIndex(0);

          // Fetch related
          const relRes = await apiFetch(`/api/products?gender=${prod.gender}&category=${prod.category}`);
          if (relRes.ok) {
            const relData = await relRes.json();
            setRelatedProducts(relData.products.filter((p: Product) => p.id !== prod.id).slice(0, 4));
          }
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error('Error fetching product details', err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [productId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-black border-t-transparent mb-4" />
        <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">Unveiling Piece...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="font-serif text-3xl text-neutral-900 mb-2">Piece Not Found</h1>
        <p className="text-xs uppercase tracking-widest text-neutral-500 mb-6">
          The requested archive item may have been discontinued or moved.
        </p>
        <button
          onClick={() => onNavigate('/women')}
          className="px-6 py-3 bg-black text-white text-xs uppercase tracking-widest font-semibold"
        >
          Return to Wardrobe
        </button>
      </div>
    );
  }

  const isSaved = isInWishlist(product.id);
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = async () => {
    // 1. Mandatory Size Validation
    if (!selectedSize) {
      setValidationError('Please select a size to proceed with order.');
      showToast('Please choose a size', 'error');
      return;
    }

    // 2. Mandatory Color Validation
    if (!selectedColor) {
      setValidationError('Please select a color palette.');
      showToast('Please choose a color', 'error');
      return;
    }

    setValidationError('');
    setIsAdding(true);

    await addToCart(product.id, selectedSize, selectedColor, quantity);
    setIsAdding(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-[11px] uppercase tracking-widest text-neutral-400 mb-8">
        <button onClick={() => onNavigate('/')} className="hover:text-black transition-colors">
          Home
        </button>
        <ChevronRight className="w-3 h-3" />
        <button onClick={() => onNavigate(`/${product.gender}`)} className="hover:text-black transition-colors capitalize">
          {product.gender}
        </button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-neutral-900 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        {/* Left Column: Image Gallery (7 cols) */}
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto max-h-[650px] shrink-0">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 h-20 sm:w-20 sm:h-26 overflow-hidden border transition-all ${
                    selectedImageIndex === idx ? 'border-black ring-1 ring-black' : 'border-neutral-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Main Active Image */}
          <div className="flex-1 relative aspect-[3/4] bg-neutral-100 overflow-hidden group">
            <img
              src={product.images[selectedImageIndex] || product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
            />
            {product.salePrice && (
              <span className="absolute top-4 left-4 bg-black text-white text-[10px] tracking-[0.2em] uppercase font-semibold px-3 py-1">
                Sale Selection
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Product Purchasing & Info (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-start space-y-7">
          {/* Header */}
          <div className="space-y-2 border-b border-neutral-100 pb-5">
            <div className="flex items-center justify-between text-xs tracking-[0.25em] uppercase text-neutral-400 font-medium">
              <span>{product.brand}</span>
              <span>SKU: {product.sku}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl text-neutral-900 font-normal leading-tight">
              {product.name}
            </h1>

            {/* Pricing */}
            <div className="flex items-center gap-3 pt-1">
              {product.salePrice ? (
                <>
                  <span className="text-2xl font-semibold text-neutral-950">
                    ${product.salePrice}
                  </span>
                  <span className="text-base text-neutral-400 line-through">
                    ${product.price}
                  </span>
                  <span className="text-xs tracking-wider uppercase font-semibold text-rose-600 bg-rose-50 px-2 py-0.5">
                    Save ${product.price - product.salePrice}
                  </span>
                </>
              ) : (
                <span className="text-2xl font-semibold text-neutral-950">
                  ${product.price}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-neutral-600 font-light leading-relaxed">
            {product.description}
          </p>

          {/* Selection Validation Alert */}
          {validationError && (
            <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Size Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs uppercase tracking-wider">
              <span className="font-semibold text-neutral-900">
                Size: <span className="font-normal text-neutral-600">{selectedSize || 'Choose Size'}</span>
              </span>
              <button
                type="button"
                onClick={() => showToast('Standard international tailored sizing. True to size.', 'info')}
                className="text-[11px] text-neutral-400 underline hover:text-black"
              >
                Size Guide
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {product.sizes.map(size => (
                <button
                  key={size}
                  onClick={() => {
                    setSelectedSize(size);
                    setValidationError('');
                  }}
                  className={`py-3 text-xs uppercase font-medium border text-center transition-all ${
                    selectedSize === size
                      ? 'bg-black text-white border-black shadow-sm'
                      : 'bg-white text-neutral-800 border-neutral-200 hover:border-black'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-neutral-900 block">
              Color: <span className="font-normal text-neutral-600">{selectedColor || 'Choose Color'}</span>
            </span>

            <div className="flex flex-wrap gap-2">
              {product.colors.map(color => (
                <button
                  key={color}
                  onClick={() => {
                    setSelectedColor(color);
                    setValidationError('');
                  }}
                  className={`px-4 py-2 text-xs uppercase tracking-wider border transition-all ${
                    selectedColor === color
                      ? 'bg-black text-white border-black font-semibold'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-black'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selector & Stock Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-neutral-700">
              <span className="font-semibold">Quantity</span>
              <span className={product.stock <= 5 ? 'text-amber-700 font-medium' : 'text-neutral-500'}>
                {product.stock > 0 ? (
                  product.stock <= 5 ? `Only ${product.stock} left in stock` : `${product.stock} available`
                ) : (
                  'Out of stock'
                )}
              </span>
            </div>

            <div className="flex items-center border border-neutral-300 w-36 bg-white">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1 || isOutOfStock}
                className="w-10 h-11 flex items-center justify-center text-base text-neutral-600 hover:text-black disabled:opacity-30"
              >
                &minus;
              </button>
              <span className="flex-1 text-center text-sm font-semibold text-neutral-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock || isOutOfStock}
                className="w-10 h-11 flex items-center justify-center text-base text-neutral-600 hover:text-black disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons: Add to Bag & Wishlist */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAddToCart}
              disabled={isAdding || isOutOfStock}
              className="flex-1 py-4 bg-black text-white text-xs uppercase tracking-[0.25em] font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {isOutOfStock ? 'Sold Out' : isAdding ? 'Adding to Bag...' : 'Add to Bag'}
              </span>
            </button>

            <button
              onClick={() => toggleWishlist(product.id)}
              className={`p-4 border text-xs uppercase tracking-[0.2em] font-medium transition-colors flex items-center justify-center gap-2 ${
                isSaved
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-800 border-neutral-300 hover:border-black'
              }`}
              aria-label={isSaved ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Wishlist'}</span>
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="border-t border-neutral-200 pt-6 space-y-3.5 text-xs text-neutral-600">
            <div className="flex items-center gap-3">
              <Truck className="w-4 h-4 text-neutral-900 shrink-0" />
              <span>Complimentary insured shipping on orders over $250</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-neutral-900 shrink-0" />
              <span>Cash on Delivery with doorstep garment examination</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-4 h-4 text-neutral-900 shrink-0" />
              <span>30-day effortless worldwide returns and exchanges</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Curations */}
      {relatedProducts.length > 0 && (
        <section className="mt-24 pt-16 border-t border-neutral-200">
          <div className="mb-8 text-center">
            <span className="text-xs uppercase tracking-[0.28em] text-neutral-400 font-semibold block mb-1">
              Complete The Look
            </span>
            <h2 className="font-serif text-3xl text-neutral-900 font-normal">
              Curated Accompaniments
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
