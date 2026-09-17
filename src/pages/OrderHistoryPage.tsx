import React, { useState, useEffect } from 'react';
import { Package, ArrowLeft, Clock, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { Order, OrderStatus } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { apiFetch } from '../lib/api.ts';

interface OrderHistoryPageProps {
  onNavigate: (path: string) => void;
}

export function OrderHistoryPage({ onNavigate }: OrderHistoryPageProps) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      onNavigate('/login');
      return;
    }

    async function fetchOrders() {
      try {
        const res = await apiFetch('/api/orders/my-orders');
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.error('Failed to load user orders', err);
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      fetchOrders();
    }
  }, [authLoading, isAuthenticated, onNavigate]);

  const getStatusBadge = (status?: OrderStatus) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Shipped':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Processing':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  if (loading || authLoading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-black border-t-transparent mb-3" />
        <p className="text-xs uppercase tracking-widest text-neutral-500">Retrieving Order Archives...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <button
        onClick={() => onNavigate('/account')}
        className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 hover:text-black mb-8 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Account</span>
      </button>

      <div className="mb-10">
        <span className="text-xs uppercase tracking-[0.25em] text-neutral-400 font-semibold block mb-1">
          Historical Purchases
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-neutral-900 font-light">
          Order Archive ({orders.length})
        </h1>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-neutral-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400">
            <Package className="w-8 h-8 stroke-1" />
          </div>
          <h2 className="font-serif text-2xl text-neutral-800">No Orders Placed Yet</h2>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto uppercase tracking-wider">
            Explore our curated collections for women and men to discover your first statement garment.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('/women')}
              className="px-6 py-3 bg-black text-white text-xs uppercase tracking-widest font-semibold hover:bg-neutral-800 transition-colors"
            >
              Shop Collections
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map(order => (
            <div
              key={order.id}
              className="bg-white border border-neutral-200 shadow-sm overflow-hidden"
            >
              {/* Top Banner */}
              <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-4 text-xs uppercase tracking-wider">
                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <span className="text-neutral-400 text-[10px] block">Order Identifier</span>
                    <span className="font-semibold text-neutral-900">{order.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 text-[10px] block">Date Placed</span>
                    <span className="text-neutral-700">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 text-[10px] block">Settlement Total</span>
                    <span className="font-semibold text-neutral-900">${order.total}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-[11px] font-semibold border ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                  <span className="text-[11px] text-neutral-500 bg-white px-2 py-1 border border-neutral-200">
                    COD: {order.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="p-6 divide-y divide-neutral-100">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img src={item.image} alt={item.name} className="w-14 h-18 object-cover bg-neutral-100 shrink-0" />
                      <div>
                        <h4 className="font-serif text-sm text-neutral-900">{item.name}</h4>
                        <p className="text-[11px] text-neutral-500 uppercase tracking-wider mt-0.5">
                          Size: {item.size} &bull; Color: {item.color} &bull; Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-neutral-900">
                      ${item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Shipping snapshot */}
              <div className="bg-neutral-50/70 px-6 py-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                <span>
                  Delivering to: <strong className="text-neutral-800">{order.shippingAddress.fullName}</strong>, {order.shippingAddress.address}, {order.shippingAddress.city}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-neutral-400">
                  Phone: {order.shippingAddress.phone}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
