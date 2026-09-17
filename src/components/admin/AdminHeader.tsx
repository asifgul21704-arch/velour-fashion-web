import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  Menu,
  RefreshCw,
  ExternalLink,
  Plus,
  Package,
  ShoppingBag,
  Users,
  Tag,
  CheckCircle2,
  X,
  AlertTriangle,
  Info
} from 'lucide-react';
import { AdminRoute } from './AdminSidebar.tsx';
import { apiFetch } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { AdminNotification } from '../../types.ts';

interface AdminHeaderProps {
  currentRoute: AdminRoute;
  onNavigate: (route: AdminRoute | string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenMobileSidebar: () => void;
  onOpenNewProduct?: () => void;
}

export function AdminHeader({
  currentRoute,
  onNavigate,
  onRefresh,
  isRefreshing,
  onOpenMobileSidebar,
  onOpenNewProduct
}: AdminHeaderProps) {
  const { user, logout } = useAuth();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    products: any[];
    orders: any[];
    customers: any[];
    coupons: any[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await apiFetch(`/api/admin/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setIsSearchOpen(true);
        }
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load notifications
  const loadNotifications = async () => {
    try {
      const res = await apiFetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      // Quiet fail
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markNotificationRead = async (id: string) => {
    try {
      await apiFetch(`/api/admin/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    try {
      await apiFetch('/api/admin/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const formatRouteTitle = (route: AdminRoute): string => {
    const titles: Record<AdminRoute, string> = {
      dashboard: 'Dashboard Overview',
      products: 'Product Catalog & Assortment',
      categories: 'Categories & Taxonomies',
      orders: 'Customer Orders & Fulfillment',
      customers: 'Client Directory & Accounts',
      inventory: 'Inventory & Stock Control',
      payments: 'Payment Ledger & Refunds',
      coupons: 'Promotions, Vouchers & Codes',
      reviews: 'Client Reviews Moderation',
      wishlist: 'Wishlist Intelligence',
      analytics: 'Store Analytics & Reports',
      marketing: 'Dispatches & Subscribers',
      banners: 'Hero & Promotional Banners',
      pages: 'Storefront Content Pages',
      'contact-messages': 'Concierge Inquiries',
      notifications: 'System Notifications',
      settings: 'Store Configuration',
      activity: 'Security & Audit Trail',
      profile: 'Administrator Profile'
    };
    return titles[route] || 'Business Management';
  };

  return (
    <header className="sticky top-0 z-30 h-20 bg-white/90 backdrop-blur-md border-b border-neutral-200/80 px-4 sm:px-8 flex items-center justify-between gap-4 transition-all">
      {/* Left: Mobile Menu & Route Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-neutral-500">
            <span>VELOUR ATELIER</span>
            <span>/</span>
            <span className="text-neutral-900 font-semibold">{currentRoute}</span>
          </div>
          <h1 className="text-lg sm:text-xl font-medium tracking-tight text-neutral-900">
            {formatRouteTitle(currentRoute)}
          </h1>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim() && setIsSearchOpen(true)}
            placeholder="Search products, orders #, clients, coupons..."
            className="w-full pl-10 pr-9 py-2 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-200 rounded-lg text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults(null);
                setIsSearchOpen(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live Search Results Dropdown */}
        {isSearchOpen && searchResults && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden z-50 max-h-96 overflow-y-auto">
            <div className="p-2 border-b border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500 bg-neutral-50/50">
              <span className="font-semibold uppercase tracking-wider">Search Results</span>
              <span>
                {(searchResults.products?.length || 0) +
                  (searchResults.orders?.length || 0) +
                  (searchResults.customers?.length || 0) +
                  (searchResults.coupons?.length || 0)}{' '}
                found
              </span>
            </div>

            {/* Products */}
            {searchResults.products?.length > 0 && (
              <div className="p-2">
                <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 px-2 py-1">
                  Products ({searchResults.products.length})
                </p>
                {searchResults.products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onNavigate('/admin/products');
                      setIsSearchOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-2 hover:bg-neutral-50 rounded-lg text-left text-xs transition-colors"
                  >
                    <img
                      src={p.images?.[0] || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100'}
                      alt=""
                      className="w-8 h-10 object-cover rounded bg-neutral-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 truncate">{p.name}</p>
                      <p className="text-[10px] text-neutral-500 font-mono">
                        SKU: {p.sku} &bull; ${p.price} &bull; Stock: {p.stock}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Orders */}
            {searchResults.orders?.length > 0 && (
              <div className="p-2 border-t border-neutral-100">
                <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 px-2 py-1">
                  Orders ({searchResults.orders.length})
                </p>
                {searchResults.orders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      onNavigate('/admin/orders');
                      setIsSearchOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2 hover:bg-neutral-50 rounded-lg text-left text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-neutral-500" />
                      <div>
                        <p className="font-medium text-neutral-900 font-mono">#{o.orderNumber}</p>
                        <p className="text-[10px] text-neutral-500">
                          {o.userName} &bull; ${o.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] rounded bg-neutral-100 text-neutral-700 font-medium">
                      {o.orderStatus}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Customers */}
            {searchResults.customers?.length > 0 && (
              <div className="p-2 border-t border-neutral-100">
                <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 px-2 py-1">
                  Customers ({searchResults.customers.length})
                </p>
                {searchResults.customers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onNavigate('/admin/customers');
                      setIsSearchOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-2 hover:bg-neutral-50 rounded-lg text-left text-xs transition-colors"
                  >
                    <Users className="w-4 h-4 text-neutral-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 truncate">{c.name}</p>
                      <p className="text-[10px] text-neutral-500 truncate">{c.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Coupons */}
            {searchResults.coupons?.length > 0 && (
              <div className="p-2 border-t border-neutral-100">
                <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 px-2 py-1">
                  Coupons ({searchResults.coupons.length})
                </p>
                {searchResults.coupons.map((cp) => (
                  <button
                    key={cp.id}
                    onClick={() => {
                      onNavigate('/admin/coupons');
                      setIsSearchOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2 hover:bg-neutral-50 rounded-lg text-left text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-neutral-500" />
                      <span className="font-mono font-bold text-neutral-900">{cp.code}</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-medium">
                      {cp.discountType === 'percentage' ? `${cp.discountValue}% OFF` : `$${cp.discountValue} OFF`}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions, Notifications & Quick Shortcuts */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh All Atelier Data"
          className="p-2 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 rounded-lg transition-colors border border-transparent hover:border-neutral-200"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-neutral-900' : ''}`} />
        </button>

        {/* Quick New Product Button */}
        {onOpenNewProduct && (
          <button
            onClick={onOpenNewProduct}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium tracking-wider uppercase transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Product</span>
          </button>
        )}

        {/* Notifications Popover */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 rounded-lg transition-colors"
            aria-label="View Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-3 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-neutral-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-rose-100 text-rose-700 font-mono font-semibold rounded">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-neutral-600 hover:text-neutral-900 font-medium hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-400">
                    No active notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.link) onNavigate(n.link);
                      }}
                      className={`p-3 text-xs hover:bg-neutral-50 transition-colors cursor-pointer flex gap-3 ${
                        !n.isRead ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        {n.type === 'order' && <ShoppingBag className="w-4 h-4 text-emerald-600" />}
                        {n.type === 'stock' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                        {n.type === 'review' && <Tag className="w-4 h-4 text-purple-600" />}
                        {n.type === 'message' && <Bell className="w-4 h-4 text-sky-600" />}
                        {n.type === 'customer' && <Users className="w-4 h-4 text-blue-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 truncate">{n.title}</p>
                        <p className="text-neutral-500 text-[11px] line-clamp-2 mt-0.5">{n.message}</p>
                        <p className="text-[9px] text-neutral-400 font-mono mt-1">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-neutral-100 text-center bg-neutral-50/50">
                <button
                  onClick={() => {
                    setIsNotifOpen(false);
                    onNavigate('/admin/notifications');
                  }}
                  className="text-xs text-neutral-700 hover:text-neutral-950 font-medium hover:underline"
                >
                  View All System Alerts &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Storefront Link button */}
        <button
          onClick={() => onNavigate('/')}
          className="hidden md:flex items-center gap-1.5 px-3 py-2 border border-neutral-200 hover:border-neutral-400 text-neutral-700 hover:text-black rounded-lg text-xs font-medium transition-colors"
        >
          <span>Storefront</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
