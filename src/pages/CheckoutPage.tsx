import React, { useState, useEffect } from 'react';
import { ShieldCheck, Truck, ArrowLeft, CheckCircle2, AlertCircle, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { apiFetch } from '../lib/api.ts';

interface CheckoutPageProps {
  onNavigate: (path: string) => void;
}

export function CheckoutPage({ onNavigate }: CheckoutPageProps) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { items, subtotal, shipping, discount, total, discountCode, clearCart } = useCart();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'United States'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Prepopulate form from authenticated profile
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || prev.fullName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        address: user.address || prev.address,
        city: user.city || prev.city,
        country: user.country || prev.country
      }));
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-black border-t-transparent mb-3" />
        <p className="text-xs uppercase tracking-widest text-neutral-500">Securing Session...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="font-serif text-3xl mb-3">No Items to Checkout</h1>
        <p className="text-xs uppercase tracking-widest text-neutral-500 mb-6">
          Your bag is currently empty. Add pieces before proceeding.
        </p>
        <button
          onClick={() => onNavigate('/women')}
          className="px-8 py-3 bg-black text-white text-xs uppercase tracking-widest font-semibold"
        >
          Explore Collection
        </button>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Form validation
    const required = ['fullName', 'phone', 'email', 'address', 'city', 'postalCode', 'country'] as const;
    for (const key of required) {
      if (!formData[key]?.trim()) {
        setErrorMsg(`Please fill in your ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          shippingAddress: formData,
          discountCode,
          guestItems: items
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to place order.');
        showToast(data.error || 'Failed to place order', 'error');
        setIsSubmitting(false);
        return;
      }

      // Order created successfully
      await clearCart();
      showToast(`Order ${data.order.orderNumber} placed successfully!`, 'success');
      onNavigate(`/order-success/${data.order.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error while finalizing order');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Back button */}
      <button
        onClick={() => onNavigate('/cart')}
        className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 hover:text-black mb-8 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Bag</span>
      </button>

      <div className="mb-10">
        <span className="text-xs uppercase tracking-[0.25em] text-neutral-400 font-semibold block mb-1">
          Finalize Wardrobe Delivery
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-neutral-900 font-normal">
          Bespoke Checkout
        </h1>
      </div>

      {!isAuthenticated ? (
        <div className="mb-8 p-4 bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-neutral-600 shrink-0" />
            <span>Checking out as an esteemed Guest. You can also sign in to sync with your wardrobe account.</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/login?redirect=/checkout')}
            className="text-neutral-900 font-semibold underline underline-offset-4 hover:text-black uppercase tracking-wider text-[11px] shrink-0"
          >
            Sign In to Account
          </button>
        </div>
      ) : (
        <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Signed in as <strong>{user?.name}</strong> ({user?.email})</span>
          </div>
          <span className="text-[10px] tracking-widest uppercase font-semibold text-emerald-800">
            Member Order
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-8 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Shipping & Delivery Info (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Shipping Address Section */}
          <div className="bg-white border border-neutral-200 p-6 sm:p-8 space-y-6">
            <h2 className="font-serif text-xl sm:text-2xl text-neutral-900 border-b border-neutral-100 pb-4">
              1. Delivery Address
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-wider text-neutral-700 font-semibold mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Eleanor Vance"
                  className="w-full px-4 py-3 text-xs bg-neutral-50 border border-neutral-200 focus:bg-white focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-700 font-semibold mb-1.5">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-3 text-xs bg-neutral-50 border border-neutral-200 focus:bg-white focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-700 font-semibold mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="eleanor@example.com"
                  className="w-full px-4 py-3 text-xs bg-neutral-50 border border-neutral-200 focus:bg-white focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-wider text-neutral-700 font-semibold mb-1.5">
                  Street Address & Apartment / Suite *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="742 Evergreen Terrace, Apt 4B"
                  className="w-full px-4 py-3 text-xs bg-neutral-50 border border-neutral-200 focus:bg-white focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-700 font-semibold mb-1.5">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  placeholder="New York"
                  className="w-full px-4 py-3 text-xs bg-neutral-50 border border-neutral-200 focus:bg-white focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-700 font-semibold mb-1.5">
                  Postal / ZIP Code *
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  required
                  placeholder="10001"
                  className="w-full px-4 py-3 text-xs bg-neutral-50 border border-neutral-200 focus:bg-white focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-wider text-neutral-700 font-semibold mb-1.5">
                  Country / Region *
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-xs bg-neutral-50 border border-neutral-200 focus:bg-white focus:outline-none focus:border-black cursor-pointer font-medium"
                >
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="France">France</option>
                  <option value="Italy">Italy</option>
                  <option value="Germany">Germany</option>
                  <option value="Japan">Japan</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment Method Section */}
          <div className="bg-white border border-neutral-200 p-6 sm:p-8 space-y-4">
            <h2 className="font-serif text-xl sm:text-2xl text-neutral-900 border-b border-neutral-100 pb-4">
              2. Payment Method
            </h2>

            <div className="p-4 border-2 border-black bg-neutral-50 flex items-start gap-4">
              <div className="w-5 h-5 rounded-full border-4 border-black bg-white mt-0.5 shrink-0" />
              <div>
                <span className="text-xs uppercase tracking-widest font-bold text-neutral-900 block mb-1">
                  Cash on Delivery (COD)
                </span>
                <p className="text-xs text-neutral-600 font-light leading-relaxed">
                  Pay securely with cash upon doorstep delivery. You may inspect the package and garments with our courier prior to payment.
                </p>
                <span className="inline-block mt-2 text-[11px] uppercase tracking-wider text-neutral-500 bg-neutral-200/60 px-2 py-0.5">
                  Zero advance fee &bull; Insured transit
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Order Summary & Place Order Button (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-neutral-200 p-6 sm:p-8 space-y-6 sticky top-28 shadow-sm">
            <h2 className="font-serif text-2xl text-neutral-900 border-b border-neutral-100 pb-4">
              Order Items ({items.length})
            </h2>

            {/* Compact items list */}
            <div className="max-h-64 overflow-y-auto divide-y divide-neutral-100 pr-1 space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="pt-3 flex gap-3 items-center">
                  <img src={item.image} alt={item.name} className="w-12 h-16 object-cover bg-neutral-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-serif text-neutral-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider">
                      {item.size} &bull; {item.color} &bull; Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-neutral-900">
                    ${(item.salePrice ?? item.price) * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="border-t border-neutral-200 pt-4 space-y-2.5 text-xs uppercase tracking-wider text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-neutral-900">${subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping === 0 ? <strong className="text-emerald-700">COMPLIMENTARY</strong> : `$${shipping}`}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Privilege (10%)</span>
                  <span>-${discount}</span>
                </div>
              )}
              <div className="border-t border-neutral-200 pt-3 flex justify-between text-base font-semibold text-neutral-950">
                <span className="font-serif text-lg">Total Due at Door</span>
                <span className="text-lg">${total}</span>
              </div>
            </div>

            {/* Place Order CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-black text-white text-xs uppercase tracking-[0.25em] font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authorizing Order...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Place Order &bull; ${total}</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center text-[11px] text-neutral-400 leading-normal">
              By confirming your order, you agree to VELOUR Fashion&apos;s Terms of Service and Privacy Policy.
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
