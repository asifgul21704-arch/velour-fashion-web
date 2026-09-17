import React, { useState } from 'react';
import { Heart, ShoppingBag, Check } from 'lucide-react';
import { Product } from '../types.ts';
import { useWishlist } from '../context/WishlistContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useToast } from '../context/ToastContext.tsx';

interface ProductCardProps {
  key?: React.Key;
  product: Product;
  onNavigate: (path: string) => void;
}

export function ProductCard({ product, onNavigate }: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [isHovered, setIsHovered] = useState(false);
  const [showQuickSelect, setShowQuickSelect] = useState(false);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'M');
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || 'Black');
  const [isAdding, setIsAdding] = useState(false);

  const isSaved = isInWishlist(product.id);
  const hasMultipleImages = product.images && product.images.length > 1;
  const currentImage = isHovered && hasMultipleImages ? product.images[1] : product.images[0];
  const isOutOfStock = product.stock <= 0;

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) {
      showToast('This item is currently out of stock', 'error');
      return;
    }

    if (!showQuickSelect && (product.sizes.length > 1 || product.colors.length > 1)) {
      setShowQuickSelect(true);
      return;
    }

    setIsAdding(true);
    const res = await addToCart(product.id, selectedSize, selectedColor, 1);
    setIsAdding(false);
    if (res.success) {
      setShowQuickSelect(false);
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div
      className="group relative flex flex-col cursor-pointer select-none bg-white transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowQuickSelect(false);
      }}
      onClick={() => onNavigate(`/product/${product.id}`)}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100">
        <img
          src={currentImage}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          {product.newArrival && (
            <span className="bg-white/95 backdrop-blur-sm text-neutral-900 text-[10px] tracking-[0.2em] uppercase font-semibold px-2.5 py-1 shadow-sm">
              New Arrival
            </span>
          )}
          {product.salePrice && (
            <span className="bg-[#121212] text-white text-[10px] tracking-[0.2em] uppercase font-semibold px-2.5 py-1">
              Sale
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-neutral-800 text-neutral-300 text-[10px] tracking-[0.2em] uppercase font-semibold px-2.5 py-1">
              Sold Out
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          className={`absolute top-3 right-3 p-2.5 transition-all duration-200 z-20 rounded-full ${
            isSaved
              ? 'bg-black text-white shadow-md'
              : 'bg-white/80 backdrop-blur-sm text-neutral-700 hover:bg-white hover:text-black shadow-sm'
          }`}
          aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        {/* Quick Add Overlay Drawer */}
        {!isOutOfStock && (
          <div
            className={`absolute inset-x-0 bottom-0 p-3 bg-white/95 backdrop-blur-md border-t border-neutral-100 transition-all duration-300 z-20 ${
              isHovered || showQuickSelect ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
            }`}
            onClick={e => e.stopPropagation()}
          >
            {showQuickSelect ? (
              <div className="space-y-2">
                {/* Size options */}
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold block mb-1">
                    Select Size
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {product.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`text-xs px-2.5 py-1 border transition-colors ${
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

                {/* Color options */}
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold block mb-1">
                    Select Color
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {product.colors.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`text-[11px] px-2 py-0.5 border transition-colors ${
                          selectedColor === color
                            ? 'bg-black text-white border-black font-medium'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-black'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleQuickAdd}
                  disabled={isAdding}
                  className="w-full mt-2 py-2 bg-black text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isAdding ? 'Adding...' : 'Confirm & Add to Bag'}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleQuickAdd}
                disabled={isAdding}
                className="w-full py-2.5 bg-black text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{isAdding ? 'Adding...' : 'Quick Add to Bag'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="pt-3.5 pb-2 flex flex-col flex-1">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-neutral-400 mb-1">
          <span>{product.brand}</span>
          <span>{product.category}</span>
        </div>

        <h3 className="text-sm font-medium text-neutral-900 line-clamp-1 group-hover:text-neutral-600 transition-colors">
          {product.name}
        </h3>

        <div className="mt-2 flex items-center gap-2">
          {product.salePrice ? (
            <>
              <span className="text-sm font-semibold text-neutral-950">
                ${product.salePrice}
              </span>
              <span className="text-xs text-neutral-400 line-through">
                ${product.price}
              </span>
            </>
          ) : (
            <span className="text-sm font-medium text-neutral-900">
              ${product.price}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
