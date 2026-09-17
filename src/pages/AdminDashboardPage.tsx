import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import {
  Product,
  Order,
  User,
  Category,
  Coupon,
  Review,
  Banner,
  AdminStats,
  OrderStatus,
  PaymentStatus
} from '../types.ts';
import { apiFetch } from '../lib/api.ts';

// Admin Components
import { AdminSidebar, AdminRoute } from '../components/admin/AdminSidebar.tsx';
import { AdminHeader } from '../components/admin/AdminHeader.tsx';

// Sections
import { DashboardOverview } from '../components/admin/sections/DashboardOverview.tsx';
import { ProductsManager } from '../components/admin/sections/ProductsManager.tsx';
import { OrdersManager } from '../components/admin/sections/OrdersManager.tsx';
import { CategoriesManager } from '../components/admin/sections/CategoriesManager.tsx';
import { CustomersManager } from '../components/admin/sections/CustomersManager.tsx';
import { InventoryManager } from '../components/admin/sections/InventoryManager.tsx';
import { PaymentsManager } from '../components/admin/sections/PaymentsManager.tsx';
import { CouponsManager } from '../components/admin/sections/CouponsManager.tsx';
import { ReviewsManager } from '../components/admin/sections/ReviewsManager.tsx';
import { WishlistManager } from '../components/admin/sections/WishlistManager.tsx';
import { AnalyticsManager } from '../components/admin/sections/AnalyticsManager.tsx';
import { MarketingManager } from '../components/admin/sections/MarketingManager.tsx';
import { BannersManager } from '../components/admin/sections/BannersManager.tsx';
import { PagesManager } from '../components/admin/sections/PagesManager.tsx';
import { ContactMessagesManager } from '../components/admin/sections/ContactMessagesManager.tsx';
import { ActivityLogsManager } from '../components/admin/sections/ActivityLogsManager.tsx';
import { StoreSettingsManager } from '../components/admin/sections/StoreSettingsManager.tsx';
import { AdminProfileManager } from '../components/admin/sections/AdminProfileManager.tsx';

interface AdminDashboardPageProps {
  onNavigate: (path: string) => void;
  currentPath?: string;
}

export function AdminDashboardPage({ onNavigate, currentPath = '/admin/dashboard' }: AdminDashboardPageProps) {
  const { user, isAdmin, isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  // Determine current admin route from pathname
  const currentRoute: AdminRoute = useMemo(() => {
    const clean = currentPath.split('?')[0];
    if (clean === '/admin' || clean === '/admin/' || clean === '/admin/dashboard') {
      return 'dashboard';
    }
    const sub = clean.replace('/admin/', '') as AdminRoute;
    const validRoutes: AdminRoute[] = [
      'dashboard',
      'products',
      'categories',
      'orders',
      'customers',
      'inventory',
      'payments',
      'coupons',
      'reviews',
      'wishlist',
      'analytics',
      'marketing',
      'banners',
      'pages',
      'contact-messages',
      'notifications',
      'settings',
      'activity',
      'profile'
    ];
    return validRoutes.includes(sub) ? sub : 'dashboard';
  }, [currentPath]);

  // Mobile sidebar drawer
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Global Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Core Data Stores
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);

  // Modals & Selected items state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [quickRestockProduct, setQuickRestockProduct] = useState<Product | null>(null);

  // Security guard
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      showToast('Administrative authorization required.', 'error');
      onNavigate('/admin/login');
    }
  }, [authLoading, isAuthenticated, isAdmin, onNavigate, showToast]);

  // Load all primary datasets in parallel
  const loadAllData = useCallback(async () => {
    if (!isAdmin) return;
    setIsRefreshing(true);
    try {
      const [
        statsRes,
        prodRes,
        ordRes,
        catRes,
        custRes,
        coupRes,
        revRes,
        banRes
      ] = await Promise.all([
        apiFetch('/api/admin/stats'),
        apiFetch('/api/admin/products'),
        apiFetch('/api/admin/orders'),
        apiFetch('/api/admin/categories'),
        apiFetch('/api/admin/customers'),
        apiFetch('/api/admin/coupons'),
        apiFetch('/api/admin/reviews'),
        apiFetch('/api/admin/banners')
      ]);

      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d.stats);
      }
      if (prodRes.ok) {
        const d = await prodRes.json();
        setProducts(d.products || []);
      }
      if (ordRes.ok) {
        const d = await ordRes.json();
        setOrders(d.orders || []);
      }
      if (catRes.ok) {
        const d = await catRes.json();
        setCategories(d.categories || []);
      }
      if (custRes.ok) {
        const d = await custRes.json();
        setCustomers(d.customers || []);
      }
      if (coupRes.ok) {
        const d = await coupRes.json();
        setCoupons(d.coupons || []);
      }
      if (revRes.ok) {
        const d = await revRes.json();
        setReviews(d.reviews || []);
      }
      if (banRes.ok) {
        const d = await banRes.json();
        setBanners(d.banners || []);
      }
    } catch (err) {
      console.error('Data retrieval failed', err);
      showToast('Failed to synchronize atelier database.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [isAdmin, showToast]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Navigation handler
  const handleNavigate = (routeOrPath: string) => {
    if (routeOrPath.startsWith('/')) {
      onNavigate(routeOrPath);
    } else {
      onNavigate(`/admin/${routeOrPath}`);
    }
    setIsMobileSidebarOpen(false);
  };

  // Badge counts for sidebar
  const pendingOrdersCount = orders.filter(
    (o) => o.orderStatus === 'Pending' || o.orderStatus === 'Processing'
  ).length;
  const lowStockCount = products.filter(
    (p) => p.stock <= (p.lowStockThreshold || 5)
  ).length;
  const pendingReviewsCount = reviews.filter((r) => r.status === 'pending').length;

  // ----------------------------------------------------
  // PRODUCT OPERATIONS
  // ----------------------------------------------------
  const handleCreateProduct = async (productData: any): Promise<boolean> => {
    try {
      const res = await apiFetch('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });
      if (res.ok) {
        const d = await res.json();
        setProducts((prev) => [d.product, ...prev]);
        showToast(`Piece "${d.product.name}" created and published.`, 'success');
        return true;
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to create product.', 'error');
        return false;
      }
    } catch (e) {
      showToast('Network error while saving product.', 'error');
      return false;
    }
  };

  const handleUpdateProduct = async (id: string, updates: any): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const d = await res.json();
        setProducts((prev) => prev.map((p) => (p.id === id ? d.product : p)));
        showToast('Product updated successfully in MongoDB.', 'success');
        return true;
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update product.', 'error');
        return false;
      }
    } catch (e) {
      showToast('Network error while updating product.', 'error');
      return false;
    }
  };

  const handleDeleteProduct = async (id: string): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        showToast('Product permanently deleted from catalog.', 'info');
        return true;
      }
      return false;
    } catch (e) {
      showToast('Error deleting product.', 'error');
      return false;
    }
  };

  const handleDuplicateProduct = async (id: string): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/admin/products/${id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        const d = await res.json();
        setProducts((prev) => [d.product, ...prev]);
        showToast(`Duplicated into "${d.product.name}".`, 'success');
        return true;
      }
      return false;
    } catch (e) {
      showToast('Error duplicating piece.', 'error');
      return false;
    }
  };

  const handleBulkActionProducts = async (
    ids: string[],
    action: 'activate' | 'deactivate' | 'delete'
  ): Promise<boolean> => {
    try {
      const res = await apiFetch('/api/admin/products/bulk', {
        method: 'POST',
        body: JSON.stringify({ ids, action })
      });
      if (res.ok) {
        if (action === 'delete') {
          setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
        } else {
          const activeVal = action === 'activate';
          setProducts((prev) =>
            prev.map((p) => (ids.includes(p.id) ? { ...p, isActive: activeVal } : p))
          );
        }
        showToast(`Bulk action "${action}" completed for ${ids.length} pieces.`, 'success');
        return true;
      }
      return false;
    } catch (e) {
      showToast('Bulk operation failed.', 'error');
      return false;
    }
  };

  // ----------------------------------------------------
  // ORDER OPERATIONS
  // ----------------------------------------------------
  const handleUpdateOrderStatus = async (
    id: string,
    orderStatus: OrderStatus,
    paymentStatus?: PaymentStatus,
    note?: string
  ): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/admin/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ orderStatus, paymentStatus, note })
      });
      if (res.ok) {
        const d = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === id ? d.order : o)));
        if (selectedOrder && selectedOrder.id === id) {
          setSelectedOrder(d.order);
        }
        showToast(`Order #${d.order.orderNumber} status updated to ${orderStatus}.`, 'success');
        return true;
      }
      return false;
    } catch (e) {
      showToast('Failed to update order status.', 'error');
      return false;
    }
  };

  const handleRefundOrder = async (
    id: string,
    amount: number,
    reason: string
  ): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/admin/orders/${id}/refund`, {
        method: 'POST',
        body: JSON.stringify({ amount, reason })
      });
      if (res.ok) {
        const d = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === id ? d.order : o)));
        if (selectedOrder && selectedOrder.id === id) {
          setSelectedOrder(d.order);
        }
        showToast(`Refund of $${amount.toFixed(2)} disbursed successfully.`, 'success');
        return true;
      }
      return false;
    } catch (e) {
      showToast('Refund transaction failed.', 'error');
      return false;
    }
  };

  // ----------------------------------------------------
  // CATEGORIES OPERATIONS
  // ----------------------------------------------------
  const handleCreateCategory = async (data: any): Promise<boolean> => {
    try {
      const res = await apiFetch('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const d = await res.json();
        setCategories((prev) => [...prev, d.category]);
        showToast(`Category "${d.category.name}" created.`, 'success');
        return true;
      }
      return false;
    } catch (e) {
      showToast('Failed to create category.', 'error');
      return false;
    }
  };

  const handleUpdateCategory = async (id: string, updates: any): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const d = await res.json();
        setCategories((prev) => prev.map((c) => (c.id === id ? d.category : c)));
        showToast('Category updated.', 'success');
        return true;
      }
      return false;
    } catch (e) {
      showToast('Failed to update category.', 'error');
      return false;
    }
  };

  const handleDeleteCategory = async (id: string): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        showToast('Category deleted.', 'info');
        return true;
      }
      return false;
    } catch (e) {
      showToast('Failed to delete category.', 'error');
      return false;
    }
  };

  const handleToggleCategory = async (id: string): Promise<boolean> => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return false;
    return handleUpdateCategory(id, { isActive: !cat.isActive });
  };

  // ----------------------------------------------------
  // CUSTOMER OPERATIONS
  // ----------------------------------------------------
  const handleToggleCustomerStatus = async (id: string): Promise<boolean> => {
    const cust = customers.find((c) => c.id === id);
    if (!cust) return false;
    try {
      const res = await apiFetch(`/api/admin/customers/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !cust.isActive })
      });
      if (res.ok) {
        const d = await res.json();
        setCustomers((prev) => prev.map((c) => (c.id === id ? d.customer : c)));
        showToast(`Account status updated for ${cust.name}.`, 'success');
        return true;
      }
      return false;
    } catch (e) {
      showToast('Failed to update client status.', 'error');
      return false;
    }
  };

  // ----------------------------------------------------
  // INVENTORY OPERATIONS
  // ----------------------------------------------------
  const handleAdjustStock = async (
    productId: string,
    change: number,
    type: string,
    reason: string
  ): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/admin/products/${productId}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ change, type, reason })
      });
      if (res.ok) {
        const d = await res.json();
        setProducts((prev) => prev.map((p) => (p.id === productId ? d.product : p)));
        showToast(
          `Stock adjusted to ${d.product.stock} units for "${d.product.name}".`,
          'success'
        );
        return true;
      }
      return false;
    } catch (e) {
      showToast('Failed to adjust warehouse stock.', 'error');
      return false;
    }
  };

  // ----------------------------------------------------
  // COUPONS OPERATIONS
  // ----------------------------------------------------
  const handleCreateCoupon = async (data: any): Promise<boolean> => {
    try {
      const res = await apiFetch('/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const d = await res.json();
        setCoupons((prev) => [...prev, d.coupon]);
        showToast(`Promo code "${d.coupon.code}" activated.`, 'success');
        return true;
      }
      return false;
    } catch (e) {
      showToast('Failed to create coupon.', 'error');
      return false;
    }
  };

  const handleUpdateCoupon = async (id: string, updates: any): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/admin/coupons/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const d = await res.json();
        setCoupons((prev) => prev.map((c) => (c.id === id ? d.coupon : c)));
        showToast('Promo code updated.', 'success');
        return true;
      }
      return false;
    } catch (e) {
      showToast('Failed to update promo.', 'error');
      return false;
    }
  };

  const handleDeleteCoupon = async (id: string): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        showToast('Promo code removed.', 'info');
        return true;
      }
      return false;
    } catch (e) {
      showToast('Failed to delete coupon.', 'error');
      return false;
    }
  };

  // ----------------------------------------------------
  // REVIEWS OPERATIONS
  // ----------------------------------------------------
  const handleUpdateReviewStatus = async (
    id: string,
    status: 'approved' | 'rejected' | 'pending'
  ): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/admin/reviews/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const d = await res.json();
        setReviews((prev) => prev.map((r) => (r.id === id ? d.review : r)));
        showToast(`Review marked as ${status}.`, 'success');
        return true;
      }
      return false;
    } catch (e) {
      showToast('Failed to update review moderation.', 'error');
      return false;
    }
  };

  const handleDeleteReview = async (id: string): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        showToast('Review permanently deleted.', 'info');
        return true;
      }
      return false;
    } catch (e) {
      showToast('Failed to delete review.', 'error');
      return false;
    }
  };

  // ----------------------------------------------------
  // BANNERS OPERATIONS
  // ----------------------------------------------------
  const handleCreateBanner = async (data: any): Promise<boolean> => {
    try {
      const res = await apiFetch('/api/admin/banners', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const d = await res.json();
        setBanners((prev) => [...prev, d.banner]);
        showToast(`Banner "${d.banner.title}" published.`, 'success');
        return true;
      }
      return false;
    } catch (e) {
      showToast('Failed to save banner.', 'error');
      return false;
    }
  };

  const handleUpdateBanner = async (id: string, updates: any): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/admin/banners/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const d = await res.json();
        setBanners((prev) => prev.map((b) => (b.id === id ? d.banner : b)));
        showToast('Banner updated.', 'success');
        return true;
      }
      return false;
    } catch (e) {
      showToast('Failed to update banner.', 'error');
      return false;
    }
  };

  const handleDeleteBanner = async (id: string): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/admin/banners/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBanners((prev) => prev.filter((b) => b.id !== id));
        showToast('Banner deleted.', 'info');
        return true;
      }
      return false;
    } catch (e) {
      showToast('Failed to delete banner.', 'error');
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100/70 text-neutral-900 font-sans flex antialiased selection:bg-neutral-900 selection:text-white">
      {/* 1. Unified Collapsible / Responsive Navigation Sidebar */}
      <AdminSidebar
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        badgeCounts={{
          pendingOrders: pendingOrdersCount,
          lowStock: lowStockCount,
          pendingReviews: pendingReviewsCount
        }}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
        {/* Top Sticky Header */}
        <AdminHeader
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          onRefresh={loadAllData}
          isRefreshing={isRefreshing}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenNewProduct={() => {
            setEditingProduct(null);
            setIsProductModalOpen(true);
            onNavigate('/admin/products');
          }}
        />

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
          {/* Dashboard Overview */}
          {currentRoute === 'dashboard' && (
            <DashboardOverview
              stats={stats}
              orders={orders}
              products={products}
              onNavigate={handleNavigate}
              onSelectOrder={(ord) => {
                setSelectedOrder(ord);
                handleNavigate('/admin/orders');
              }}
              onOpenNewProduct={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
                handleNavigate('/admin/products');
              }}
              onQuickRestock={(prod) => {
                setQuickRestockProduct(prod);
                handleNavigate('/admin/inventory');
              }}
            />
          )}

          {/* Products */}
          {currentRoute === 'products' && (
            <ProductsManager
              products={products}
              onRefresh={loadAllData}
              onCreateProduct={handleCreateProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onDuplicateProduct={handleDuplicateProduct}
              onBulkAction={handleBulkActionProducts}
              isModalOpen={isProductModalOpen}
              onOpenModal={() => setIsProductModalOpen(true)}
              onCloseModal={() => {
                setIsProductModalOpen(false);
                setEditingProduct(null);
              }}
              editingProduct={editingProduct}
              setEditingProduct={setEditingProduct}
            />
          )}

          {/* Categories */}
          {currentRoute === 'categories' && (
            <CategoriesManager
              categories={categories}
              products={products}
              onRefresh={loadAllData}
              onCreateCategory={handleCreateCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              onToggleCategory={handleToggleCategory}
            />
          )}

          {/* Orders */}
          {currentRoute === 'orders' && (
            <OrdersManager
              orders={orders}
              onRefresh={loadAllData}
              onUpdateStatus={handleUpdateOrderStatus}
              onRefundOrder={handleRefundOrder}
              selectedOrder={selectedOrder}
              setSelectedOrder={setSelectedOrder}
            />
          )}

          {/* Customers */}
          {currentRoute === 'customers' && (
            <CustomersManager
              customers={customers}
              orders={orders}
              onRefresh={loadAllData}
              onToggleCustomerStatus={handleToggleCustomerStatus}
            />
          )}

          {/* Inventory */}
          {currentRoute === 'inventory' && (
            <InventoryManager
              products={products}
              onRefresh={loadAllData}
              onAdjustStock={handleAdjustStock}
              quickRestockProduct={quickRestockProduct}
              setQuickRestockProduct={setQuickRestockProduct}
            />
          )}

          {/* Payments */}
          {currentRoute === 'payments' && (
            <PaymentsManager
              orders={orders}
              onRefundOrder={handleRefundOrder}
              onSelectOrder={(o) => {
                setSelectedOrder(o);
                handleNavigate('/admin/orders');
              }}
            />
          )}

          {/* Coupons */}
          {currentRoute === 'coupons' && (
            <CouponsManager
              coupons={coupons}
              onRefresh={loadAllData}
              onCreateCoupon={handleCreateCoupon}
              onUpdateCoupon={handleUpdateCoupon}
              onDeleteCoupon={handleDeleteCoupon}
            />
          )}

          {/* Reviews */}
          {currentRoute === 'reviews' && (
            <ReviewsManager
              reviews={reviews}
              products={products}
              onRefresh={loadAllData}
              onUpdateStatus={handleUpdateReviewStatus}
              onDeleteReview={handleDeleteReview}
            />
          )}

          {/* Wishlist Intelligence */}
          {currentRoute === 'wishlist' && (
            <WishlistManager
              products={products}
              onNavigate={handleNavigate}
            />
          )}

          {/* Analytics */}
          {currentRoute === 'analytics' && (
            <AnalyticsManager
              orders={orders}
              products={products}
            />
          )}

          {/* Marketing */}
          {currentRoute === 'marketing' && (
            <MarketingManager />
          )}

          {/* Banners */}
          {currentRoute === 'banners' && (
            <BannersManager
              banners={banners}
              onRefresh={loadAllData}
              onCreateBanner={handleCreateBanner}
              onUpdateBanner={handleUpdateBanner}
              onDeleteBanner={handleDeleteBanner}
            />
          )}

          {/* Pages */}
          {currentRoute === 'pages' && (
            <PagesManager />
          )}

          {/* Contact Messages */}
          {currentRoute === 'contact-messages' && (
            <ContactMessagesManager />
          )}

          {/* Notifications */}
          {currentRoute === 'notifications' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                <h2 className="font-serif text-2xl font-light text-neutral-900">
                  System Alerts & Notifications
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Automated telemetry alerts for orders, inventory threshold alerts, and customer messages
                </p>
              </div>
              <ActivityLogsManager />
            </div>
          )}

          {/* Settings */}
          {currentRoute === 'settings' && (
            <StoreSettingsManager />
          )}

          {/* Activity / Audit */}
          {currentRoute === 'activity' && (
            <ActivityLogsManager />
          )}

          {/* Profile */}
          {currentRoute === 'profile' && (
            <AdminProfileManager />
          )}
        </main>
      </div>
    </div>
  );
}
