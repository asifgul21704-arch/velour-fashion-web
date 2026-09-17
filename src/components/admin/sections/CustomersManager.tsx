import React, { useState } from 'react';
import {
  Users,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Heart,
  DollarSign,
  Mail,
  Phone,
  MapPin,
  Calendar,
  X
} from 'lucide-react';
import { User, Order } from '../../../types.ts';
import { apiFetch } from '../../../lib/api.ts';

interface CustomersManagerProps {
  customers: User[];
  orders: Order[];
  onRefresh: () => void;
  onToggleCustomerStatus: (id: string) => Promise<boolean>;
}

export function CustomersManager({
  customers,
  orders,
  onRefresh,
  onToggleCustomerStatus
}: CustomersManagerProps) {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.city || '').toLowerCase().includes(q)
    );
  });

  const handleOpenDetails = async (customer: User) => {
    setIsLoadingDetails(true);
    try {
      const res = await apiFetch(`/api/admin/customers/${customer.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCustomer(data);
      } else {
        // Fallback to local customer + filtered orders
        const custOrders = orders.filter((o) => o.userId === customer.id || o.userEmail === customer.email);
        setSelectedCustomer({ customer, orders: custOrders, wishlistProducts: [] });
      }
    } catch (e) {
      const custOrders = orders.filter((o) => o.userId === customer.id || o.userEmail === customer.email);
      setSelectedCustomer({ customer, orders: custOrders, wishlistProducts: [] });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-light text-neutral-900">Client Directory & Accounts</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            View registered patrons, lifetime purchasing metrics, order history and account statuses
          </p>
        </div>
      </div>

      {/* 2. Search */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client name, email, phone, city..."
            className="w-full pl-10 pr-3 py-2 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
        </div>
      </div>

      {/* 3. Customers Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 font-mono uppercase text-[10px] tracking-wider border-b border-neutral-100">
              <tr>
                <th className="px-6 py-3">Client Profile</th>
                <th className="px-6 py-3">Contact Details</th>
                <th className="px-6 py-3">Lifetime Orders</th>
                <th className="px-6 py-3">Total Spend</th>
                <th className="px-6 py-3">Member Since</th>
                <th className="px-6 py-3">Account Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((client) => {
                  const clientOrders = orders.filter(
                    (o) => o.userId === client.id || o.userEmail?.toLowerCase() === client.email?.toLowerCase()
                  );
                  const totalSpent =
                    client.totalSpent !== undefined
                      ? client.totalSpent
                      : clientOrders.reduce((sum, o) => sum + (o.total || 0), 0);

                  return (
                    <tr key={client.id} className="hover:bg-neutral-50/70 transition-colors">
                      {/* Name & Role */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {client.name ? client.name.slice(0, 2) : 'CL'}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">{client.name}</p>
                            <span
                              className={`px-1.5 py-0.2 text-[9px] font-mono uppercase font-semibold rounded ${
                                client.role === 'admin'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-neutral-100 text-neutral-600'
                              }`}
                            >
                              {client.role}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <p className="text-neutral-900 font-mono text-[11px]">{client.email}</p>
                        <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                          {client.phone || 'No phone provided'}
                        </p>
                      </td>

                      {/* Orders Count */}
                      <td className="px-6 py-4 font-mono font-medium text-neutral-900">
                        {client.ordersCount !== undefined ? client.ordersCount : clientOrders.length} orders
                      </td>

                      {/* Spend */}
                      <td className="px-6 py-4 font-mono font-bold text-neutral-900">
                        ${totalSpent.toFixed(2)}
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4 text-neutral-500 font-mono text-[11px]">
                        {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'Active'}
                      </td>

                      {/* Status Toggle */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => onToggleCustomerStatus(client.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                            client.isActive !== false
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {client.isActive !== false ? 'Active Account' : 'Deactivated'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenDetails(client)}
                          className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Customer Detail Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-8">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-sm uppercase">
                  {selectedCustomer.customer?.name?.slice(0, 2) || 'CL'}
                </div>
                <div>
                  <h3 className="font-serif text-xl font-light text-neutral-900">
                    {selectedCustomer.customer?.name}
                  </h3>
                  <p className="text-xs text-neutral-500 font-mono">
                    {selectedCustomer.customer?.email} &bull; ID: {selectedCustomer.customer?.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Account details card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-neutral-50 rounded-xl border border-neutral-100 text-xs">
                <div>
                  <span className="text-neutral-400 uppercase tracking-wider text-[10px] font-mono">
                    Phone Contact
                  </span>
                  <p className="font-medium text-neutral-900 mt-0.5">
                    {selectedCustomer.customer?.phone || 'Not provided'}
                  </p>
                </div>
                <div>
                  <span className="text-neutral-400 uppercase tracking-wider text-[10px] font-mono">
                    Address Location
                  </span>
                  <p className="font-medium text-neutral-900 mt-0.5">
                    {selectedCustomer.customer?.city || 'Default City'},{' '}
                    {selectedCustomer.customer?.country || 'USA'}
                  </p>
                </div>
                <div>
                  <span className="text-neutral-400 uppercase tracking-wider text-[10px] font-mono">
                    Role & Status
                  </span>
                  <p className="font-medium text-neutral-900 mt-0.5 capitalize">
                    {selectedCustomer.customer?.role} &bull;{' '}
                    {selectedCustomer.customer?.isActive !== false ? 'Active' : 'Disabled'}
                  </p>
                </div>
              </div>

              {/* Order History */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
                  Client Order History ({selectedCustomer.orders?.length || 0})
                </h4>

                <div className="space-y-2">
                  {!selectedCustomer.orders || selectedCustomer.orders.length === 0 ? (
                    <div className="py-6 text-center text-xs text-neutral-400 bg-neutral-50 rounded-xl">
                      No order transactions recorded for this client.
                    </div>
                  ) : (
                    selectedCustomer.orders.map((ord: Order) => (
                      <div
                        key={ord.id}
                        className="p-3 bg-neutral-50 hover:bg-neutral-100/70 rounded-xl border border-neutral-100 flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <p className="font-mono font-bold text-neutral-900">#{ord.orderNumber}</p>
                          <p className="text-[11px] text-neutral-500">
                            {new Date(ord.createdAt).toLocaleDateString()} &bull; {ord.items?.length || 0} pieces
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-neutral-900">
                            ${ord.total.toFixed(2)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              ord.orderStatus === 'Delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ord.orderStatus}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-100 flex justify-end bg-neutral-50/50">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2 bg-neutral-900 text-white rounded-xl text-xs font-medium uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
