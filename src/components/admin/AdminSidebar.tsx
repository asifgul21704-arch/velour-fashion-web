import React from 'react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Users,
  Archive,
  CreditCard,
  Tag,
  Star,
  Heart,
  TrendingUp,
  Mail,
  Image as ImageIcon,
  FileText,
  MessageSquare,
  Bell,
  Settings,
  ShieldAlert,
  UserCheck,
  ExternalLink,
  LogOut,
  ChevronRight,
  Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

export type AdminRoute =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'orders'
  | 'customers'
  | 'inventory'
  | 'payments'
  | 'coupons'
  | 'reviews'
  | 'wishlist'
  | 'analytics'
  | 'marketing'
  | 'banners'
  | 'pages'
  | 'contact-messages'
  | 'notifications'
  | 'settings'
  | 'activity'
  | 'profile';

interface AdminSidebarProps {
  currentRoute: AdminRoute;
  onNavigate: (route: AdminRoute | string) => void;
  badgeCounts?: {
    pendingOrders?: number;
    lowStock?: number;
    pendingReviews?: number;
    unreadMessages?: number;
    unreadNotifications?: number;
  };
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({
  currentRoute,
  onNavigate,
  badgeCounts = {},
  isMobileOpen = false,
  onCloseMobile
}: AdminSidebarProps) {
  const { user, logout } = useAuth();

  const handleRouteClick = (route: AdminRoute) => {
    onNavigate(`/admin/${route}`);
    if (onCloseMobile) onCloseMobile();
  };

  const navGroups = [
    {
      title: 'CORE PLATFORM',
      items: [
        { id: 'dashboard' as AdminRoute, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'products' as AdminRoute, label: 'Products', icon: Package },
        { id: 'categories' as AdminRoute, label: 'Categories', icon: FolderTree },
        {
          id: 'inventory' as AdminRoute,
          label: 'Inventory',
          icon: Archive,
          badge: badgeCounts.lowStock ? `${badgeCounts.lowStock}` : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        },
      ]
    },
    {
      title: 'COMMERCE & SALES',
      items: [
        {
          id: 'orders' as AdminRoute,
          label: 'Orders',
          icon: ShoppingBag,
          badge: badgeCounts.pendingOrders ? `${badgeCounts.pendingOrders}` : undefined,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        },
        { id: 'customers' as AdminRoute, label: 'Customers', icon: Users },
        { id: 'payments' as AdminRoute, label: 'Payments & Refunds', icon: CreditCard },
      ]
    },
    {
      title: 'GROWTH & COMMUNITY',
      items: [
        { id: 'coupons' as AdminRoute, label: 'Coupons & Vouchers', icon: Tag },
        {
          id: 'reviews' as AdminRoute,
          label: 'Customer Reviews',
          icon: Star,
          badge: badgeCounts.pendingReviews ? `${badgeCounts.pendingReviews}` : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        },
        { id: 'wishlist' as AdminRoute, label: 'Wishlist Analytics', icon: Heart },
        { id: 'analytics' as AdminRoute, label: 'Store Analytics', icon: TrendingUp },
      ]
    },
    {
      title: 'MARKETING & CONTENT',
      items: [
        { id: 'marketing' as AdminRoute, label: 'Newsletter & Dispatch', icon: Mail },
        { id: 'banners' as AdminRoute, label: 'Hero Banners', icon: ImageIcon },
        { id: 'pages' as AdminRoute, label: 'Content Pages', icon: FileText },
        {
          id: 'contact-messages' as AdminRoute,
          label: 'Client Inquiries',
          icon: MessageSquare,
          badge: badgeCounts.unreadMessages ? `${badgeCounts.unreadMessages}` : undefined,
          badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30'
        },
      ]
    },
    {
      title: 'SYSTEM & ATELIER',
      items: [
        {
          id: 'notifications' as AdminRoute,
          label: 'Notifications',
          icon: Bell,
          badge: badgeCounts.unreadNotifications ? `${badgeCounts.unreadNotifications}` : undefined,
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
        },
        { id: 'settings' as AdminRoute, label: 'Store Settings', icon: Settings },
        { id: 'activity' as AdminRoute, label: 'Security Audit Trail', icon: ShieldAlert },
        { id: 'profile' as AdminRoute, label: 'Admin Profile', icon: UserCheck },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      <aside
        id="admin-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0C0E12] text-neutral-300 border-r border-neutral-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Atelier Brand Header */}
        <div className="h-20 px-6 border-b border-neutral-800/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl tracking-[0.2em] font-light text-white">VELOUR</span>
              <span className="px-1.5 py-0.5 text-[9px] font-semibold tracking-wider uppercase bg-amber-400/10 text-amber-300 border border-amber-400/30 rounded">
                PRO
              </span>
            </div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-neutral-500 font-mono mt-0.5">
              BUSINESS CONSOLE
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onNavigate('/')}
              title="Open Storefront"
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800/60 rounded transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Database Status Bar */}
        <div className="px-6 py-2.5 bg-neutral-900/60 border-b border-neutral-800/60 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-neutral-400 font-mono text-[10px] uppercase">
              LIVE PERSISTENCE
            </span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            <Database className="w-3 h-3" />
            <span>CONNECTED</span>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin scrollbar-thumb-neutral-800">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <h4 className="px-3 text-[10px] font-semibold tracking-[0.2em] text-neutral-500 uppercase">
                {group.title}
              </h4>
              <div className="space-y-0.5 pt-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentRoute === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleRouteClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium tracking-wide transition-all ${
                        isActive
                          ? 'bg-neutral-100 text-neutral-950 font-semibold shadow-sm'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-neutral-950' : 'text-neutral-400'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded border ${
                              isActive ? 'bg-neutral-900 text-white border-neutral-700' : item.badgeColor
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-neutral-950" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Admin Footer & Session Status */}
        <div className="p-4 border-t border-neutral-800/80 bg-neutral-900/40">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-300 text-black flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{user?.name || 'Administrator'}</p>
                <p className="text-[10px] text-neutral-500 truncate">{user?.email || 'admin@velour.com'}</p>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                onNavigate('/admin/login');
              }}
              title="Sign Out"
              className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => onNavigate('/')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[11px] font-medium tracking-wider uppercase bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded border border-neutral-700/50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Public Storefront</span>
          </button>
        </div>
      </aside>
    </>
  );
}
