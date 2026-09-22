import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Truck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Wallet,
  Smartphone,
  CreditCard,
  Building2,
  Banknote,
  Check,
  Copy,
  Info
} from 'lucide-react';
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

  // Selected payment method
  const [selectedMethod, setSelectedMethod] = useState<
    'Cash on Delivery' | 'SadaPay' | 'JazzCash' | 'EasyPaisa' | 'NayaPay' | 'Credit Card' | 'Bank Transfer'
  >('Cash on Delivery');

  // Sub-fields for specific payment methods
  const [walletPhone, setWalletPhone] = useState('');
  const [walletTxnId, setWalletTxnId] = useState('');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    holder: '',
    expiry: '',
    cvv: ''
  });
  const [bankTxnRef, setBankTxnRef] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [gatewayConfig, setGatewayConfig] = useState<{
    provider: string;
    isConfigured: boolean;
    currency: string;
    publishableKey: string | null;
  } | null>(null);
  const [isCancelledNotice, setIsCancelledNotice] = useState(false);

  useEffect(() => {
    // Check if customer was redirected back after cancellation
    const params = new URLSearchParams(window.location.search);
    if (params.get('cancelled') === 'true') {
      setIsCancelledNotice(true);
    }

    // Load active gateway configuration
    apiFetch('/api/payments/config')
      .then(res => res.json())
      .then(data => setGatewayConfig(data))
      .catch(() => {});
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(label);
    showToast(`Copied ${label} to clipboard`, 'success');
    setTimeout(() => setCopiedField(null), 2500);
  };

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

    // Payment method validations
    if (['SadaPay', 'JazzCash', 'EasyPaisa', 'NayaPay'].includes(selectedMethod)) {
      if (!walletPhone.trim()) {
        setErrorMsg(`Please enter your ${selectedMethod} mobile account number.`);
        return;
      }
    } else if (selectedMethod === 'Credit Card') {
      if (!cardDetails.number.trim() || !cardDetails.expiry.trim() || !cardDetails.cvv.trim()) {
        setErrorMsg('Please complete all credit/debit card fields.');
        return;
      }
    }

    // Build order notes containing payment transaction reference if available
    let orderNotes = `Method: ${selectedMethod}`;
    if (['SadaPay', 'JazzCash', 'EasyPaisa', 'NayaPay'].includes(selectedMethod)) {
      orderNotes += ` | Account: ${walletPhone.trim()}`;
      if (walletTxnId.trim()) orderNotes += ` | TID: ${walletTxnId.trim()}`;
    } else if (selectedMethod === 'Credit Card') {
      orderNotes += ` | Gateway: Stripe 3D-Secure`;
    } else if (selectedMethod === 'Bank Transfer') {
      if (bankTxnRef.trim()) orderNotes += ` | Ref: ${bankTxnRef.trim()}`;
    }

    setIsSubmitting(true);
    try {
      const isCard = selectedMethod === 'Credit Card';

      // Submit through the production payment pipeline
      const res = await apiFetch('/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          shippingAddress: formData,
          paymentMethod: isCard ? 'Stripe' : selectedMethod,
          discountCode,
          guestItems: items,
          notes: orderNotes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to initialize payment.');
        showToast(data.error || 'Failed to initialize payment', 'error');
        setIsSubmitting(false);
        return;
      }

      // If Stripe Checkout URL was generated, redirect to Stripe secure portal
      if (data.checkoutUrl) {
        showToast('Redirecting to official Stripe Checkout...', 'info');
        window.location.href = data.checkoutUrl;
        return;
      }

      // For direct or cash on delivery methods, finalize order
      await clearCart();
      showToast(`Order #${data.orderNumber} placed successfully!`, 'success');
      onNavigate(`/order-success/${data.orderId}`);
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

      {isCancelledNotice && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Your payment session with the gateway was cancelled or interrupted. Your bag items have been retained.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsCancelledNotice(false)}
            className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 hover:text-black underline"
          >
            Dismiss
          </button>
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
                  <option value="Pakistan">Pakistan (PKR / SadaPay / JazzCash / EasyPaisa)</option>
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

          {/* Payment Method Section (Selector 1 Target) */}
          <div className="bg-white border border-neutral-200 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-2">
              <h2 className="font-serif text-xl sm:text-2xl text-neutral-900">
                2. Payment Method
              </h2>
              <span className="text-[11px] uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Encrypted & Verified Gateways</span>
              </span>
            </div>

            {/* Payment Options Grid / Accordion */}
            <div className="space-y-3">
              {/* Option 1: SadaPay */}
              <div
                onClick={() => setSelectedMethod('SadaPay')}
                className={`p-4 border transition-all cursor-pointer rounded-none ${
                  selectedMethod === 'SadaPay'
                    ? 'border-neutral-950 bg-neutral-50/80 ring-1 ring-neutral-950'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        selectedMethod === 'SadaPay' ? 'border-neutral-950 bg-neutral-950' : 'border-neutral-300'
                      }`}
                    >
                      {selectedMethod === 'SadaPay' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider font-bold text-neutral-900">
                          SadaPay
                        </span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-cyan-100 text-cyan-900 font-semibold rounded">
                          0% Fee Instant
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 font-light mt-0.5">
                        Send to official SadaPay IBAN / Account or SadaBiz link with instant verification.
                      </p>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 bg-neutral-900 text-white text-[10px] font-mono uppercase tracking-wider font-semibold">
                    SADA
                  </div>
                </div>

                {/* Sub-form when SadaPay is selected */}
                {selectedMethod === 'SadaPay' && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-4 pt-4 border-t border-neutral-200 space-y-3.5 text-xs"
                  >
                    <div className="bg-cyan-50/70 border border-cyan-200/80 p-3 text-cyan-950 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold uppercase tracking-wider text-[10px] text-cyan-900">
                          Official Boutique SadaPay Account
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('03120008899', 'SadaPay Number')}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-800 hover:underline"
                        >
                          {copiedField === 'SadaPay Number' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy No.
                            </>
                          )}
                        </button>
                      </div>
                      <div className="font-mono text-neutral-900 font-bold text-xs">
                        Account / IBAN: 0312-0008899 &bull; Title: VELOUR ATELIER
                      </div>
                      <p className="text-neutral-600 text-[10px] leading-relaxed">
                        Transfer the order total (${total}) via your SadaPay App, then enter your SadaPay mobile number and reference ID below.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-neutral-700 mb-1">
                          Your SadaPay Mobile Number *
                        </label>
                        <input
                          type="text"
                          value={walletPhone}
                          onChange={(e) => setWalletPhone(e.target.value)}
                          placeholder="e.g. 0300 1234567"
                          className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 focus:outline-none focus:border-black font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-neutral-700 mb-1">
                          Transaction ID / Ref # (Optional)
                        </label>
                        <input
                          type="text"
                          value={walletTxnId}
                          onChange={(e) => setWalletTxnId(e.target.value)}
                          placeholder="e.g. SD-928410294"
                          className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 focus:outline-none focus:border-black font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Option 2: JazzCash */}
              <div
                onClick={() => setSelectedMethod('JazzCash')}
                className={`p-4 border transition-all cursor-pointer rounded-none ${
                  selectedMethod === 'JazzCash'
                    ? 'border-neutral-950 bg-neutral-50/80 ring-1 ring-neutral-950'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        selectedMethod === 'JazzCash' ? 'border-neutral-950 bg-neutral-950' : 'border-neutral-300'
                      }`}
                    >
                      {selectedMethod === 'JazzCash' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider font-bold text-neutral-900">
                          JazzCash
                        </span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-amber-100 text-amber-900 font-semibold rounded">
                          Mobile Wallet / Till
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 font-light mt-0.5">
                        Pay through JazzCash Mobile Account or QR Till code directly.
                      </p>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 bg-amber-600 text-white text-[10px] font-mono uppercase tracking-wider font-semibold">
                    JAZZ
                  </div>
                </div>

                {/* Sub-form when JazzCash is selected */}
                {selectedMethod === 'JazzCash' && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-4 pt-4 border-t border-neutral-200 space-y-3.5 text-xs"
                  >
                    <div className="bg-amber-50/80 border border-amber-200 p-3 text-amber-950 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold uppercase tracking-wider text-[10px] text-amber-900">
                          JazzCash Merchant Details
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('03019876543', 'JazzCash Account')}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 hover:underline"
                        >
                          {copiedField === 'JazzCash Account' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy No.
                            </>
                          )}
                        </button>
                      </div>
                      <div className="font-mono text-neutral-900 font-bold text-xs">
                        Account No: 0301-9876543 &bull; Till ID: 00482910 &bull; Title: VELOUR CLOTHING
                      </div>
                      <p className="text-neutral-600 text-[10px] leading-relaxed">
                        Enter your registered JazzCash mobile account number to confirm dispatch verification.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-neutral-700 mb-1">
                          Your JazzCash Mobile Number *
                        </label>
                        <input
                          type="text"
                          value={walletPhone}
                          onChange={(e) => setWalletPhone(e.target.value)}
                          placeholder="e.g. 0301 9876543"
                          className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 focus:outline-none focus:border-black font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-neutral-700 mb-1">
                          JazzCash TID (Optional)
                        </label>
                        <input
                          type="text"
                          value={walletTxnId}
                          onChange={(e) => setWalletTxnId(e.target.value)}
                          placeholder="e.g. 1092837465"
                          className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 focus:outline-none focus:border-black font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Option 3: EasyPaisa */}
              <div
                onClick={() => setSelectedMethod('EasyPaisa')}
                className={`p-4 border transition-all cursor-pointer rounded-none ${
                  selectedMethod === 'EasyPaisa'
                    ? 'border-neutral-950 bg-neutral-50/80 ring-1 ring-neutral-950'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        selectedMethod === 'EasyPaisa' ? 'border-neutral-950 bg-neutral-950' : 'border-neutral-300'
                      }`}
                    >
                      {selectedMethod === 'EasyPaisa' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider font-bold text-neutral-900">
                          EasyPaisa
                        </span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-emerald-100 text-emerald-900 font-semibold rounded">
                          Telenor Bank
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 font-light mt-0.5">
                        Fast transfer via Easypaisa Mobile App or Microfinance Account.
                      </p>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-mono uppercase tracking-wider font-semibold">
                    EASY
                  </div>
                </div>

                {/* Sub-form when EasyPaisa is selected */}
                {selectedMethod === 'EasyPaisa' && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-4 pt-4 border-t border-neutral-200 space-y-3.5 text-xs"
                  >
                    <div className="bg-emerald-50/80 border border-emerald-200 p-3 text-emerald-950 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold uppercase tracking-wider text-[10px] text-emerald-900">
                          Official EasyPaisa Account
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('03451122334', 'EasyPaisa Account')}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 hover:underline"
                        >
                          {copiedField === 'EasyPaisa Account' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy No.
                            </>
                          )}
                        </button>
                      </div>
                      <div className="font-mono text-neutral-900 font-bold text-xs">
                        Account No: 0345-1122334 &bull; Title: VELOUR FASHION PK
                      </div>
                      <p className="text-neutral-600 text-[10px] leading-relaxed">
                        Transfer the order amount to the official Easypaisa account and input your sending number below.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-neutral-700 mb-1">
                          Your EasyPaisa Mobile Number *
                        </label>
                        <input
                          type="text"
                          value={walletPhone}
                          onChange={(e) => setWalletPhone(e.target.value)}
                          placeholder="e.g. 0345 1122334"
                          className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 focus:outline-none focus:border-black font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-neutral-700 mb-1">
                          Transaction ID (TID) (Optional)
                        </label>
                        <input
                          type="text"
                          value={walletTxnId}
                          onChange={(e) => setWalletTxnId(e.target.value)}
                          placeholder="e.g. EP-8819203"
                          className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 focus:outline-none focus:border-black font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Option 4: NayaPay */}
              <div
                onClick={() => setSelectedMethod('NayaPay')}
                className={`p-4 border transition-all cursor-pointer rounded-none ${
                  selectedMethod === 'NayaPay'
                    ? 'border-neutral-950 bg-neutral-50/80 ring-1 ring-neutral-950'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        selectedMethod === 'NayaPay' ? 'border-neutral-950 bg-neutral-950' : 'border-neutral-300'
                      }`}
                    >
                      {selectedMethod === 'NayaPay' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider font-bold text-neutral-900">
                          NayaPay
                        </span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-indigo-100 text-indigo-900 font-semibold rounded">
                          NayaPay ID / Visa
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 font-light mt-0.5">
                        Instant payment via NayaPay ID (@velourfashion) or digital wallet.
                      </p>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 bg-indigo-600 text-white text-[10px] font-mono uppercase tracking-wider font-semibold">
                    NAYA
                  </div>
                </div>

                {/* Sub-form when NayaPay is selected */}
                {selectedMethod === 'NayaPay' && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-4 pt-4 border-t border-neutral-200 space-y-3.5 text-xs"
                  >
                    <div className="bg-indigo-50/80 border border-indigo-200 p-3 text-indigo-950 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold uppercase tracking-wider text-[10px] text-indigo-900">
                          Official NayaPay ID
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('@velourfashion', 'NayaPay ID')}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-800 hover:underline"
                        >
                          {copiedField === 'NayaPay ID' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy ID
                            </>
                          )}
                        </button>
                      </div>
                      <div className="font-mono text-neutral-900 font-bold text-xs">
                        NayaPay ID: @velourfashion &bull; Title: VELOUR ATELIER
                      </div>
                      <p className="text-neutral-600 text-[10px] leading-relaxed">
                        Send to @velourfashion on your NayaPay app and enter your NayaPay ID or registered phone below.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-neutral-700 mb-1">
                          Your NayaPay ID or Mobile *
                        </label>
                        <input
                          type="text"
                          value={walletPhone}
                          onChange={(e) => setWalletPhone(e.target.value)}
                          placeholder="e.g. @yourid or 0333 1234567"
                          className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 focus:outline-none focus:border-black font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-neutral-700 mb-1">
                          NayaPay Reference ID (Optional)
                        </label>
                        <input
                          type="text"
                          value={walletTxnId}
                          onChange={(e) => setWalletTxnId(e.target.value)}
                          placeholder="e.g. NP-9928172"
                          className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 focus:outline-none focus:border-black font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Option 5: Credit / Debit Card (Visa, Mastercard, PayPak) */}
              <div
                onClick={() => setSelectedMethod('Credit Card')}
                className={`p-4 border transition-all cursor-pointer rounded-none ${
                  selectedMethod === 'Credit Card'
                    ? 'border-neutral-950 bg-neutral-50/80 ring-1 ring-neutral-950'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        selectedMethod === 'Credit Card' ? 'border-neutral-950 bg-neutral-950' : 'border-neutral-300'
                      }`}
                    >
                      {selectedMethod === 'Credit Card' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider font-bold text-neutral-900">
                          Credit / Debit Card
                        </span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-neutral-200/80 text-neutral-800 font-semibold rounded">
                          Visa &bull; Mastercard &bull; UnionPay
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 font-light mt-0.5">
                        Seamless 256-bit encrypted checkout with 3D-Secure OTP verification.
                      </p>
                    </div>
                  </div>
                  <CreditCard className="w-5 h-5 text-neutral-700" />
                </div>

                {/* Sub-form when Credit Card is selected */}
                {selectedMethod === 'Credit Card' && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-4 pt-4 border-t border-neutral-200 space-y-3.5 text-xs"
                  >
                    <div className="p-3.5 bg-neutral-100/70 border border-neutral-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-neutral-900">
                          <Lock className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Official Stripe Checkout Gateway</span>
                        </div>
                        <span
                          className={`text-[9px] uppercase font-mono px-2 py-0.5 font-semibold rounded ${
                            gatewayConfig?.isConfigured
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {gatewayConfig?.isConfigured ? 'Gateway Active' : 'Setup Required'}
                        </span>
                      </div>

                      {gatewayConfig?.isConfigured ? (
                        <p className="text-[11px] text-neutral-600 leading-relaxed">
                          Your transaction will be processed via Stripe&apos;s PCI-DSS Level 1 compliant hosted checkout.
                          Card authentication occurs securely with bank 3D-Secure OTP. No card data ever touches our web servers.
                        </p>
                      ) : (
                        <div className="space-y-1 text-[11px] text-neutral-700">
                          <p className="font-semibold text-neutral-900">
                            Production Gateway Credentials Needed:
                          </p>
                          <p className="text-neutral-600">
                            Real payment processing requires your <code className="bg-neutral-200 px-1 py-0.5 rounded font-mono text-[10px]">STRIPE_SECRET_KEY</code> in environment variables. Simulated or fake transactions are strictly prohibited.
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-neutral-200 text-[10px] text-neutral-500 font-mono">
                        <span>&bull; Visa</span>
                        <span>&bull; Mastercard</span>
                        <span>&bull; American Express</span>
                        <span>&bull; Apple Pay / Google Pay</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Option 6: Direct Bank Wire / IBAN Transfer */}
              <div
                onClick={() => setSelectedMethod('Bank Transfer')}
                className={`p-4 border transition-all cursor-pointer rounded-none ${
                  selectedMethod === 'Bank Transfer'
                    ? 'border-neutral-950 bg-neutral-50/80 ring-1 ring-neutral-950'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        selectedMethod === 'Bank Transfer' ? 'border-neutral-950 bg-neutral-950' : 'border-neutral-300'
                      }`}
                    >
                      {selectedMethod === 'Bank Transfer' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider font-bold text-neutral-900">
                          Direct Bank Wire (IBAN)
                        </span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-neutral-200/80 text-neutral-800 font-semibold rounded">
                          HBL &bull; Meezan &bull; Standard Chartered
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 font-light mt-0.5">
                        Interbank transfer from any banking application using direct 24-digit IBAN.
                      </p>
                    </div>
                  </div>
                  <Building2 className="w-5 h-5 text-neutral-700" />
                </div>

                {/* Sub-form when Bank Transfer is selected */}
                {selectedMethod === 'Bank Transfer' && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-4 pt-4 border-t border-neutral-200 space-y-3.5 text-xs"
                  >
                    <div className="bg-neutral-100 p-3 border border-neutral-200 text-neutral-800 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold uppercase tracking-wider text-[10px] text-neutral-900">
                          Corporate Bank Account
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('PK36MEZN0001092837465012', 'Meezan IBAN')}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-neutral-900 hover:underline"
                        >
                          {copiedField === 'Meezan IBAN' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy IBAN
                            </>
                          )}
                        </button>
                      </div>
                      <div className="font-mono text-neutral-900 font-bold text-xs">
                        Bank: Meezan Bank Ltd &bull; Title: VELOUR FASHION INT
                      </div>
                      <div className="font-mono text-neutral-700 text-[11px]">
                        IBAN: PK36 MEZN 0001 0928 3746 5012
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-neutral-700 mb-1">
                        Deposit / Transaction Reference Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={bankTxnRef}
                        onChange={(e) => setBankTxnRef(e.target.value)}
                        placeholder="e.g. FT26092281902"
                        className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 focus:outline-none focus:border-black font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Option 7: Cash on Delivery (COD) */}
              <div
                onClick={() => setSelectedMethod('Cash on Delivery')}
                className={`p-4 border transition-all cursor-pointer rounded-none ${
                  selectedMethod === 'Cash on Delivery'
                    ? 'border-neutral-950 bg-neutral-50/80 ring-1 ring-neutral-950'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        selectedMethod === 'Cash on Delivery' ? 'border-neutral-950 bg-neutral-950' : 'border-neutral-300'
                      }`}
                    >
                      {selectedMethod === 'Cash on Delivery' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-widest font-bold text-neutral-900">
                          Cash on Delivery (COD)
                        </span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-neutral-200/80 text-neutral-800 font-semibold rounded">
                          Pay at Door
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-600 font-light mt-0.5">
                        Pay securely in cash directly to our contracted courier partner upon doorstep arrival.
                      </p>
                    </div>
                  </div>
                  <Banknote className="w-5 h-5 text-neutral-700" />
                </div>

                {selectedMethod === 'Cash on Delivery' && (
                  <div className="mt-3 pt-3 border-t border-neutral-200 text-[11px] text-neutral-500 font-light leading-relaxed">
                    You may inspect the package and garments with our courier prior to payment. Zero advance fee &bull; Insured transit.
                  </div>
                )}
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
                <span className="font-serif text-lg">
                  {selectedMethod === 'Cash on Delivery' ? 'Total Due at Door' : 'Total Amount'}
                </span>
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
                  <span>
                    {selectedMethod === 'Credit Card'
                      ? 'Connecting to Stripe Gateway...'
                      : 'Authorizing Order...'}
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {selectedMethod === 'Credit Card'
                      ? `Proceed to Stripe Checkout \u2022 $${total}`
                      : `Confirm Order with ${selectedMethod} \u2022 $${total}`}
                  </span>
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
