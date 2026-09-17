import React, { useState, useEffect } from 'react';
import { CheckCircle2, Package, ArrowRight, Truck, Home } from 'lucide-react';
import { Order } from '../types.ts';
import { apiFetch } from '../lib/api.ts';

interface OrderSuccessPageProps {
  orderId: string;
  onNavigate: (path: string) => void;
}

export function OrderSuccessPage({ orderId, onNavigate }: OrderSuccessPageProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await apiFetch(`/api/orders/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data.order);
        }
      } catch (err) {
        console.error('Failed to load order', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="py-28 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-black border-t-transparent mb-3" />
        <p className="text-xs uppercase tracking-widest text-neutral-500">Preparing Order Summary...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="text-center space-y-4 mb-12">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
          <CheckCircle2 className="w-8 h-8 stroke-[1.5]" />
        </div>

        <span className="text-xs uppercase tracking-[0.3em] text-neutral-400 font-semibold block">
          Order Confirmed
        </span>

        <h1 className="font-serif text-3xl sm:text-5xl text-neutral-900 font-light">
          Thank you for choosing VELOUR.
        </h1>

        <p className="text-sm sm:text-base text-neutral-600 max-w-lg mx-auto font-light leading-relaxed">
          Your order has been registered in the atelier database. A confirmation dispatch has been logged for your account.
        </p>
      </div>

      {order && (
        <div className="bg-white border border-neutral-200 p-6 sm:p-10 space-y-8 shadow-sm">
          {/* Top metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-neutral-100 text-xs uppercase tracking-wider">
            <div>
              <span className="text-neutral-400 block mb-1 text-[10px]">Order Number</span>
              <span className="font-semibold text-neutral-900 text-sm">{order.orderNumber}</span>
            </div>
            <div>
              <span className="text-neutral-400 block mb-1 text-[10px]">Order Date</span>
              <span className="font-semibold text-neutral-900">{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-neutral-400 block mb-1 text-[10px]">Total Amount</span>
              <span className="font-semibold text-neutral-900 text-sm">${order.total}</span>
            </div>
            <div>
              <span className="text-neutral-400 block mb-1 text-[10px]">Payment Terms</span>
              <span className="inline-block px-2 py-0.5 bg-neutral-100 text-neutral-800 font-medium">
                {order.paymentMethod}
              </span>
            </div>
          </div>

          {/* Items breakdown */}
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-widest text-neutral-900 font-bold block">
              Ordered Garments ({order.items.length})
            </span>

            <div className="divide-y divide-neutral-100">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img src={item.image} alt={item.name} className="w-12 h-16 object-cover bg-neutral-100 shrink-0" />
                    <div>
                      <p className="text-xs font-serif text-neutral-900 font-medium">{item.name}</p>
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wider">
                        Size: {item.size} &bull; Color: {item.color} &bull; Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-neutral-900">
                    ${item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Destination */}
          <div className="p-4 bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 space-y-1">
            <div className="flex items-center gap-2 font-semibold uppercase tracking-wider text-neutral-900 mb-2">
              <Truck className="w-4 h-4" />
              <span>Doorstep Delivery Destination</span>
            </div>
            <p className="font-medium text-neutral-900">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.address}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}, {order.shippingAddress.country}</p>
            <p className="text-neutral-500">Contact: {order.shippingAddress.phone}</p>
          </div>
        </div>
      )}

      {/* CTA Buttons */}
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={() => onNavigate('/account/orders')}
          className="w-full sm:w-auto px-8 py-3.5 bg-black text-white text-xs uppercase tracking-[0.2em] font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
        >
          <Package className="w-4 h-4" />
          <span>View In Order History</span>
        </button>
        <button
          onClick={() => onNavigate('/')}
          className="w-full sm:w-auto px-8 py-3.5 border border-neutral-300 text-neutral-800 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>Continue Exploring</span>
        </button>
      </div>
    </div>
  );
}
