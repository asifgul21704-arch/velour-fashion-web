import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  XCircle,
  DollarSign,
  Printer,
  ChevronDown,
  X,
  FileText,
  UserCheck
} from 'lucide-react';
import { Order, OrderStatus, PaymentStatus } from '../../../types.ts';

interface OrdersManagerProps {
  orders: Order[];
  onRefresh: () => void;
  onUpdateStatus: (id: string, status: OrderStatus, paymentStatus?: PaymentStatus, note?: string) => Promise<boolean>;
  onRefundOrder: (id: string, amount: number, reason: string) => Promise<boolean>;
  selectedOrder: Order | null;
  setSelectedOrder: (order: Order | null) => void;
}

export function OrdersManager({
  orders,
  onRefresh,
  onUpdateStatus,
  onRefundOrder,
  selectedOrder,
  setSelectedOrder
}: OrdersManagerProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  // Refund modal inside order
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('Customer return accepted at atelier');
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  // Status note input
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Status filter list
  const statuses: { label: string; value: string }[] = [
    { label: 'All Orders', value: 'all' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Confirmed', value: 'Confirmed' },
    { label: 'Processing', value: 'Processing' },
    { label: 'Shipped', value: 'Shipped' },
    { label: 'Delivered', value: 'Delivered' },
    { label: 'Cancelled', value: 'Cancelled' },
    { label: 'Refunded', value: 'Refunded' }
  ];

  const filteredOrders = orders.filter((o) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        o.orderNumber.toLowerCase().includes(q) ||
        o.userName.toLowerCase().includes(q) ||
        o.userEmail.toLowerCase().includes(q) ||
        (o.shippingAddress?.phone || '').includes(q);
      if (!match) return false;
    }
    if (statusFilter !== 'all' && o.orderStatus !== statusFilter) return false;
    if (paymentFilter !== 'all' && o.paymentStatus !== paymentFilter) return false;
    return true;
  });

  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
    setIsUpdatingStatus(true);
    try {
      await onUpdateStatus(order.id, newStatus, undefined, statusNote || `Status updated to ${newStatus}`);
      setStatusNote('');
      // If selectedOrder is this order, update local reference
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || refundAmount <= 0) return;

    setIsSubmittingRefund(true);
    try {
      const ok = await onRefundOrder(selectedOrder.id, refundAmount, refundReason);
      if (ok) {
        setIsRefundModalOpen(false);
      }
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Quick Summary */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-light text-neutral-900">Orders & Fulfillment Console</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Monitor client dispatches, manage status lifecycles, and process secure refunds
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-medium transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 2. Filters & Status Tabs */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
          {statuses.map((st) => {
            const count =
              st.value === 'all'
                ? orders.length
                : orders.filter((o) => o.orderStatus === st.value).length;
            const isActive = statusFilter === st.value;

            return (
              <button
                key={st.value}
                onClick={() => setStatusFilter(st.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600'
                }`}
              >
                <span>{st.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search and Secondary Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order #, client name, email or phone..."
              className="w-full pl-10 pr-3 py-2 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          >
            <option value="all">All Payment States</option>
            <option value="Paid">Paid Only</option>
            <option value="Pending">Pending Payment</option>
            <option value="Refunded">Refunded Only</option>
          </select>
        </div>
      </div>

      {/* 3. Orders Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 font-mono uppercase text-[10px] tracking-wider border-b border-neutral-100">
              <tr>
                <th className="px-6 py-3">Order Number</th>
                <th className="px-6 py-3">Customer & Contact</th>
                <th className="px-6 py-3">Pieces</th>
                <th className="px-6 py-3">Fulfillment Status</th>
                <th className="px-6 py-3">Payment</th>
                <th className="px-6 py-3">Total Amount</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                    No orders match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const itemCount = (order.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0);

                  return (
                    <tr key={order.id} className="hover:bg-neutral-50/70 transition-colors">
                      {/* Order Number */}
                      <td className="px-6 py-4 font-mono font-bold text-neutral-900">
                        #{order.orderNumber}
                        <p className="text-[10px] text-neutral-400 font-sans font-normal mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        <p className="font-medium text-neutral-900">{order.userName}</p>
                        <p className="text-[10px] text-neutral-500 font-mono">{order.userEmail}</p>
                      </td>

                      {/* Items */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-medium">{itemCount} items</span>
                          <span className="text-neutral-400">&bull;</span>
                          <span className="text-[11px] text-neutral-500 truncate max-w-[120px]">
                            {order.items?.[0]?.name || 'Collection item'}
                          </span>
                        </div>
                      </td>

                      {/* Order Status Selector */}
                      <td className="px-6 py-4">
                        <select
                          value={order.orderStatus}
                          onChange={(e) => handleStatusChange(order, e.target.value as OrderStatus)}
                          className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border-0 focus:ring-1 focus:ring-neutral-900 cursor-pointer ${
                            order.orderStatus === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.orderStatus === 'Shipped'
                              ? 'bg-blue-100 text-blue-800'
                              : order.orderStatus === 'Processing'
                              ? 'bg-purple-100 text-purple-800'
                              : order.orderStatus === 'Cancelled'
                              ? 'bg-rose-100 text-rose-800'
                              : order.orderStatus === 'Refunded'
                              ? 'bg-neutral-200 text-neutral-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Refunded">Refunded</option>
                        </select>
                      </td>

                      {/* Payment Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            order.paymentStatus === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700'
                              : order.paymentStatus === 'Refunded'
                              ? 'bg-neutral-100 text-neutral-600'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                        <p className="text-[10px] text-neutral-400 font-sans mt-0.5">{order.paymentMethod}</p>
                      </td>

                      {/* Total */}
                      <td className="px-6 py-4 font-mono font-bold text-neutral-900">
                        ${order.total.toFixed(2)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. DETAILED ORDER DRAWER / MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-8">
            {/* Header */}
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-serif text-2xl font-light text-neutral-900">
                    Order #{selectedOrder.orderNumber}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      selectedOrder.orderStatus === 'Delivered'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedOrder.orderStatus === 'Shipped'
                        ? 'bg-blue-100 text-blue-800'
                        : selectedOrder.orderStatus === 'Refunded'
                        ? 'bg-neutral-200 text-neutral-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedOrder.orderStatus}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()} &bull; ID: {selectedOrder.id}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setRefundAmount(selectedOrder.total);
                    setIsRefundModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Issue Refund</span>
                </button>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Status Update Quick Toolbar */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                    Fulfillment Status
                  </span>
                  <p className="text-[11px] text-neutral-500">Update order milestone and notify client</p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedOrder.orderStatus}
                    onChange={(e) => handleStatusChange(selectedOrder, e.target.value as OrderStatus)}
                    className="px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-medium"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
                  Ordered Atelier Pieces ({selectedOrder.items?.length || 0})
                </h4>
                <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-xl overflow-hidden">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between gap-4 bg-white">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100'}
                          alt=""
                          className="w-12 h-14 object-cover rounded-lg bg-neutral-100 shrink-0"
                        />
                        <div>
                          <p className="font-medium text-neutral-900 text-xs">{item.name}</p>
                          <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                            <span>Size: {item.size}</span>
                            <span>&bull;</span>
                            <span>Color: {item.color}</span>
                            <span>&bull;</span>
                            <span className="font-mono">Qty: {item.quantity}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <p className="font-bold text-neutral-900 text-xs">
                          ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                        </p>
                        <p className="text-[10px] text-neutral-400">${item.price} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping & Financial Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Shipping Details */}
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 space-y-2 text-xs">
                  <h5 className="font-semibold uppercase tracking-wider text-neutral-700 text-[11px]">
                    Delivery Destination
                  </h5>
                  <p className="font-medium text-neutral-900">{selectedOrder.shippingAddress?.fullName}</p>
                  <p className="text-neutral-600">{selectedOrder.shippingAddress?.address}</p>
                  <p className="text-neutral-600">
                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.postalCode}
                  </p>
                  <p className="text-neutral-600">{selectedOrder.shippingAddress?.country}</p>
                  <div className="pt-2 border-t border-neutral-200/60 font-mono text-[11px] text-neutral-500 space-y-0.5">
                    <p>Phone: {selectedOrder.shippingAddress?.phone}</p>
                    <p>Email: {selectedOrder.shippingAddress?.email}</p>
                  </div>
                </div>

                {/* Financials */}
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 space-y-2 text-xs">
                  <h5 className="font-semibold uppercase tracking-wider text-neutral-700 text-[11px]">
                    Financial Summary
                  </h5>
                  <div className="space-y-1 font-mono text-neutral-600">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${selectedOrder.subtotal?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping Fee:</span>
                      <span>${selectedOrder.shipping?.toFixed(2)}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount ({selectedOrder.discountCode || 'PROMO'}):</span>
                        <span>-${selectedOrder.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-neutral-200 flex justify-between font-bold text-neutral-900 text-sm">
                      <span>Grand Total:</span>
                      <span>${selectedOrder.total.toFixed(2)}</span>
                    </div>
                    {selectedOrder.refundAmount && (
                      <div className="pt-1 flex justify-between text-rose-600 font-bold">
                        <span>Refunded:</span>
                        <span>-${selectedOrder.refundAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline History */}
              {selectedOrder.timeline && selectedOrder.timeline.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
                    Order Event Log & Timeline
                  </h4>
                  <div className="space-y-2 bg-neutral-50 p-4 rounded-xl border border-neutral-100 text-xs">
                    {selectedOrder.timeline.map((event, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-neutral-900 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <p className="font-semibold text-neutral-900">{event.status}</p>
                          <p className="text-neutral-600 text-[11px]">{event.note}</p>
                          <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                            {new Date(event.timestamp).toLocaleString()} &bull; {event.updatedBy || 'Atelier'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-100 flex justify-end bg-neutral-50/50">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-medium uppercase tracking-wider"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. REFUND MODAL */}
      {isRefundModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-600" />
                <h3 className="font-serif text-lg text-neutral-900">Issue Order Refund</h3>
              </div>
              <button onClick={() => setIsRefundModalOpen(false)}>
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            <form onSubmit={handleRefundSubmit} className="p-5 space-y-4">
              <p className="text-xs text-neutral-600">
                Processing a refund will record the transaction in the financial ledger, notify the client, and adjust payment status to <span className="font-semibold">Refunded</span>.
              </p>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Refund Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedOrder.total}
                  required
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                />
                <span className="text-[10px] text-neutral-400">
                  Maximum allowable: ${selectedOrder.total.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Refund Reason / Memo
                </label>
                <textarea
                  rows={2}
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRefundModalOpen(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-700 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRefund}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-medium uppercase tracking-wider"
                >
                  {isSubmittingRefund ? 'Processing...' : 'Confirm & Disburse Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
