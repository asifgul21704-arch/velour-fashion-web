import React, { useState } from 'react';
import {
  CreditCard,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  RotateCcw,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { Order } from '../../../types.ts';

interface PaymentsManagerProps {
  orders: Order[];
  onRefundOrder: (id: string, amount: number, reason: string) => Promise<boolean>;
  onSelectOrder: (order: Order) => void;
}

export function PaymentsManager({ orders, onRefundOrder, onSelectOrder }: PaymentsManagerProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Pending' | 'Refunded'>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Calculate financials from actual real orders
  const grossVolume = orders
    .filter((o) => o.paymentStatus === 'Paid' || o.paymentStatus === 'Refunded')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const totalRefunded = orders.reduce((sum, o) => sum + (o.refundAmount || 0), 0);
  const netSettled = grossVolume - totalRefunded;

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.paymentStatus !== statusFilter) return false;
    if (methodFilter !== 'all' && o.paymentMethod !== methodFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.userName.toLowerCase().includes(q) ||
        o.userEmail.toLowerCase().includes(q) ||
        (o.id || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportCSV = () => {
    const headers = ['Order Number', 'Date', 'Customer', 'Email', 'Payment Method', 'Status', 'Total', 'Refunded'];
    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toISOString(),
      `"${o.userName}"`,
      o.userEmail,
      o.paymentMethod,
      o.paymentStatus,
      o.total.toFixed(2),
      (o.refundAmount || 0).toFixed(2)
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `velour_payment_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-light text-neutral-900">Payment Ledger & Settlements</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Audit gateway settlements, process verified merchant refunds, and export tax compliance ledgers
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-medium transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* 2. Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Gross Processed Volume
          </span>
          <h3 className="text-3xl font-serif font-light text-neutral-900 mt-3">
            ${grossVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Total processed through merchant gates</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Total Disbursed Refunds
          </span>
          <h3 className="text-3xl font-serif font-light text-rose-600 mt-3">
            ${totalRefunded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium mt-1">
            <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
            <span>Store returns & cancellations</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Net Atelier Revenue
          </span>
          <h3 className="text-3xl font-serif font-light text-neutral-900 mt-3">
            ${netSettled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-medium mt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Settled net after returned balances</span>
          </div>
        </div>
      </div>

      {/* 3. Filters */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, client name or email..."
            className="w-full pl-10 pr-3 py-2 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
        >
          <option value="all">All Payment States</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Refunded">Refunded</option>
        </select>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
        >
          <option value="all">All Payment Methods</option>
          <option value="Credit Card">Credit Card</option>
          <option value="Stripe">Stripe Gateway</option>
          <option value="Apple Pay">Apple Pay</option>
          <option value="PayPal">PayPal</option>
          <option value="COD">Cash on Delivery</option>
        </select>
      </div>

      {/* 4. Transactions Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 font-mono uppercase text-[10px] tracking-wider border-b border-neutral-100">
              <tr>
                <th className="px-6 py-3">Order Number</th>
                <th className="px-6 py-3">Client Profile</th>
                <th className="px-6 py-3">Gate Method</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Gross Total</th>
                <th className="px-6 py-3">Refund Amount</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                    No payment records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-neutral-900">
                      #{o.orderNumber}
                      <p className="text-[10px] text-neutral-400 font-sans font-normal mt-0.5">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-medium text-neutral-900">{o.userName}</p>
                      <p className="text-[10px] text-neutral-400 font-mono">{o.userEmail}</p>
                    </td>

                    <td className="px-6 py-4 text-neutral-700 font-medium">
                      {o.paymentMethod || 'Credit Card'}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          o.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : o.paymentStatus === 'Refunded'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {o.paymentStatus}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-mono font-bold text-neutral-900">
                      ${o.total.toFixed(2)}
                    </td>

                    <td className="px-6 py-4 font-mono text-rose-600">
                      {o.refundAmount ? `-$${o.refundAmount.toFixed(2)}` : '—'}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onSelectOrder(o)}
                        className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-medium transition-colors"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
