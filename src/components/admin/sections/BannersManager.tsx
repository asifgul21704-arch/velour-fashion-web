import React, { useState } from 'react';
import {
  Image,
  Plus,
  Edit,
  Trash2,
  X,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { Banner } from '../../../types.ts';

interface BannersManagerProps {
  banners: Banner[];
  onRefresh: () => void;
  onCreateBanner: (data: any) => Promise<boolean>;
  onUpdateBanner: (id: string, updates: any) => Promise<boolean>;
  onDeleteBanner: (id: string) => Promise<boolean>;
}

export function BannersManager({
  banners,
  onRefresh,
  onCreateBanner,
  onUpdateBanner,
  onDeleteBanner
}: BannersManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=85',
    link: '/collection/women',
    ctaText: 'Explore Collection',
    isActive: true,
    order: 1
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (editingBanner) {
      setFormData({
        title: editingBanner.title,
        subtitle: editingBanner.subtitle || '',
        image: editingBanner.image,
        link: editingBanner.link || '/collection/women',
        ctaText: editingBanner.ctaText || 'Discover Now',
        isActive: editingBanner.isActive !== undefined ? editingBanner.isActive : true,
        order: editingBanner.order || 1
      });
    } else {
      setFormData({
        title: 'Autumn / Winter Capsule',
        subtitle: 'Sculptural drapery & monolithic tailoring',
        image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=85',
        link: '/collection/women',
        ctaText: 'Explore Collection',
        isActive: true,
        order: banners.length + 1
      });
    }
  }, [editingBanner, banners.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.image.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        image: formData.image.trim(),
        link: formData.link.trim(),
        ctaText: formData.ctaText.trim(),
        isActive: formData.isActive,
        order: Number(formData.order)
      };

      let ok = false;
      if (editingBanner) {
        ok = await onUpdateBanner(editingBanner.id, payload);
      } else {
        ok = await onCreateBanner(payload);
      }

      if (ok) {
        setIsModalOpen(false);
        setEditingBanner(null);
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
          <h2 className="font-serif text-2xl font-light text-neutral-900">Hero & Promotional Banners</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Curate homepage banners, promotional carousel hero slides, and seasonal editorial announcements
          </p>
        </div>

        <button
          onClick={() => {
            setEditingBanner(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-medium uppercase tracking-wider transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Banner Slide</span>
        </button>
      </div>

      {/* 2. Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.length === 0 ? (
          <div className="col-span-2 bg-white p-12 rounded-2xl border border-neutral-200 text-center text-xs text-neutral-400">
            No promotional banners active. Create your first banner to feature it on the storefront homepage.
          </div>
        ) : (
          banners.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm hover:border-neutral-300 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Visual Banner Preview */}
                <div className="relative h-48 w-full bg-neutral-900 overflow-hidden">
                  <img
                    src={b.image}
                    alt={b.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        b.isActive ? 'bg-emerald-500 text-white' : 'bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      {b.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="text-[10px] uppercase font-mono tracking-widest text-amber-300">
                      Slide #{b.order || 1}
                    </p>
                    <h3 className="font-serif text-xl font-light text-white mt-0.5">{b.title}</h3>
                    {b.subtitle && (
                      <p className="text-xs text-neutral-300 line-clamp-1 mt-0.5">{b.subtitle}</p>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-neutral-500 font-mono text-[11px]">
                    <span>Target: {b.link}</span>
                    <span>CTA: &ldquo;{b.ctaText}&rdquo;</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => onUpdateBanner(b.id, { isActive: !b.isActive })}
                  className="text-neutral-600 hover:text-black font-medium hover:underline text-[11px]"
                >
                  {b.isActive ? 'Deactivate' : 'Publish Live'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingBanner(b);
                      setIsModalOpen(true);
                    }}
                    title="Edit Banner"
                    className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-200 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete banner "${b.title}"?`)) {
                        onDeleteBanner(b.id);
                      }
                    }}
                    title="Delete Banner"
                    className="p-1.5 text-neutral-600 hover:text-rose-600 hover:bg-neutral-200 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <h3 className="font-serif text-lg text-neutral-900">
                {editingBanner ? 'Edit Banner Slide' : 'Create Banner Slide'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Banner Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Winter Outerwear Capsule"
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g. Handcrafted tailoring in virgin cashmere"
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Image URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Button CTA Text
                  </label>
                  <input
                    type="text"
                    value={formData.ctaText}
                    onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Destination Link
                  </label>
                  <input
                    type="text"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  />
                </div>
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
                  {isSubmitting ? 'Saving...' : editingBanner ? 'Save Changes' : 'Publish Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
