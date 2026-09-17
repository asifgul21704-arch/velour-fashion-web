import React, { useState } from 'react';
import { Trash2, ArrowRight, ShoppingBag, ShieldCheck, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';

interface CartPageProps {
  onNavigate: (path: string) => void;
}

export function CartPage({ onNavigate }: CartPageProps) {
  const {
    items,
    itemCount,
    subtotal,
    shipping,
    discount,
    total,
    discountCode,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyDiscountCode
  } = useCart();

  const [couponInput, setCouponInput] = useState('');

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponInput) {
      applyDiscountCode(couponInput);
      setCouponInput('');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 sm:py-32 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-neutral-100 flex items-center justify-center rounded-full text-neutral-400">
          <ShoppingBag className="w-8 h-8 stroke-1" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-neutral-900 mb-3">
          Your Bag is Empty
        </h1>
        <p className="text-sm text-neutral-500 max-w-md mx-auto mb-8 font-light leading-relaxed">
          You haven&apos;t added any modern essentials to your wardrobe yet. Explore our latest atelier arrivals for women and men.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onNavigate('/women')}
            className="w-full sm:w-auto px-8 py-3.5 bg-black text-white text-xs uppercase tracking-[0.2em] font-semibold hover:bg-neutral-800 transition-colors"
          >
            Shop Women
          </button>
          <button
            onClick={() => onNavigate('/men')}
            className="w-full sm:w-auto px-8 py-3.5 border border-neutral-300 text-neutral-900 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-neutral-50 transition-colors"
          >
            Shop Men
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="flex items-baseline justify-between border-b border-neutral-200 pb-6 mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl text-neutral-900 font-light">
          Shopping Bag ({itemCount} {itemCount === 1 ? 'Piece' : 'Pieces'})
        </h1>
        <button
          onClick={clearCart}
          className="text-xs uppercase tracking-widest text-neutral-400 hover:text-rose-600 transition-colors"
        >
          Clear Bag
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Cart Items (8 cols) */}
        <div className="lg:col-span-8 divide-y divide-neutral-200">
          {items.map((item, idx) => {
            const itemTotal = (item.salePrice ?? item.price) * item.quantity;
            return (
              <div key={`${item.productId}-${item.size}-${item.color}-${idx}`} className="py-6 flex gap-4 sm:gap-6">
                {/* Product Thumbnail */}
                <div
                  onClick={() => onNavigate(`/product/${item.productId}`)}
                  className="w-24 h-32 sm:w-28 sm:h-36 bg-neutral-100 shrink-0 cursor-pointer overflow-hidden"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <h3
                        onClick={() => onNavigate(`/product/${item.productId}`)}
                        className="text-base font-serif text-neutral-900 hover:text-neutral-600 cursor-pointer transition-colors"
                      >
                        {item.name}
                      </h3>
                      <span className="text-sm font-semibold text-neutral-950">
                        ${itemTotal}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs uppercase tracking-wider text-neutral-500">
                      <span className="bg-neutral-100 px-2 py-0.5 text-neutral-700">Size: {item.size}</span>
                      <span className="bg-neutral-100 px-2 py-0.5 text-neutral-700">Color: {item.color}</span>
                      <span>${item.salePrice ?? item.price} each</span>
                    </div>
                  </div>

                  {/* Quantity and Remove */}
                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center border border-neutral-300 bg-white">
                      <button
                        onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-sm text-neutral-600 hover:text-black"
                      >
                        &minus;
                      </button>
                      <span className="w-10 text-center text-xs font-semibold text-neutral-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="w-8 h-8 flex items-center justify-center text-sm text-neutral-600 hover:text-black disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.productId, item.size, item.color)}
                      className="text-neutral-400 hover:text-rose-600 p-1 transition-colors flex items-center gap-1 text-xs tracking-wider uppercase"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Order Summary (4 cols) */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-neutral-200 p-6 sm:p-8 space-y-6 sticky top-28 shadow-sm">
            <h2 className="font-serif text-2xl text-neutral-900 border-b border-neutral-100 pb-4">
              Order Summary
            </h2>

            {/* Calculations */}
            <div className="space-y-3 text-xs uppercase tracking-wider text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-neutral-900">${subtotal}</span>
              </div>

              <div className="flex justify-between">
                <span>Estimated Shipping</span>
                <span>{shipping === 0 ? <strong className="text-emerald-700">COMPLIMENTARY</strong> : `$${shipping}`}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Privilege (10%)</span>
                  <span>-${discount}</span>
                </div>
              )}

              <div className="border-t border-neutral-200 pt-3 flex justify-between text-base font-semibold text-neutral-950">
                <span className="font-serif text-lg">Total</span>
                <span className="text-lg">${total}</span>
              </div>
            </div>

            {/* Privilege / Promo Code Form */}
            <div className="pt-2">
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value)}
                    placeholder="Promotion code"
                    className="w-full pl-9 pr-3 py-2 text-xs uppercase tracking-wider bg-neutral-50 border border-neutral-200 focus:bg-white focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white text-xs uppercase tracking-widest hover:bg-black font-semibold transition-colors"
                >
                  Apply
                </button>
              </form>
              {discountCode && (
                <p className="text-[11px] text-emerald-600 mt-2 tracking-wide">
                  &bull; Code &ldquo;{discountCode}&rdquo; active
                </p>
              )}
            </div>

            {/* Proceed to Checkout */}
            <button
              onClick={() => onNavigate('/checkout')}
              className="w-full py-4 bg-black text-white text-xs uppercase tracking-[0.25em] font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Trust notes */}
            <div className="pt-4 border-t border-neutral-100 flex items-center justify-center gap-2 text-[11px] text-neutral-500 uppercase tracking-wider text-center">
              <ShieldCheck className="w-4 h-4 text-neutral-800" />
              <span>Cash on delivery &bull; 30-day returns</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
