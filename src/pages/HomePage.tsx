import React, { useEffect, useState, useRef } from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Truck, RotateCcw, Pause, Play } from 'lucide-react';
import { Product } from '../types.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { apiFetch } from '../lib/api.ts';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { showToast } = useToast();

  const toggleVideoPlayback = () => {
    if (!videoRef.current) return;
    if (isVideoPlaying) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsVideoPlaying(true)).catch(() => setIsVideoPlaying(false));
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().then(() => setIsVideoPlaying(true)).catch(() => {
        setIsVideoPlaying(false);
      });
    }
  }, []);

  useEffect(() => {
    async function loadHomeProducts() {
      try {
        const [featRes, newRes] = await Promise.all([
          apiFetch('/api/products?featured=true'),
          apiFetch('/api/products?newArrival=true')
        ]);

        if (featRes.ok) {
          const d = await featRes.json();
          setFeaturedProducts(d.products.slice(0, 4));
        }
        if (newRes.ok) {
          const d = await newRes.json();
          setNewArrivals(d.products.slice(0, 4));
        }
      } catch (err) {
        console.error('Error fetching home products', err);
      } finally {
        setLoading(false);
      }
    }

    loadHomeProducts();
  }, []);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiFetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Subscribed successfully', 'success');
        setNewsletterEmail('');
      } else {
        showToast(data.error || 'Failed to subscribe', 'error');
      }
    } catch (e) {
      showToast('Network error during newsletter signup', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-20 sm:space-y-28 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative h-[85vh] sm:h-[90vh] w-full overflow-hidden bg-neutral-900 flex items-center justify-center">
        {/* Background Video with Dark Luxury Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            poster="/videos/hero-poster.jpg"
            className="w-full h-full object-cover object-[center_35%] filter brightness-[0.72] scale-105 transition-opacity duration-1000"
          >
            <source src="/videos/hero-background.mp4" type="video/mp4" />
            {/* Fallback image if video is unsupported */}
            <img
              src="/videos/hero-poster.jpg"
              alt="Velour Haute Collection"
              className="w-full h-full object-cover object-[center_30%] filter brightness-75 scale-105"
            />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/30 pointer-events-none" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-[11px] uppercase tracking-[0.25em] text-neutral-200">
            <Sparkles className="w-3.5 h-3.5 text-neutral-300" />
            <span>Autumn &bull; Winter Atelier Collection</span>
          </div>

          <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl tracking-tight leading-[1.08] font-light">
            Defined by Style.
          </h1>

          <p className="max-w-xl mx-auto text-base sm:text-lg text-neutral-300 font-light leading-relaxed tracking-wide">
            Discover modern essentials crafted for a refined everyday wardrobe. Architectural silhouettes, natural fibers, and timeless precision.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('/women')}
              className="w-full sm:w-auto px-9 py-4 bg-white text-black text-xs uppercase tracking-[0.25em] font-medium hover:bg-neutral-200 transition-all duration-200 shadow-xl flex items-center justify-center gap-2 group"
            >
              <span>Shop Women</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => onNavigate('/men')}
              className="w-full sm:w-auto px-9 py-4 bg-transparent text-white border border-white text-xs uppercase tracking-[0.25em] font-medium hover:bg-white/10 backdrop-blur-sm transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              <span>Shop Men</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Discreet Video Play / Pause Toggle */}
        <button
          onClick={toggleVideoPlayback}
          aria-label={isVideoPlaying ? 'Pause background video' : 'Play background video'}
          title={isVideoPlaying ? 'Pause video' : 'Play video'}
          className="absolute bottom-6 right-6 z-20 p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white backdrop-blur-md border border-white/20 transition-all text-xs flex items-center justify-center shadow-lg"
        >
          {isVideoPlaying ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
        </button>
      </section>

      {/* 2. FEATURED CATEGORIES: WOMEN & MEN */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-[0.28em] text-neutral-400 block mb-2 font-semibold">
            Curated Wardrobes
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-neutral-900 font-normal">
            Seasonal Expressions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Women Card */}
          <div
            onClick={() => onNavigate('/women')}
            className="group relative h-[500px] sm:h-[620px] overflow-hidden cursor-pointer bg-neutral-100"
          >
            <img
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=85"
              alt="Women's Collection"
              className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-10 left-10 right-10 text-white space-y-3">
              <span className="text-xs uppercase tracking-[0.25em] text-neutral-300 font-medium">
                Collection
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl">Women</h3>
              <p className="text-xs sm:text-sm text-neutral-300 max-w-sm font-light">
                Sensual silk gowns, architectural wool coats, and fine merino knitwear designed for the contemporary silhouette.
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold border-b border-white pb-1 group-hover:text-neutral-200 transition-colors">
                  Explore Women <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Men Card */}
          <div
            onClick={() => onNavigate('/men')}
            className="group relative h-[500px] sm:h-[620px] overflow-hidden cursor-pointer bg-neutral-100"
          >
            <img
              src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&q=85"
              alt="Men's Collection"
              className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-10 left-10 right-10 text-white space-y-3">
              <span className="text-xs uppercase tracking-[0.25em] text-neutral-300 font-medium">
                Collection
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl">Men</h3>
              <p className="text-xs sm:text-sm text-neutral-300 max-w-sm font-light">
                Unstructured Italian tailoring, washed linen shirts, selvedge denim, and deconstructed outerwear.
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold border-b border-white pb-1 group-hover:text-neutral-200 transition-colors">
                  Explore Men <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-neutral-200 gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.28em] text-neutral-400 block mb-1 font-semibold">
              The Signature Selection
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-neutral-900 font-normal">
              Featured Pieces
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/women')}
            className="text-xs uppercase tracking-[0.2em] text-neutral-900 hover:text-neutral-600 font-medium flex items-center gap-1.5 transition-colors"
          >
            <span>View All Garments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[3/4] bg-neutral-200" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {featuredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. EDITORIAL PROMOTIONAL BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden bg-neutral-900 text-white grid grid-cols-1 lg:grid-cols-2 items-center">
          <div className="p-8 sm:p-14 lg:p-20 space-y-6">
            <span className="text-xs uppercase tracking-[0.28em] text-neutral-400 font-medium block">
              Editorial Volume IV
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-light leading-tight">
              The Essence of Tactile Minimalism.
            </h2>
            <p className="text-sm text-neutral-300 font-light leading-relaxed max-w-md">
              We source raw fibers from ethical regenerative farms across Mongolia, Biella, and Japan. Every seam is finished with heritage techniques designed to endure decades of considered wear.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('/about')}
                className="px-8 py-3.5 bg-white text-black text-xs uppercase tracking-[0.25em] font-medium hover:bg-neutral-200 transition-colors inline-flex items-center gap-2"
              >
                <span>Read The Manifesto</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="h-[400px] lg:h-[580px] w-full overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1200&q=85"
              alt="Editorial model"
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>
      </section>

      {/* 5. NEW ARRIVALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-neutral-200 gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.28em] text-neutral-400 block mb-1 font-semibold">
              Fresh Off The Looms
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-neutral-900 font-normal">
              New Arrivals
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/men')}
            className="text-xs uppercase tracking-[0.2em] text-neutral-900 hover:text-neutral-600 font-medium flex items-center gap-1.5 transition-colors"
          >
            <span>Explore Collection</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[3/4] bg-neutral-200" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {newArrivals.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </section>

      {/* 6. ATELIER TRUST PILLARS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-y border-neutral-200 py-12 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
          <div className="flex items-start gap-4 p-4">
            <Truck className="w-6 h-6 text-neutral-900 shrink-0 mt-1 mx-auto sm:mx-0" />
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-neutral-900 mb-1">
                Global Express Delivery
              </h4>
              <p className="text-xs text-neutral-500 font-light leading-relaxed">
                Complimentary tracked international delivery on all orders exceeding $250.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4">
            <RotateCcw className="w-6 h-6 text-neutral-900 shrink-0 mt-1 mx-auto sm:mx-0" />
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-neutral-900 mb-1">
                30-Day Bespoke Returns
              </h4>
              <p className="text-xs text-neutral-500 font-light leading-relaxed">
                Hassle-free doorstep collection and exchanges for unworn pieces in original tags.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4">
            <ShieldCheck className="w-6 h-6 text-neutral-900 shrink-0 mt-1 mx-auto sm:mx-0" />
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-neutral-900 mb-1">
                Cash on Delivery
              </h4>
              <p className="text-xs text-neutral-500 font-light leading-relaxed">
                Inspect your tailored garments upon arrival with convenient cash settlement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. NEWSLETTER SECTION */}
      <section className="max-w-3xl mx-auto px-4 text-center space-y-6 py-6">
        <span className="text-xs uppercase tracking-[0.28em] text-neutral-400 font-semibold block">
          Stay Connected
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl text-neutral-900 font-normal">
          Join the VELOUR Circle
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto font-light leading-relaxed">
          Sign up to enjoy private atelier trunk shows, seasonal gift catalogues, and 10% off your initial purchase with code <strong className="font-semibold text-neutral-800">VELOUR10</strong>.
        </p>

        <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row max-w-md mx-auto gap-2 pt-2">
          <input
            type="email"
            value={newsletterEmail}
            onChange={e => setNewsletterEmail(e.target.value)}
            placeholder="Enter your email address"
            className="flex-1 bg-white border border-neutral-300 px-4 py-3 text-xs tracking-wider text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black transition-colors"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-black text-white px-7 py-3 text-xs uppercase tracking-[0.2em] font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Registering...' : 'Join Circle'}
          </button>
        </form>
      </section>
    </div>
  );
}
