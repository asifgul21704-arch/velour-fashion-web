import React, { useState } from 'react';
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  X,
  Search,
  Check,
  ExternalLink,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { Category, Gender, Product } from '../../../types.ts';

interface CategoriesManagerProps {
  categories: Category[];
  products: Product[];
  onRefresh: () => void;
  onCreateCategory: (data: any) => Promise<boolean>;
  onUpdateCategory: (id: string, updates: any) => Promise<boolean>;
  onDeleteCategory: (id: string) => Promise<boolean>;
  onToggleCategory: (id: string) => Promise<boolean>;
}

export function CategoriesManager({
  categories,
  products,
  onRefresh,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onToggleCategory
}: CategoriesManagerProps) {
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=85',
    gender: 'women' as Gender,
    description: '',
    order: 1,
    isActive: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        slug: editingCategory.slug,
        image: editingCategory.image,
        gender: editingCategory.gender,
        description: editingCategory.description || '',
        order: editingCategory.order || 1,
        isActive: editingCategory.isActive !== undefined ? editingCategory.isActive : true
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=85',
        gender: 'women',
        description: '',
        order: categories.length + 1,
        isActive: true
      });
    }
  }, [editingCategory, categories.length]);

  const filtered = categories.filter((c) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const match = c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (genderFilter !== 'all' && c.gender !== genderFilter) return false;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.image.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || undefined,
        image: formData.image.trim(),
        gender: formData.gender,
        description: formData.description.trim(),
        order: Number(formData.order),
        isActive: formData.isActive
      };

      let ok = false;
      if (editingCategory) {
        ok = await onUpdateCategory(editingCategory.id, payload);
      } else {
        ok = await onCreateCategory(payload);
      }

      if (ok) {
        setIsModalOpen(false);
        setEditingCategory(null);
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
          <h2 className="font-serif text-2xl font-light text-neutral-900">Categories & Taxonomies</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Organize catalog structures, landing displays, and editorial collections
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCategory(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-medium uppercase tracking-wider transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* 2. Filters */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search category title or slug..."
            className="w-full pl-10 pr-3 py-2 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
        </div>

        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 sm:w-48"
        >
          <option value="all">All Departments</option>
          <option value="women">Women Only</option>
          <option value="men">Men Only</option>
          <option value="unisex">Unisex Only</option>
        </select>
      </div>

      {/* 3. Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((cat) => {
          const productCount = products.filter(
            (p) => p.category.toLowerCase() === cat.name.toLowerCase()
          ).length;

          return (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm hover:border-neutral-300 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Image Cover */}
                <div className="relative h-44 w-full bg-neutral-100 overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        cat.isActive !== false
                          ? 'bg-emerald-500 text-white'
                          : 'bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      {cat.isActive !== false ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300">
                      {cat.gender}
                    </span>
                    <h4 className="font-serif text-xl font-light">{cat.name}</h4>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-neutral-500 font-mono text-[11px]">
                    <span>Slug: /{cat.slug}</span>
                    <span>Order: #{cat.order || 0}</span>
                  </div>

                  <p className="text-neutral-600 line-clamp-2 text-[11px]">
                    {cat.description || 'Curated luxury collection for the discerning atelier client.'}
                  </p>

                  <div className="pt-2 flex items-center justify-between font-mono text-neutral-700">
                    <span>Products Indexed:</span>
                    <span className="font-bold bg-neutral-100 px-2 py-0.5 rounded text-[11px]">
                      {productCount} SKUs
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-3 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => onToggleCategory(cat.id)}
                  className="text-neutral-600 hover:text-black font-medium hover:underline text-[11px]"
                >
                  {cat.isActive !== false ? 'Deactivate' : 'Publish Live'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingCategory(cat);
                      setIsModalOpen(true);
                    }}
                    title="Edit Category"
                    className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-200 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete category "${cat.name}"?`)) {
                        onDeleteCategory(cat.id);
                      }
                    }}
                    title="Delete Category"
                    className="p-1.5 text-neutral-600 hover:text-rose-600 hover:bg-neutral-200 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <h3 className="font-serif text-lg text-neutral-900">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Silk Loungewear"
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Department *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  >
                    <option value="women">Women</option>
                    <option value="men">Men</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Cover Image URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Editorial notes and category theme..."
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
                  {isSubmitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
