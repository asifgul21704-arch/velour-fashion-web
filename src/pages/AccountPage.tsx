import React, { useState, useEffect } from 'react';
import { User, Package, Heart, Shield, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';

interface AccountPageProps {
  onNavigate: (path: string) => void;
}

export function AccountPage({ onNavigate }: AccountPageProps) {
  const { user, isAuthenticated, isAdmin, updateProfile, logout, loading } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'United States'
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      onNavigate('/login');
    }
  }, [loading, isAuthenticated, onNavigate]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        postalCode: user.postalCode || '',
        country: user.country || 'United States'
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await updateProfile(formData);
    setIsSaving(false);
    if (res.success) {
      showToast('Profile credentials updated successfully', 'success');
    } else {
      showToast(res.error || 'Failed to update profile', 'error');
    }
  };

  if (loading || !user) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-black border-t-transparent mb-3" />
        <p className="text-xs uppercase tracking-widest text-neutral-500">Loading Client Profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="mb-10">
        <span className="text-xs uppercase tracking-[0.25em] text-neutral-400 font-semibold block mb-1">
          Atelier Client Portal
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-neutral-900 font-light">
          Welcome, {user.name}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Sidebar Navigation (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-neutral-200 p-6 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
              <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-700 font-serif text-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-neutral-900 truncate">{user.name}</p>
                <p className="text-xs text-neutral-400 truncate">{user.email}</p>
                {isAdmin && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-black text-white text-[10px] tracking-widest uppercase font-semibold">
                    Administrator
                  </span>
                )}
              </div>
            </div>

            <nav className="space-y-1 text-xs uppercase tracking-wider font-medium text-neutral-700">
              <button
                onClick={() => onNavigate('/account')}
                className="w-full text-left px-3 py-2.5 bg-neutral-100 text-black flex items-center gap-2.5 font-semibold"
              >
                <User className="w-4 h-4" />
                <span>Profile & Addresses</span>
              </button>

              <button
                onClick={() => onNavigate('/account/orders')}
                className="w-full text-left px-3 py-2.5 hover:bg-neutral-50 flex items-center gap-2.5 transition-colors"
              >
                <Package className="w-4 h-4" />
                <span>Order History</span>
              </button>

              <button
                onClick={() => onNavigate('/wishlist')}
                className="w-full text-left px-3 py-2.5 hover:bg-neutral-50 flex items-center gap-2.5 transition-colors"
              >
                <Heart className="w-4 h-4" />
                <span>Saved Wishlist</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => onNavigate('/admin')}
                  className="w-full text-left px-3 py-2.5 bg-neutral-900 text-white flex items-center gap-2.5 hover:bg-black transition-colors"
                >
                  <Shield className="w-4 h-4 text-white" />
                  <span>Admin Management</span>
                </button>
              )}

              <button
                onClick={() => {
                  logout();
                  onNavigate('/');
                }}
                className="w-full text-left px-3 py-2.5 text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 transition-colors pt-3 border-t border-neutral-100"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Right Content: Profile Form (8 cols) */}
        <div className="lg:col-span-8">
          <div className="bg-white border border-neutral-200 p-6 sm:p-10 space-y-6">
            <div className="border-b border-neutral-100 pb-4">
              <h2 className="font-serif text-2xl text-neutral-900 font-normal">
                Personal Information & Delivery Defaults
              </h2>
              <p className="text-xs text-neutral-500 font-light mt-1">
                These credentials will automatically prefill during checkout for an effortless purchasing flow.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-700 font-semibold mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 text-xs bg-neutral-50 border border-neutral-200 focus:bg-white focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-700 font-semibold mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-4 py-3 text-xs bg-neutral-100 border border-neutral-200 text-neutral-500 cursor-not-allowed"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase tracking-wider text-neutral-700 font-semibold mb-1.5">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-3 text-xs bg-neutral-50 border border-neutral-200 focus:bg-white focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase tracking-wider text-neutral-700 font-semibold mb-1.5">
                    Default Street Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Suite, Street Address"
                    className="w-full px-4 py-3 text-xs bg-neutral-50 border border-neutral-200 focus:bg-white focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-700 font-semibold mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="New York"
                    className="w-full px-4 py-3 text-xs bg-neutral-50 border border-neutral-200 focus:bg-white focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-700 font-semibold mb-1.5">
                    Postal / ZIP Code
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="10001"
                    className="w-full px-4 py-3 text-xs bg-neutral-50 border border-neutral-200 focus:bg-white focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase tracking-wider text-neutral-700 font-semibold mb-1.5">
                    Country
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

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-3.5 bg-black text-white text-xs uppercase tracking-[0.2em] font-semibold hover:bg-neutral-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
