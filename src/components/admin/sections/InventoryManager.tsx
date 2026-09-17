import React, { useState, useEffect } from 'react';
import {
  Archive,
  Search,
  Plus,
  Minus,
  AlertTriangle,
  History,
  RotateCcw,
  CheckCircle2,
  X,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { Product, InventoryTransaction } from '../../../types.ts';
import { apiFetch } from '../../../lib/api.ts';

interface InventoryManagerProps {
  products: Product[];
  onRefresh: () => void;
  onAdjustStock: (productId: string, change: number, type: string, reason: string) => Promise<boolean>;
  quickRestockProduct: Product | null;
  setQuickRestockProduct: (p: Product | null) => void;
}

export function InventoryManager({
  products,
  onRefresh,
  onAdjustStock,
  quickRestockProduct,
  setQuickRestockProduct
}: InventoryManagerProps) {
  const [activeTab, setActiveTab] = useState<'inventory' | 'transactions'>('inventory');
  const [search, setSearch] = useState('');
  const [statusFilter, setStockFilter] = useState<'all' | 'healthy' | 'low' | 'out'>('all');

  // Transactions list
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  // Adjustment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'received' | 'damaged' | 'returned' | 'adjusted'>('received');
  const [quantityValue, setQuantityValue] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState('Restock shipment from atelier');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trigger from outside if quickRestockProduct provided
  useEffect(() => {
    if (quickRestockProduct) {
      setSelectedProduct(quickRestockProduct);
      setAdjustType('received');
      setQuantityValue(10);
      setAdjustReason('Urgent stock replenishment');
      setIsModalOpen(true);
    }
  }, [quickRestockProduct]);

  // Load audit transactions
  const loadTransactions = async () => {
    setLoadingTx(true);
    try {
      const res = await apiFetch('/api/admin/inventory/transactions?limit=60');
      if (res.ok) {
        const d = await res.json();
        setTransactions(d.transactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTx(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'transactions') {
      loadTransactions();
    }
  }, [activeTab]);

  const healthyCount = products.filter((p) => p.stock > (p.lowStockThreshold || 5)).length;
  const lowCount = products.filter((p) => p.stock <= (p.lowStockThreshold || 5) && p.stock > 0).length;
  const outCount = products.filter((p) => p.stock <= 0).length;

  const filteredProducts = products.filter((p) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const match = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (statusFilter === 'healthy' && p.stock <= (p.lowStockThreshold || 5)) return false;
    if (statusFilter === 'low' && (p.stock <= 0 || p.stock > (p.lowStockThreshold || 5))) return false;
    if (statusFilter === 'out' && p.stock > 0) return false;
    return true;
  });

  const handleOpenAdjustment = (prod: Product) => {
    setSelectedProduct(prod);
    setAdjustType('received');
    setQuantityValue(10);
    setAdjustReason('Physical stock intake verification');
    setIsModalOpen(true);
  };

  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || quantityValue === 0) return;

    setIsSubmitting(true);
    try {
      // Calculate signed quantity
      let signedChange = Math.abs(quantityValue);
      if (adjustType === 'damaged') {
        signedChange = -Math.abs(quantityValue);
      }

      const ok = await onAdjustStock(
        selectedProduct.id,
        signedChange,
        adjustType,
        adjustReason.trim() || 'Manual stock adjustment'
      );

      if (ok) {
        setIsModalOpen(false);
        setSelectedProduct(null);
        if (quickRestockProduct) setQuickRestockProduct(null);
        loadTransactions();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Navigation Tabs */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-light text-neutral-900">Inventory & Stock Control</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Audit inventory levels, track replenishment cycles, and review movement ledgers
          </p>
        </div>

        <div className="inline-flex p-1 bg-neutral-100 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'inventory' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-black'
            }`}
          >
            Catalog Stock ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'transactions'
                ? 'bg-white text-neutral-950 shadow-sm'
                : 'text-neutral-500 hover:text-black'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Ledger</span>
          </button>
        </div>
      </div>

      {/* 2. Stock Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setStockFilter(statusFilter === 'healthy' ? 'all' : 'healthy')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'healthy'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
              : 'bg-white border-neutral-200 hover:border-neutral-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
              Optimal Stock Level
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-serif font-light text-neutral-900 mt-2">{healthyCount} SKUs</p>
          <span className="text-[11px] text-emerald-700 font-medium">Ready for instant dispatch</span>
        </button>

        <button
          onClick={() => setStockFilter(statusFilter === 'low' ? 'all' : 'low')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'low'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20'
              : 'bg-white border-neutral-200 hover:border-neutral-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
              Low Stock Alerts (&le; 5)
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-serif font-light text-neutral-900 mt-2">{lowCount} SKUs</p>
          <span className="text-[11px] text-amber-700 font-medium">Requires atelier replenishment</span>
        </button>

        <button
          onClick={() => setStockFilter(statusFilter === 'out' ? 'all' : 'out')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'out'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20'
              : 'bg-white border-neutral-200 hover:border-neutral-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
              Out of Stock (0 units)
            </span>
            <X className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-serif font-light text-neutral-900 mt-2">{outCount} SKUs</p>
          <span className="text-[11px] text-rose-700 font-medium">Unfulfillable in storefront</span>
        </button>
      </div>

      {/* 3. Tab Content: Stock List */}
      {activeTab === 'inventory' ? (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by product name, SKU or category..."
                className="w-full pl-10 pr-3 py-2 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>
            {statusFilter !== 'all' && (
              <button
                onClick={() => setStockFilter('all')}
                className="text-xs text-neutral-500 hover:text-black font-medium"
              >
                Clear Filter ({statusFilter})
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 font-mono uppercase text-[10px] tracking-wider border-b border-neutral-100">
                  <tr>
                    <th className="px-6 py-3">Product & SKU</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Available Quantity</th>
                    <th className="px-6 py-3">Threshold Alert</th>
                    <th className="px-6 py-3">Stock Health</th>
                    <th className="px-6 py-3 text-right">Inventory Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredProducts.map((p) => {
                    const isOut = p.stock <= 0;
                    const isLow = p.stock <= (p.lowStockThreshold || 5) && p.stock > 0;

                    return (
                      <tr key={p.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.images?.[0] || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100'}
                              alt=""
                              className="w-10 h-12 object-cover rounded-lg bg-neutral-100 shrink-0"
                            />
                            <div>
                              <p className="font-medium text-neutral-900">{p.name}</p>
                              <p className="text-[10px] text-neutral-400 font-mono">SKU: {p.sku}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-neutral-600">
                          {p.category} &bull; <span className="capitalize">{p.gender}</span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`font-mono text-sm font-bold ${
                              isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-neutral-900'
                            }`}
                          >
                            {p.stock}
                          </span>
                          <span className="text-neutral-400 text-[10px] ml-1">units in warehouse</span>
                        </td>

                        <td className="px-6 py-4 font-mono text-neutral-500 text-[11px]">
                          Alerts at &le; {p.lowStockThreshold || 5}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              isOut
                                ? 'bg-rose-100 text-rose-800'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Healthy Supply'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleOpenAdjustment(p)}
                            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Adjust Stock</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* 4. Tab Content: Audit Ledger */
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h4 className="font-serif text-lg font-light text-neutral-900">Inventory Movement Ledger</h4>
              <p className="text-xs text-neutral-500">Complete audit trail of all warehouse and storefront adjustments</p>
            </div>
            <button
              onClick={loadTransactions}
              disabled={loadingTx}
              className="text-xs text-neutral-700 hover:text-black font-medium hover:underline"
            >
              {loadingTx ? 'Refreshing...' : 'Refresh Logs'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 font-mono uppercase text-[10px] tracking-wider border-b border-neutral-100">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Piece & SKU</th>
                  <th className="px-6 py-3">Movement Type</th>
                  <th className="px-6 py-3">Delta</th>
                  <th className="px-6 py-3">Stock Before &rarr; After</th>
                  <th className="px-6 py-3">Reason / Memo</th>
                  <th className="px-6 py-3">Auditor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-neutral-400 font-sans">
                      No stock movement logged yet. Future adjustments and order deductions will record here automatically.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-neutral-50/70">
                      <td className="px-6 py-3 text-neutral-500 text-[11px]">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 font-sans font-medium text-neutral-900">
                        {tx.productName}
                        <span className="block text-[10px] font-mono text-neutral-400">SKU: {tx.sku}</span>
                      </td>
                      <td className="px-6 py-3 uppercase text-[10px] font-bold">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            tx.type === 'received'
                              ? 'bg-emerald-50 text-emerald-700'
                              : tx.type === 'sold'
                              ? 'bg-blue-50 text-blue-700'
                              : tx.type === 'damaged'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-bold">
                        <span className={tx.quantityChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {tx.quantityChange >= 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-neutral-700">
                        {tx.previousStock} &rarr; <span className="font-bold text-neutral-900">{tx.newStock}</span>
                      </td>
                      <td className="px-6 py-3 font-sans text-neutral-600 text-xs">
                        {tx.reason || 'General inventory adjustment'}
                      </td>
                      <td className="px-6 py-3 font-sans text-neutral-500 text-[11px]">
                        {tx.recordedBy || 'Atelier System'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. ADJUSTMENT MODAL */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <div>
                <h3 className="font-serif text-lg text-neutral-900">Adjust Inventory Stock</h3>
                <p className="text-xs text-neutral-500 truncate">{selectedProduct.name}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdjustment} className="p-5 space-y-4">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center justify-between text-xs">
                <span className="text-neutral-500">Current Warehouse Stock:</span>
                <span className="font-mono font-bold text-sm text-neutral-900">{selectedProduct.stock} units</span>
              </div>

              {/* Adjustment Type */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Movement Category *
                </label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                >
                  <option value="received">Restock Intake (Add to stock +)</option>
                  <option value="returned">Customer Return Intake (Add to stock +)</option>
                  <option value="damaged">Damaged / Showroom Defect (Deduct from stock -)</option>
                  <option value="adjusted">Physical Inventory Reconciliation</option>
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Quantity Units *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantityValue}
                  onChange={(e) => setQuantityValue(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-xs font-mono border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Audit Memo / Justification *
                </label>
                <textarea
                  rows={2}
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Batch #4 shipment from Milan warehouse..."
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
                  {isSubmitting ? 'Recording...' : 'Commit Stock Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
