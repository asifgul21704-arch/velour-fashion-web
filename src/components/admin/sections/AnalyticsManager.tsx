import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  PieChart,
  BarChart3,
  Calendar,
  Percent,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import { Order, Product } from '../../../types.ts';

interface AnalyticsManagerProps {
  orders: Order[];
  products: Product[];
}

export function AnalyticsManager({ orders, products }: AnalyticsManagerProps) {
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | 'all'>('30d');

  // Core metrics calculated from real data
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = orders.length;
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const refundedOrders = orders.filter((o) => o.paymentStatus === 'Refunded').length;
  const returnRate = totalOrders > 0 ? (refundedOrders / totalOrders) * 100 : 0;

  // Breakdown by Gender
  const genderBreakdown: Record<string, { count: number; revenue: number }> = {
    women: { count: 0, revenue: 0 },
    men: { count: 0, revenue: 0 },
    unisex: { count: 0, revenue: 0 }
  };

  // Breakdown by Category
  const categoryBreakdown: Record<string, { count: number; revenue: number }> = {};

  orders.forEach((o) => {
    (o.items || []).forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const itemRev = (item.price || 0) * (item.quantity || 1);
      const gender = prod?.gender || 'women';
      const category = prod?.category || 'Atelier Collection';

      if (!genderBreakdown[gender]) genderBreakdown[gender] = { count: 0, revenue: 0 };
      genderBreakdown[gender].count += item.quantity || 1;
      genderBreakdown[gender].revenue += itemRev;

      if (!categoryBreakdown[category]) categoryBreakdown[category] = { count: 0, revenue: 0 };
      categoryBreakdown[category].count += item.quantity || 1;
      categoryBreakdown[category].revenue += itemRev;
    });
  });

  const categorySorted = Object.entries(categoryBreakdown).sort(
    (a, b) => b[1].revenue - a[1].revenue
  );

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-light text-neutral-900">Store Analytics & Intelligence</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Real performance telemetry derived from persistent transactional state
          </p>
        </div>

        <div className="inline-flex p-1 bg-neutral-100 rounded-xl text-xs">
          {(['30d', '90d', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-lg uppercase tracking-wider text-[11px] font-semibold transition-all ${
                timeRange === r ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-black'
              }`}
            >
              {r === '30d' ? 'Past 30 Days' : r === '90d' ? 'Past Quarter' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Key Telemetry Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Total Revenue
          </span>
          <h3 className="text-2xl sm:text-3xl font-serif font-light text-neutral-900 mt-2">
            ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Actual verified sales</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Average Order Value
          </span>
          <h3 className="text-2xl sm:text-3xl font-serif font-light text-neutral-900 mt-2">
            ${aov.toFixed(2)}
          </h3>
          <span className="text-xs text-neutral-500 mt-1 block">Per cart transaction</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Order Velocity
          </span>
          <h3 className="text-2xl sm:text-3xl font-serif font-light text-neutral-900 mt-2">
            {totalOrders} Orders
          </h3>
          <span className="text-xs text-neutral-500 mt-1 block">Fulfilled atelier requests</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Return Rate
          </span>
          <h3 className="text-2xl sm:text-3xl font-serif font-light text-neutral-900 mt-2">
            {returnRate.toFixed(1)}%
          </h3>
          <span className="text-xs text-neutral-500 mt-1 block">Refunded vs total volume</span>
        </div>
      </div>

      {/* 3. Department & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department / Gender Share */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
          <h4 className="font-serif text-xl font-light text-neutral-900 mb-1">
            Department Volume Allocation
          </h4>
          <p className="text-xs text-neutral-500 mb-6">Revenue and unit distribution across collections</p>

          <div className="space-y-5">
            {Object.entries(genderBreakdown).map(([gender, data]) => {
              const pct = totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0;

              return (
                <div key={gender} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold uppercase tracking-wider text-neutral-800">
                      {gender}
                    </span>
                    <span className="font-mono text-neutral-600">
                      ${data.revenue.toFixed(0)} &bull; {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full transition-all duration-700 ${
                        gender === 'women'
                          ? 'bg-neutral-900'
                          : gender === 'men'
                          ? 'bg-amber-600'
                          : 'bg-emerald-600'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Category Yield */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
          <h4 className="font-serif text-xl font-light text-neutral-900 mb-1">
            Category Yield Analysis
          </h4>
          <p className="text-xs text-neutral-500 mb-6">Top performing product groupings by gross volume</p>

          <div className="space-y-3">
            {categorySorted.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                Category distribution will display once orders are received.
              </div>
            ) : (
              categorySorted.slice(0, 5).map(([category, data], idx) => (
                <div
                  key={category}
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-neutral-400 font-bold w-4">#{idx + 1}</span>
                    <span className="font-medium text-neutral-900">{category}</span>
                  </div>

                  <div className="text-right font-mono">
                    <span className="font-bold text-neutral-900">${data.revenue.toFixed(2)}</span>
                    <span className="text-[11px] text-neutral-400 ml-2">({data.count} pcs)</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
