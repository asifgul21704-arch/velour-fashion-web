import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, Globe } from 'lucide-react';
import { useToast } from '../context/ToastContext.tsx';
import { apiFetch } from '../lib/api.ts';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { showToast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setIsSubscribed(true);
        setEmail('');
        showToast(data.message || 'Subscribed successfully', 'success');
      } else {
        showToast(data.error || 'Failed to subscribe', 'error');
      }
    } catch (e) {
      showToast('Network error while subscribing', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#121212] text-neutral-300 pt-20 pb-12 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-16 border-b border-neutral-800">
          
          {/* Col 1 & 2: Brand & Newsletter */}
          <div className="lg:col-span-2 space-y-6">
            <span className="font-serif text-3xl tracking-[0.25em] uppercase text-white block">
              VELOUR
            </span>
            <p className="text-sm text-neutral-400 max-w-md leading-relaxed font-light">
              Crafting contemporary silhouettes and heirloom textiles. Dedicated to architectural tailoring, ethical sourcing, and quiet luxury.
            </p>

            <div className="pt-2">
              <span className="text-xs uppercase tracking-[0.2em] text-white block mb-3 font-medium">
                The Velour Dispatch
              </span>
              <p className="text-xs text-neutral-400 mb-4 font-light">
                Receive private access to seasonal editorial releases, atelier previews, and exclusive invitations.
              </p>

              {isSubscribed ? (
                <div className="flex items-center gap-2 text-emerald-400 text-xs tracking-wider uppercase py-2 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Your subscription has been registered.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex max-w-md">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1 bg-neutral-900 border border-neutral-700 px-4 py-3 text-xs tracking-wider text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-white text-black px-6 py-3 text-xs uppercase tracking-widest font-semibold hover:bg-neutral-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <span>{isSubmitting ? 'Joining...' : 'Subscribe'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Col 3: Collections */}
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-[0.25em] text-white font-medium block">
              Wardrobe
            </span>
            <ul className="space-y-3 text-xs tracking-wider uppercase text-neutral-400">
              <li>
                <button onClick={() => onNavigate('/women')} className="hover:text-white transition-colors">
                  Women&apos;s Collection
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/men')} className="hover:text-white transition-colors">
                  Men&apos;s Collection
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/women?category=dresses')} className="hover:text-white transition-colors">
                  Atelier Eveningwear
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/men?category=jackets')} className="hover:text-white transition-colors">
                  Tailoring & Coats
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Client Services */}
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-[0.25em] text-white font-medium block">
              Client Care
            </span>
            <ul className="space-y-3 text-xs tracking-wider uppercase text-neutral-400">
              <li>
                <button onClick={() => onNavigate('/account/orders')} className="hover:text-white transition-colors">
                  Order Tracking
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/contact')} className="hover:text-white transition-colors">
                  Concierge & Inquiries
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/terms')} className="hover:text-white transition-colors">
                  Complimentary Returns
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/about')} className="hover:text-white transition-colors">
                  Artisanship & Materials
                </button>
              </li>
            </ul>
          </div>

          {/* Col 5: Legal & Administrative */}
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-[0.25em] text-white font-medium block">
              Legal & Trust
            </span>
            <ul className="space-y-3 text-xs tracking-wider uppercase text-neutral-400">
              <li>
                <button onClick={() => onNavigate('/privacy')} className="hover:text-white transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/terms')} className="hover:text-white transition-colors">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/admin/login')} className="hover:text-white transition-colors flex items-center gap-1.5 text-neutral-500 hover:text-neutral-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Access</span>
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 font-light">
          <p>&copy; {new Date().getFullYear()} VELOUR Fashion International Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-neutral-400">
              <Globe className="w-3.5 h-3.5" />
              <span>United States &bull; USD ($)</span>
            </span>
            <span className="text-[11px] uppercase tracking-widest text-neutral-500">
              Cash on Delivery Available
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
