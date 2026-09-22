import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Package,
  Truck,
  Home,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  CreditCard
} from 'lucide-react';
import { Order } from '../types.ts';
import { apiFetch } from '../lib/api.ts';
import { useCart } from '../context/CartContext.tsx';
import { useToast } from '../context/ToastContext.tsx';

interface OrderSuccessPageProps {
  orderId: string;
  sessionId?: string;
  onNavigate: (path: string) => void;
}

export function OrderSuccessPage({ orderId, sessionId, onNavigate }: OrderSuccessPageProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const { clearCart } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;

    async function loadAndVerifyOrder() {
      setLoading(true);
      try {
        // If returning from Stripe Checkout with a session_id, verify directly with backend
        if (sessionId) {
          const verifyRes = await apiFetch('/api/payments/verify', {
            method: 'POST',
            body: JSON.stringify({ sessionId, orderId })
          });

          if (verifyRes.ok) {
            const verifyData = await verifyRes.json();
            if (isMounted && verifyData.order) {
              setOrder(verifyData.order);
              if (verifyData.isPaid) {
                // Clear cart only after verified real payment confirmation
                await clearCart();
                showToast('Payment verified successfully with gateway!', 'success');
              } else {
                setVerificationError(
                  `Payment returned status: ${verifyData.status || 'Unconfirmed'}. Please review or retry below.`
                );
              }
              return;
            }
          }
        }

        // Standard lookup by orderId
        if (orderId) {
          const res = await apiFetch(`/api/orders/${orderId}`);
          if (res.ok) {
            const data = await res.json();
            if (isMounted) {
              setOrder(data.order);
            }
          } else {
            if (isMounted) setVerificationError('Order details could not be retrieved.');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setVerificationError(err.message || 'Error communicating with payment verification service.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAndVerifyOrder();

    return () => {
      isMounted = false;
    };
  }, [orderId, sessionId]);

  const handleRetryPayment = async () => {
    if (!order) return;
    setIsRetrying(true);
    try {
      const res = await apiFetch('/api/payments/retry', {
        method: 'POST',
        body: JSON.stringify({ orderId: order.id })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Could not initiate retry session', 'error');
        setIsRetrying(false);
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        showToast('No checkout URL returned from payment provider', 'error');
        setIsRetrying(false);
      }
    } catch (err: any) {
      showToast(err.message || 'Error contacting payment provider', 'error');
      setIsRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="py-28 text-center max-w-lg mx-auto px-4">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-black border-t-transparent mb-4" />
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-900 mb-1">
          Verifying Payment with Gateway
        </h2>
        <p className="text-xs text-neutral-500">
          Communicating securely with payment provider servers. Please do not refresh.
        </p>
      </div>
    );
  }

  const isPaid = order?.paymentStatus === 'Paid';
  const isFailedOrCancelled = order?.paymentStatus === 'Failed' || order?.paymentStatus === 'Cancelled';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      {/* Header state based on payment status */}
      <div className="text-center space-y-4 mb-12">
        {isPaid ? (
          <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <CheckCircle2 className="w-8 h-8 stroke-[1.5]" />
          </div>
        ) : isFailedOrCancelled ? (
          <div className="w-16 h-16 bg-rose-50 text-rose-700 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200">
            <AlertCircle className="w-8 h-8 stroke-[1.5]" />
          </div>
        ) : (
          <div className="w-16 h-16 bg-neutral-50 text-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-neutral-200">
            <CheckCircle2 className="w-8 h-8 stroke-[1.5]" />
          </div>
        )}

        <span className="text-xs uppercase tracking-[0.3em] text-neutral-400 font-semibold block">
          {isPaid
            ? 'Payment Confirmed & Verified'
            : isFailedOrCancelled
            ? 'Payment Action Needed'
            : 'Order Placed'}
        </span>

        <h1 className="font-serif text-3xl sm:text-5xl text-neutral-900 font-light">
          {isPaid
            ? 'Thank you for choosing VELOUR.'
            : isFailedOrCancelled
            ? 'Payment Unsuccessful'
            : 'Order Placed with Atelier'}
        </h1>

        <p className="text-sm sm:text-base text-neutral-600 max-w-lg mx-auto font-light leading-relaxed">
          {isPaid
            ? 'Your payment was successfully authorized and verified by our gateway. A receipt has been issued.'
            : isFailedOrCancelled
            ? 'Your order is recorded, but the payment transaction was not finalized or was declined.'
            : 'Your order has been registered in the atelier database. A confirmation dispatch has been logged.'}
        </p>

        {verificationError && (
          <div className="max-w-md mx-auto p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{verificationError}</span>
          </div>
        )}

        {isFailedOrCancelled && order && (
          <div className="pt-2">
            <button
              onClick={handleRetryPayment}
              disabled={isRetrying}
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-xs uppercase tracking-widest font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting to Gateway...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Retry Payment Securely</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {order && (
        <div className="bg-white border border-neutral-200 p-6 sm:p-10 space-y-8 shadow-sm">
          {/* Top metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-neutral-100 text-xs uppercase tracking-wider">
            <div>
              <span className="text-neutral-400 block mb-1 text-[10px]">Order Number</span>
              <span className="font-semibold text-neutral-900 text-sm font-mono">#{order.orderNumber}</span>
            </div>
            <div>
              <span className="text-neutral-400 block mb-1 text-[10px]">Order Date</span>
              <span className="font-semibold text-neutral-900">{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-neutral-400 block mb-1 text-[10px]">Total Amount</span>
              <span className="font-semibold text-neutral-900 text-sm">${order.total} {order.currency || 'USD'}</span>
            </div>
            <div>
              <span className="text-neutral-400 block mb-1 text-[10px]">Payment Status</span>
              <span
                className={`inline-block px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider ${
                  order.paymentStatus === 'Paid'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    : order.paymentStatus === 'Failed' || order.paymentStatus === 'Cancelled'
                    ? 'bg-rose-100 text-rose-900 border border-rose-200'
                    : 'bg-amber-100 text-amber-900 border border-amber-200'
                }`}
              >
                {order.paymentStatus}
              </span>
            </div>
          </div>

          {/* Real Payment Gateway Verification Details */}
          <div className="p-4 bg-neutral-50 border border-neutral-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-900" />
                Gateway Verification Record
              </span>
              <span className="text-[10px] font-mono text-neutral-500 uppercase">
                Provider: {order.paymentProvider || 'Stripe'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div>
                <span className="text-neutral-400 text-[10px] block">Payment Method</span>
                <span className="font-medium text-neutral-900">{order.paymentMethod}</span>
              </div>
              <div>
                <span className="text-neutral-400 text-[10px] block">Transaction Reference ID</span>
                <span className="font-mono text-neutral-900 break-all text-[11px]">
                  {order.transactionId || order.paymentIntentId || 'Pending Gateway Settlement'}
                </span>
              </div>
              {order.paidAt && (
                <div>
                  <span className="text-neutral-400 text-[10px] block">Settled Timestamp</span>
                  <span className="font-mono text-neutral-900 text-[11px]">
                    {new Date(order.paidAt).toLocaleString()}
                  </span>
                </div>
              )}
              {order.paymentSessionId && (
                <div>
                  <span className="text-neutral-400 text-[10px] block">Gateway Session ID</span>
                  <span className="font-mono text-neutral-600 text-[10px] truncate block">
                    {order.paymentSessionId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method instructions / notes if present */}
          {order.notes && order.notes.includes('Method:') && (
            <div className="p-3 bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold uppercase tracking-wider text-[10px] text-neutral-900 block mb-0.5">
                  Order Notes & Logs
                </span>
                <p className="font-mono text-[11px] text-neutral-800">{order.notes}</p>
              </div>
            </div>
          )}

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
