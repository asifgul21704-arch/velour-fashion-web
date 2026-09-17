import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { WishlistProvider } from './context/WishlistContext.tsx';

// Layout Components
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';

// Pages
import { HomePage } from './pages/HomePage.tsx';
import { CatalogPage } from './pages/CatalogPage.tsx';
import { ProductDetailPage } from './pages/ProductDetailPage.tsx';
import { SearchPage } from './pages/SearchPage.tsx';
import { CartPage } from './pages/CartPage.tsx';
import { CheckoutPage } from './pages/CheckoutPage.tsx';
import { OrderSuccessPage } from './pages/OrderSuccessPage.tsx';
import { WishlistPage } from './pages/WishlistPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { SignupPage } from './pages/SignupPage.tsx';
import { AccountPage } from './pages/AccountPage.tsx';
import { OrderHistoryPage } from './pages/OrderHistoryPage.tsx';
import { AdminLoginPage } from './pages/AdminLoginPage.tsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.tsx';
import { AboutPage, ContactPage, PrivacyPolicyPage, TermsPage } from './pages/StaticPages.tsx';

function MainRouter() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname + window.location.search);

  // Sync state with browser history (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (path !== currentPath) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Parse path & search params
  const [pathname, searchStr] = currentPath.split('?');
  const searchParams = new URLSearchParams(searchStr || '');

  const renderContent = () => {
    // 1. Home
    if (pathname === '/' || pathname === '') {
      return <HomePage onNavigate={navigate} />;
    }

    // 2. Women's Catalog
    if (pathname === '/women') {
      return <CatalogPage gender="women" onNavigate={navigate} />;
    }

    // 3. Men's Catalog
    if (pathname === '/men') {
      return <CatalogPage gender="men" onNavigate={navigate} />;
    }

    // 4. Product Details: /product/:id
    if (pathname.startsWith('/product/')) {
      const productId = pathname.replace('/product/', '');
      return <ProductDetailPage productId={productId} onNavigate={navigate} />;
    }

    // 5. Search
    if (pathname === '/search') {
      const q = searchParams.get('q') || '';
      return <SearchPage initialQuery={q} onNavigate={navigate} />;
    }

    // 6. Cart
    if (pathname === '/cart') {
      return <CartPage onNavigate={navigate} />;
    }

    // 7. Checkout
    if (pathname === '/checkout') {
      return <CheckoutPage onNavigate={navigate} />;
    }

    // 8. Order Success: /order-success/:id
    if (pathname.startsWith('/order-success/')) {
      const orderId = pathname.replace('/order-success/', '');
      return <OrderSuccessPage orderId={orderId} onNavigate={navigate} />;
    }

    // 9. Wishlist
    if (pathname === '/wishlist') {
      return <WishlistPage onNavigate={navigate} />;
    }

    // 10. Account Pages
    if (pathname === '/account') {
      return <AccountPage onNavigate={navigate} />;
    }
    if (pathname === '/account/orders') {
      return <OrderHistoryPage onNavigate={navigate} />;
    }

    // 11. Auth Pages
    if (pathname === '/login') {
      const redirect = searchParams.get('redirect') || '/account';
      return <LoginPage onNavigate={navigate} redirectPath={redirect} />;
    }
    if (pathname === '/signup') {
      return <SignupPage onNavigate={navigate} />;
    }

    // 12. Admin Pages
    if (pathname === '/admin/login') {
      return <AdminLoginPage onNavigate={navigate} />;
    }
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      return <AdminDashboardPage onNavigate={navigate} currentPath={pathname} />;
    }

    // 13. Static Info Pages
    if (pathname === '/about') {
      return <AboutPage onNavigate={navigate} />;
    }
    if (pathname === '/contact') {
      return <ContactPage onNavigate={navigate} />;
    }
    if (pathname === '/privacy') {
      return <PrivacyPolicyPage />;
    }
    if (pathname === '/terms') {
      return <TermsPage />;
    }

    // Fallback 404
    return (
      <div className="max-w-2xl mx-auto px-4 py-32 text-center space-y-4">
        <span className="text-xs uppercase tracking-[0.3em] text-neutral-400 font-semibold block">
          404 Archive Notice
        </span>
        <h1 className="font-serif text-4xl text-neutral-900">Page Not Found</h1>
        <p className="text-xs uppercase tracking-widest text-neutral-500">
          The requested atelier URL could not be located in our index.
        </p>
        <div className="pt-4">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-black text-white text-xs uppercase tracking-widest font-semibold hover:bg-neutral-800 transition-colors"
          >
            Return to Storefront
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-neutral-900 selection:bg-neutral-900 selection:text-white">
      <Navbar currentPath={pathname} onNavigate={navigate} />
      <main className="flex-1">
        {renderContent()}
      </main>
      <Footer onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <MainRouter />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
