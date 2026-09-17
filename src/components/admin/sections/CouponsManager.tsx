import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  X,
  Search,
  CheckCircle2,
  Percent,
  DollarSign,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Coupon } from '../../../types.ts';

interface CouponsManagerProps {
  coupons: Coupon[];
  onRefresh: () => void;
  onCreateCoupon: (data: any) => Promise<boolean>;
  onUpdateCoupon: (id: string, updates: any) => Promise<boolean>;
  onDeleteCoupon: (id: string) => Promise<boolean>;
}

export function CouponsManager({
  coupons,
  onRefresh,
  onCreateCoupon,
  onUpdateCoupon,
  onDeleteCoupon
}: CouponsManagerProps) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 15,
    minOrderValue: 100,
    maxDiscount: 50,
    usageLimit: 100,
    validUntil: '2026-12-31',
    isActive: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (editingCoupon) {
      setFormData({
        code: editingCoupon.code,
        discountType: editingCoupon.discountType,
        discountValue: editingCoupon.discountValue,
        minOrderValue: editingCoupon.minOrderValue || 0,
        maxDiscount: editingCoupon.maxDiscount || 0,
        usageLimit: editingCoupon.usageLimit || 100,
        validUntil: editingCoupon.validUntil ? editingCoupon.validUntil.split('T')[0] : '2026-12-31',
        isActive: editingCoupon.isActive !== undefined ? editingCoupon.isActive : true
      });
    } else {
      setFormData({
        code: '',
        discountType: 'percentage',
        discountValue: 15,
        minOrderValue: 150,
        maxDiscount: 50,
        usageLimit: 200,
        validUntil: '2026-12-31',
        isActive: true
      });
    }
  }, [editingCoupon]);

  const filtered = coupons.filter((c) => {
    if (!search.trim()) return true;
    return c.code.toLowerCase().includes(search.toLowerCase());
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrderValue: Number(formData.minOrderValue),
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
        validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : undefined,
        isActive: formData.isActive
      };

      let ok = false;
      if (editingCoupon) {
        ok = await onUpdateCoupon(editingCoupon.id, payload);
      } else {
        ok = await onCreateCoupon(payload);
      }

      if (ok) {
        setIsModalOpen(false);
        setEditingCoupon(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-light text-neutral-900">Promotions, Vouchers & Codes</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configure percentage discounts, threshold incentives, and private atelier promo keys
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCoupon(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-medium uppercase tracking-wider transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create Promo Code</span>
        </button>
      </div>

      {/* 2. Search */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search active promotional codes..."
            className="w-full pl-10 pr-3 py-2 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
        </div>
      </div>

      {/* 3. Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((cp) => {
          const isExpired = cp.validUntil && new Date(cp.validUntil) < new Date();
          const usagePercent =
            cp.usageLimit && cp.usageLimit > 0
              ? Math.min(100, Math.round(((cp.usedCount || 0) / cp.usageLimit) * 100))
              : 0;

          return (
            <div
              key={cp.id}
              className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm flex flex-col justify-between hover:border-neutral-300 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-neutral-100 rounded-xl text-neutral-800">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-mono text-base font-bold tracking-wider text-neutral-900">
                        {cp.code}
                      </span>
                      <p className="text-[10px] text-neutral-400 font-mono">ID: {cp.id}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      !cp.isActive
                        ? 'bg-neutral-100 text-neutral-500'
                        : isExpired
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {!cp.isActive ? 'Inactive' : isExpired ? 'Expired' : 'Live & Active'}
                  </span>
                </div>

                <div className="my-5 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                  <div className="flex items-baseline gap-1 text-2xl font-serif text-neutral-900">
                    <span>
                      {cp.discountType === 'percentage'
                        ? `${cp.discountValue}% OFF`
                        : `$${cp.discountValue} OFF`}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Minimum Cart Spend: <span className="font-semibold text-neutral-800">${cp.minOrderValue || 0}</span>
                  </p>
                </div>

                {/* Limits & Usage */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-neutral-500">
                    <span>Usage Count:</span>
                    <span className="font-mono font-semibold text-neutral-800">
                      {cp.usedCount || 0} / {cp.usageLimit || '&infin;'}
                    </span>
                  </div>
                  {cp.usageLimit && cp.usageLimit > 0 && (
                    <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${usagePercent}%` }}
                        className="bg-neutral-900 h-full rounded-full"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-neutral-500 pt-1 text-[11px]">
                    <span>Valid Until:</span>
                    <span className="font-mono text-neutral-700">
                      {cp.validUntil ? new Date(cp.validUntil).toLocaleDateString() : 'Perpetual'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between">
                <button
                  onClick={() => onUpdateCoupon(cp.id, { isActive: !cp.isActive })}
                  className="text-xs text-neutral-600 hover:text-black font-medium hover:underline"
                >
                  {cp.isActive ? 'Disable Code' : 'Enable Code'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingCoupon(cp);
                      setIsModalOpen(true);
                    }}
                    title="Edit Promo"
                    className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete promo code "${cp.code}"?`)) {
                        onDeleteCoupon(cp.id);
                      }
                    }}
                    title="Delete Promo"
                    className="p-1.5 text-neutral-600 hover:text-rose-600 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <h3 className="font-serif text-lg text-neutral-900">
                {editingCoupon ? 'Edit Promo Code' : 'Create New Promo Code'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Voucher Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. ATELIER20"
                  className="w-full px-3 py-2 text-xs font-mono font-bold tracking-wider border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Discount Type
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Dollar ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Min Order Spend ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Usage Cap Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-700 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-medium uppercase tracking-wider"
                >
                  {isSubmitting ? 'Saving...' : editingCoupon ? 'Save Changes' : 'Activate Promo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
