import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Copy,
  Check,
  X,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { Product, Gender } from '../../../types.ts';

interface ProductsManagerProps {
  products: Product[];
  onRefresh: () => void;
  onCreateProduct: (productData: any) => Promise<boolean>;
  onUpdateProduct: (id: string, updates: any) => Promise<boolean>;
  onDeleteProduct: (id: string) => Promise<boolean>;
  onDuplicateProduct: (id: string) => Promise<boolean>;
  onBulkAction: (ids: string[], action: 'activate' | 'deactivate' | 'delete') => Promise<boolean>;
  isModalOpen: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
  editingProduct: Product | null;
  setEditingProduct: (p: Product | null) => void;
}

export function ProductsManager({
  products,
  onRefresh,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onDuplicateProduct,
  onBulkAction,
  isModalOpen,
  onOpenModal,
  onCloseModal,
  editingProduct,
  setEditingProduct
}: ProductsManagerProps) {
  // Filter states
  const [search, setSearch] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    brand: 'VELOUR Atelier',
    gender: 'women' as Gender,
    category: 'Dresses',
    subCategory: '',
    price: 320,
    salePrice: '',
    description: '',
    shortDescription: '',
    stock: 15,
    lowStockThreshold: 5,
    sizes: 'XS, S, M, L',
    colors: 'Black, Champagne',
    images: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=85',
    featured: false,
    newArrival: true,
    isActive: true,
    tags: 'Autumn, Silk, Atelier'
  });

  const [formSubmitting, setFormSubmitting] = useState(false);

  // Sync form data when editing product changes
  React.useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        slug: editingProduct.slug,
        brand: editingProduct.brand || 'VELOUR Atelier',
        gender: editingProduct.gender,
        category: editingProduct.category,
        subCategory: editingProduct.subCategory || '',
        price: editingProduct.price,
        salePrice: editingProduct.salePrice ? String(editingProduct.salePrice) : '',
        description: editingProduct.description || '',
        shortDescription: editingProduct.shortDescription || '',
        stock: editingProduct.stock,
        lowStockThreshold: editingProduct.lowStockThreshold || 5,
        sizes: editingProduct.sizes?.join(', ') || 'S, M, L',
        colors: editingProduct.colors?.join(', ') || 'Black',
        images: editingProduct.images?.join('\n') || '',
        featured: Boolean(editingProduct.featured),
        newArrival: Boolean(editingProduct.newArrival),
        isActive: editingProduct.isActive !== undefined ? editingProduct.isActive : true,
        tags: editingProduct.tags?.join(', ') || ''
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        brand: 'VELOUR Atelier',
        gender: 'women',
        category: 'Dresses',
        subCategory: '',
        price: 350,
        salePrice: '',
        description: '',
        shortDescription: '',
        stock: 20,
        lowStockThreshold: 5,
        sizes: 'XS, S, M, L',
        colors: 'Black, Ivory',
        images: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=85',
        featured: false,
        newArrival: true,
        isActive: true,
        tags: 'Atelier, Minimalist'
      });
    }
  }, [editingProduct]);

  // Categories set
  const categoriesList = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  // Filtered products
  const filteredProducts = products.filter((p) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedGender !== 'all' && p.gender !== selectedGender) return false;
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (stockFilter === 'out' && p.stock > 0) return false;
    if (stockFilter === 'low' && (p.stock <= 0 || p.stock > (p.lowStockThreshold || 5))) return false;
    if (stockFilter === 'in' && p.stock <= (p.lowStockThreshold || 5)) return false;
    return true;
  });

  const handleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) return;

    setFormSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || undefined,
        brand: formData.brand.trim(),
        gender: formData.gender,
        category: formData.category,
        subCategory: formData.subCategory.trim(),
        price: Number(formData.price),
        salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
        description: formData.description.trim(),
        shortDescription: formData.shortDescription.trim(),
        stock: Number(formData.stock),
        lowStockThreshold: Number(formData.lowStockThreshold),
        sizes: formData.sizes.split(',').map((s) => s.trim()).filter(Boolean),
        colors: formData.colors.split(',').map((c) => c.trim()).filter(Boolean),
        images: formData.images.split('\n').map((url) => url.trim()).filter(Boolean),
        featured: formData.featured,
        newArrival: formData.newArrival,
        isActive: formData.isActive,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
      };

      let success = false;
      if (editingProduct) {
        success = await onUpdateProduct(editingProduct.id, payload);
      } else {
        success = await onCreateProduct(payload);
      }

      if (success) {
        onCloseModal();
        setEditingProduct(null);
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleExecuteBulk = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedIds.length === 0) return;
    if (action === 'delete' && !window.confirm(`Are you sure you want to permanently delete ${selectedIds.length} products?`)) {
      return;
    }

    setIsBulkLoading(true);
    try {
      const ok = await onBulkAction(selectedIds, action);
      if (ok) setSelectedIds([]);
    } finally {
      setIsBulkLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <h2 className="font-serif text-2xl font-light text-neutral-900">Product Catalog Management</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Create, edit, duplicate and monitor inventory across all luxury collections
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingProduct(null);
              onOpenModal();
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-medium uppercase tracking-wider transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search query */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, SKU, category..."
              className="w-full pl-10 pr-3 py-2 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          {/* Gender */}
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          >
            <option value="all">All Genders (Women & Men)</option>
            <option value="women">Women's Collection</option>
            <option value="men">Men's Collection</option>
            <option value="unisex">Unisex Assortment</option>
          </select>

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          >
            <option value="all">All Categories</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          >
            <option value="all">All Inventory Levels</option>
            <option value="in">Healthy Stock (&gt; 5)</option>
            <option value="low">Low Stock Alerts (&le; 5)</option>
            <option value="out">Out of Stock (0 units)</option>
          </select>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-neutral-900 text-white rounded-xl text-xs animate-in fade-in">
            <span className="font-mono">
              <span className="font-bold text-amber-400">{selectedIds.length}</span> pieces selected
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExecuteBulk('activate')}
                disabled={isBulkLoading}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium"
              >
                Publish All
              </button>
              <button
                onClick={() => handleExecuteBulk('deactivate')}
                disabled={isBulkLoading}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium"
              >
                Disable All
              </button>
              <button
                onClick={() => handleExecuteBulk('delete')}
                disabled={isBulkLoading}
                className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-xs font-medium flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Products Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 font-mono uppercase text-[10px] tracking-wider border-b border-neutral-100">
              <tr>
                <th className="px-4 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredProducts.length > 0 && selectedIds.length === filteredProducts.length}
                    onChange={handleSelectAll}
                    className="rounded border-neutral-300 text-neutral-900 focus:ring-0"
                  />
                </th>
                <th className="px-4 py-3">Piece & SKU</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock Level</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                    No products found matching your current atelier filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  const isLow = p.stock <= (p.lowStockThreshold || 5) && p.stock > 0;
                  const isOut = p.stock <= 0;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-neutral-50/70 transition-colors ${
                        isSelected ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(p.id)}
                          className="rounded border-neutral-300 text-neutral-900 focus:ring-0"
                        />
                      </td>

                      {/* Product details */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images?.[0] || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100'}
                            alt=""
                            className="w-10 h-12 object-cover rounded-lg bg-neutral-100 shrink-0"
                          />
                          <div className="min-w-0 max-w-xs">
                            <p className="font-medium text-neutral-900 truncate">{p.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[10px] text-neutral-400">SKU: {p.sku}</span>
                              {p.featured && (
                                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-semibold uppercase rounded">
                                  Featured
                                </span>
                              )}
                              {p.newArrival && (
                                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-semibold uppercase rounded">
                                  New
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department / Category */}
                      <td className="px-4 py-3">
                        <span className="capitalize font-medium text-neutral-800">{p.gender}</span>
                        <p className="text-neutral-400 text-[10px]">{p.category}</p>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 font-mono">
                        {p.salePrice ? (
                          <div>
                            <span className="text-neutral-900 font-bold">${p.salePrice}</span>
                            <span className="line-through text-neutral-400 text-[10px] ml-1.5">
                              ${p.price}
                            </span>
                          </div>
                        ) : (
                          <span className="text-neutral-900 font-bold">${p.price}</span>
                        )}
                      </td>

                      {/* Stock Level */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                              isOut
                                ? 'bg-rose-100 text-rose-700'
                                : isLow
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-neutral-100 text-neutral-800'
                            }`}
                          >
                            {p.stock} units
                          </span>
                          {isOut && <span className="text-[10px] text-rose-600 font-medium">Out of Stock</span>}
                          {isLow && <span className="text-[10px] text-amber-600 font-medium">Low Stock</span>}
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onUpdateProduct(p.id, { isActive: !p.isActive })}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                            p.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                          }`}
                        >
                          {p.isActive ? 'Active & Live' : 'Draft / Disabled'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              onOpenModal();
                            }}
                            title="Edit Product"
                            className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onDuplicateProduct(p.id)}
                            title="Duplicate Product"
                            className="p-1.5 text-neutral-600 hover:text-amber-600 hover:bg-neutral-100 rounded-lg transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Delete "${p.name}"?`)) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            title="Delete Product"
                            className="p-1.5 text-neutral-600 hover:text-rose-600 hover:bg-neutral-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. PRODUCT CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <h3 className="font-serif text-xl font-light text-neutral-900">
                {editingProduct ? 'Edit Atelier Product' : 'Add New Atelier Product'}
              </h3>
              <button
                onClick={onCloseModal}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Sculpted Silk Column Dress"
                    className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  />
                </div>

                {/* Gender & Category */}
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
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Dresses, Outerwear, Knitwear"
                    className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  />
                </div>

                {/* Price & Sale Price */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Regular Price ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Sale Price ($) (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    placeholder="e.g. 280.00"
                    className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  />
                </div>

                {/* Stock & Threshold */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Low Stock Alert Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  />
                </div>

                {/* Sizes & Colors */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Sizes (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.sizes}
                    onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                    placeholder="XS, S, M, L, XL"
                    className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Colors (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.colors}
                    onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                    placeholder="Black, Champagne, Ivory"
                    className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  />
                </div>

                {/* Image URLs */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Image URLs (one URL per line) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.images}
                    onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  />
                  {formData.images && (
                    <div className="flex gap-2 mt-2 overflow-x-auto">
                      {formData.images
                        .split('\n')
                        .map((url) => url.trim())
                        .filter(Boolean)
                        .slice(0, 4)
                        .map((imgUrl, i) => (
                          <img
                            key={i}
                            src={imgUrl}
                            alt=""
                            className="w-12 h-14 object-cover rounded border border-neutral-200"
                            onError={(e) => {
                              (e.target as any).src =
                                'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100';
                            }}
                          />
                        ))}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Full Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Fabric composition, cut, architectural drape..."
                    className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  />
                </div>

                {/* Toggles */}
                <div className="sm:col-span-2 flex flex-wrap gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="rounded border-neutral-300 text-neutral-900 focus:ring-0"
                    />
                    <span>Featured in Spotlight</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formData.newArrival}
                      onChange={(e) => setFormData({ ...formData, newArrival: e.target.checked })}
                      className="rounded border-neutral-300 text-neutral-900 focus:ring-0"
                    />
                    <span>New Arrival Badge</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-neutral-300 text-neutral-900 focus:ring-0"
                    />
                    <span>Publish Immediately (Active)</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onCloseModal}
                  className="px-4 py-2 border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-medium uppercase tracking-wider"
                >
                  {formSubmitting
                    ? 'Saving...'
                    : editingProduct
                    ? 'Save Product Changes'
                    : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
