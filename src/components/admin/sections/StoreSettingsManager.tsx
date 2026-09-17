import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  AlertTriangle,
  Store,
  DollarSign,
  Truck,
  Shield,
  Bell
} from 'lucide-react';
import { StoreSettings } from '../../../types.ts';
import { apiFetch } from '../../../lib/api.ts';

export function StoreSettingsManager() {
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'VELOUR Atelier',
    tagline: 'Architectural Minimalist Luxury & Haute Couture',
    contactEmail: 'atelier@velour-fashion.com',
    contactPhone: '+1 (800) 482-9382',
    currency: 'USD',
    currencySymbol: '$',
    freeShippingThreshold: 300,
    flatShippingRate: 25,
    taxRate: 8.5,
    announcementText: 'Complimentary white-glove atelier shipping on bespoke orders above $300',
    announcementActive: true,
    maintenanceMode: false
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/settings');
      if (res.ok) {
        const d = await res.json();
        setSettings(d.settings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-light text-neutral-900">Store Configuration & Policy</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage commercial thresholds, shipping policies, announcement banners, and brand identity
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-medium uppercase tracking-wider transition-colors shadow-sm"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Persisting Changes...' : 'Save Configuration'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Store configurations updated and persisted immediately to MongoDB.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Brand & Contact */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
            <Store className="w-4 h-4 text-neutral-700" />
            <h3 className="font-serif text-lg text-neutral-900">Brand Identity & Concierge Contact</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Storefront Name *
              </label>
              <input
                type="text"
                required
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Brand Tagline
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Concierge Contact Email *
              </label>
              <input
                type="email"
                required
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Concierge Telephone
              </label>
              <input
                type="text"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Commercial & Shipping Rates */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
            <Truck className="w-4 h-4 text-neutral-700" />
            <h3 className="font-serif text-lg text-neutral-900">Commercial Rates & Shipping Rules</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Standard Shipping Fee ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.flatShippingRate}
                onChange={(e) => setSettings({ ...settings, flatShippingRate: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Free Shipping Threshold ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.freeShippingThreshold}
                onChange={(e) => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Sales Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={settings.taxRate}
                onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Global Announcement & Maintenance */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
            <Bell className="w-4 h-4 text-neutral-700" />
            <h3 className="font-serif text-lg text-neutral-900">Storefront Notice & Maintenance Mode</h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Top Announcement Bar Message
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.announcementActive}
                    onChange={(e) => setSettings({ ...settings, announcementActive: e.target.checked })}
                    className="rounded border-neutral-300 text-neutral-900 focus:ring-0"
                  />
                  <span>Active on Storefront</span>
                </label>
              </div>
              <input
                type="text"
                value={settings.announcementText}
                onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                  Maintenance Lock
                </p>
                <p className="text-[11px] text-neutral-500">
                  When enabled, storefront visitors see a private atelier preparation notice
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  settings.maintenanceMode
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                {settings.maintenanceMode ? 'Maintenance Enabled' : 'Storefront Live'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
