import React, { useState, useRef, useEffect } from 'react';
import { Search, User as UserIcon, Heart, ShoppingBag, Menu, X, Shield, LogOut, Package, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';
import { QuickSearchModal } from './QuickSearchModal.tsx';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function Navbar({ currentPath, onNavigate }: NavbarProps) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const { wishlistIds } = useWishlist();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const accountRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNav = (path: string) => {
    onNavigate(path);
    setIsMobileMenuOpen(false);
    setIsAccountOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setIsAccountOpen(false);
    onNavigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-100 transition-all duration-200">
        {/* Top announcement bar */}
        <div className="bg-[#121212] text-white text-[11px] uppercase tracking-[0.2em] py-2 px-4 text-center font-medium">
          Complimentary worldwide shipping on orders over $250 &bull; Privilege code: <span className="font-semibold text-neutral-300">VELOUR10</span>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Mobile hamburger */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 -ml-2 text-neutral-800 hover:text-neutral-500 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Left: Main Navigation - ONLY Home, Women, Men */}
          <nav className="hidden md:flex items-center space-x-10 text-xs uppercase tracking-[0.25em] font-medium text-neutral-800">
            <button
              onClick={() => handleNav('/')}
              className={`hover:text-black transition-colors relative py-1 ${
                currentPath === '/' ? 'text-black font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-black' : 'text-neutral-600'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleNav('/women')}
              className={`hover:text-black transition-colors relative py-1 ${
                currentPath === '/women' ? 'text-black font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-black' : 'text-neutral-600'
              }`}
            >
              Women
            </button>
            <button
              onClick={() => handleNav('/men')}
              className={`hover:text-black transition-colors relative py-1 ${
                currentPath === '/men' ? 'text-black font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-black' : 'text-neutral-600'
              }`}
            >
              Men
            </button>
          </nav>

          {/* Center: Brand Logo */}
          <div className="flex-1 md:flex-none text-center">
            <button
              onClick={() => handleNav('/')}
              className="font-serif text-2xl sm:text-3xl tracking-[0.28em] font-light uppercase text-neutral-900 hover:opacity-80 transition-opacity"
            >
              VELOUR
            </button>
          </div>

          {/* Right: Icons (Search, Account, Wishlist, Cart) */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-neutral-800 hover:text-black transition-colors"
              aria-label="Search items"
            >
              <Search className="w-5 h-5 stroke-[1.5]" />
            </button>

            {/* Account dropdown */}
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setIsAccountOpen(!isAccountOpen)}
                className="p-2 text-neutral-800 hover:text-black transition-colors flex items-center gap-1.5"
                aria-label="User account"
              >
                <UserIcon className="w-5 h-5 stroke-[1.5]" />
                {isAuthenticated && (
                  <span className="hidden lg:inline text-[11px] uppercase tracking-wider font-medium max-w-[80px] truncate">
                    {user?.name.split(' ')[0]}
                  </span>
                )}
              </button>

              {isAccountOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white shadow-2xl border border-neutral-100 py-2 z-50 text-neutral-850 animate-in fade-in duration-150">
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/70">
                        <p className="text-xs font-semibold text-neutral-900 truncate">{user?.name}</p>
                        <p className="text-[11px] text-neutral-500 truncate">{user?.email}</p>
                        {isAdmin && (
                          <span className="inline-block mt-1.5 px-2 py-0.5 bg-black text-white text-[10px] tracking-widest uppercase font-semibold">
                            Administrator
                          </span>
                        )}
                      </div>

                      <div className="py-1 text-xs tracking-wider uppercase">
                        <button
                          onClick={() => handleNav('/account')}
                          className="w-full text-left px-4 py-2.5 hover:bg-neutral-50 flex items-center gap-2.5 text-neutral-700 hover:text-black transition-colors"
                        >
                          <UserCircle className="w-4 h-4" />
                          <span>My Account</span>
                        </button>
                        <button
                          onClick={() => handleNav('/account/orders')}
                          className="w-full text-left px-4 py-2.5 hover:bg-neutral-50 flex items-center gap-2.5 text-neutral-700 hover:text-black transition-colors"
                        >
                          <Package className="w-4 h-4" />
                          <span>Order History</span>
                        </button>
                        <button
                          onClick={() => handleNav('/wishlist')}
                          className="w-full text-left px-4 py-2.5 hover:bg-neutral-50 flex items-center gap-2.5 text-neutral-700 hover:text-black transition-colors"
                        >
                          <Heart className="w-4 h-4" />
                          <span>Wishlist ({wishlistIds.length})</span>
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => handleNav('/admin')}
                            className="w-full text-left px-4 py-2.5 bg-neutral-100/70 hover:bg-neutral-100 flex items-center gap-2.5 text-black font-semibold transition-colors"
                          >
                            <Shield className="w-4 h-4 text-black" />
                            <span>Admin Portal</span>
                          </button>
                        )}
                      </div>

                      <div className="border-t border-neutral-100 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2.5 text-xs uppercase tracking-wider text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-3 text-xs tracking-wider uppercase space-y-2">
                      <button
                        onClick={() => handleNav('/login')}
                        className="w-full py-2.5 bg-black text-white text-center hover:bg-neutral-800 transition-colors font-medium block"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => handleNav('/signup')}
                        className="w-full py-2 border border-neutral-300 text-neutral-800 text-center hover:bg-neutral-50 transition-colors block"
                      >
                        Create Account
                      </button>
                      <div className="pt-2 border-t border-neutral-100 text-center">
                        <button
                          onClick={() => handleNav('/admin/login')}
                          className="text-[10px] tracking-widest text-neutral-400 hover:text-black transition-colors"
                        >
                          Staff & Admin Sign-in
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Wishlist */}
            <button
              onClick={() => handleNav('/wishlist')}
              className="p-2 text-neutral-800 hover:text-black transition-colors relative"
              aria-label="Wishlist items"
            >
              <Heart className="w-5 h-5 stroke-[1.5]" />
              {wishlistIds.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-black text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {wishlistIds.length}
                </span>
              )}
            </button>

            {/* Cart */}
            <button
              onClick={() => handleNav('/cart')}
              className="p-2 text-neutral-800 hover:text-black transition-colors relative"
              aria-label="Shopping bag"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-black text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-neutral-200 px-6 py-6 animate-in slide-in-from-top duration-200">
            <nav className="flex flex-col space-y-4 text-sm uppercase tracking-[0.25em] font-medium text-neutral-900">
              <button
                onClick={() => handleNav('/')}
                className="text-left py-2 border-b border-neutral-100"
              >
                Home
              </button>
              <button
                onClick={() => handleNav('/women')}
                className="text-left py-2 border-b border-neutral-100"
              >
                Women
              </button>
              <button
                onClick={() => handleNav('/men')}
                className="text-left py-2 border-b border-neutral-100"
              >
                Men
              </button>
              <div className="pt-4 flex flex-col space-y-3 text-xs tracking-widest text-neutral-500">
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => handleNav('/account')}
                      className="text-left py-1 text-black font-semibold"
                    >
                      My Account ({user?.name})
                    </button>
                    <button
                      onClick={() => handleNav('/account/orders')}
                      className="text-left py-1"
                    >
                      Order History
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleNav('/admin')}
                        className="text-left py-1 text-black font-bold"
                      >
                        Admin Portal
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="text-left py-1 text-rose-600"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleNav('/login')}
                      className="flex-1 py-2.5 bg-black text-white text-center font-medium"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => handleNav('/signup')}
                      className="flex-1 py-2.5 border border-neutral-300 text-center font-medium"
                    >
                      Register
                    </button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Global Quick Search Overlay */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNav}
      />
    </>
  );
}
