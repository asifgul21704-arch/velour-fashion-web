import React, { useState } from 'react';
import {
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  Search,
  Filter,
  MessageSquare,
  ThumbsUp,
  AlertCircle
} from 'lucide-react';
import { Review, Product } from '../../../types.ts';

interface ReviewsManagerProps {
  reviews: Review[];
  products: Product[];
  onRefresh: () => void;
  onUpdateStatus: (id: string, status: 'approved' | 'rejected' | 'pending') => Promise<boolean>;
  onDeleteReview: (id: string) => Promise<boolean>;
}

export function ReviewsManager({
  reviews,
  products,
  onRefresh,
  onUpdateStatus,
  onDeleteReview
}: ReviewsManagerProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');

  const filtered = reviews.filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.userName.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = reviews.filter((r) => r.status === 'pending').length;
  const approvedCount = reviews.filter((r) => r.status === 'approved').length;
  const avgRating =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 5.0;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-light text-neutral-900">Client Reviews Moderation</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Authenticate client testimonials, audit rating sentiment, and moderate storefront publications
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center gap-3">
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span className="font-mono font-bold text-sm text-neutral-900">{avgRating.toFixed(1)}</span>
            </div>
            <span className="text-xs text-neutral-500">Average Atelier Score</span>
          </div>
        </div>
      </div>

      {/* 2. Filters & Status Tabs */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => {
            const count =
              st === 'all'
                ? reviews.length
                : reviews.filter((r) => r.status === st).length;
            const isActive = filter === st;

            return (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600'
                }`}
              >
                <span>{st}</span>
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

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviews by client name, product title or words in testimonial..."
            className="w-full pl-10 pr-3 py-2 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
        </div>
      </div>

      {/* 3. Reviews List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-neutral-200 text-center text-xs text-neutral-400">
            No customer reviews match this moderation filter.
          </div>
        ) : (
          filtered.map((rev) => {
            const product = products.find((p) => p.id === rev.productId);

            return (
              <div
                key={rev.id}
                className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-6 hover:border-neutral-300 transition-all"
              >
                {/* Product Thumbnail & Details */}
                <div className="flex items-start gap-4">
                  <img
                    src={
                      product?.images?.[0] ||
                      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100'
                    }
                    alt=""
                    className="w-14 h-16 object-cover rounded-xl bg-neutral-100 shrink-0"
                  />
                  <div className="space-y-1">
                    <p className="font-serif text-base font-medium text-neutral-900">
                      {rev.productName}
                    </p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= rev.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-neutral-200'
                          }`}
                        />
                      ))}
                      <span className="font-mono text-xs font-bold text-neutral-800 ml-1">
                        {rev.rating}/5
                      </span>
                    </div>

                    <p className="text-xs text-neutral-700 pt-2 leading-relaxed max-w-xl">
                      &ldquo;{rev.comment}&rdquo;
                    </p>

                    <div className="flex items-center gap-2 pt-2 text-[11px] text-neutral-400 font-mono">
                      <span className="text-neutral-900 font-semibold">{rev.userName}</span>
                      <span>&bull;</span>
                      <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Moderation Controls */}
                <div className="flex flex-col sm:items-end gap-3 shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      rev.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rev.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {rev.status}
                  </span>

                  <div className="flex items-center gap-2 pt-2">
                    {rev.status !== 'approved' && (
                      <button
                        onClick={() => onUpdateStatus(rev.id, 'approved')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}

                    {rev.status !== 'rejected' && (
                      <button
                        onClick={() => onUpdateStatus(rev.id, 'rejected')}
                        className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (window.confirm('Permanently remove this review?')) {
                          onDeleteReview(rev.id);
                        }
                      }}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 rounded-lg transition-colors"
                      title="Delete Review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
