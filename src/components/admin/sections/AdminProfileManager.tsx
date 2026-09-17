import React, { useState } from 'react';
import {
  UserCheck,
  Shield,
  Key,
  CheckCircle2,
  Mail,
  Lock,
  LogOut,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { apiFetch } from '../../../lib/api.ts';

export function AdminProfileManager() {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || 'Atelier Director');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch(`/api/admin/customers/${user?.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ name })
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl">
      {/* 1. Header */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-light text-neutral-900">Administrator Security & Credentials</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Active session authentication, RBAC authorization level and security audit status
          </p>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile records updated successfully.</span>
        </div>
      )}

      {/* 2. Security Badge Card */}
      <div className="bg-neutral-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-serif text-2xl">
            {user?.name?.slice(0, 2) || 'AD'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-2xl font-light">{user?.name || 'Administrator'}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold bg-amber-400 text-black">
                {user?.role || 'admin'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-mono mt-1">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-neutral-800 text-xs">
          <div>
            <span className="text-neutral-500 uppercase tracking-wider text-[10px] font-mono">
              Access Tier
            </span>
            <p className="font-medium text-white mt-0.5">Full Atelier Root RBAC</p>
          </div>
          <div>
            <span className="text-neutral-500 uppercase tracking-wider text-[10px] font-mono">
              Database Backend
            </span>
            <p className="font-medium text-white mt-0.5">MongoDB Persistent Layer</p>
          </div>
          <div>
            <span className="text-neutral-500 uppercase tracking-wider text-[10px] font-mono">
              Audit Status
            </span>
            <p className="font-medium text-emerald-400 mt-0.5">Continuous Monitoring</p>
          </div>
        </div>
      </div>

      {/* 3. Edit Form */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
        <h3 className="font-serif text-lg text-neutral-900">Update Profile Details</h3>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Admin Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Admin Email (Read-only)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || 'admin@velour-fashion.com'}
              className="w-full px-3 py-2 text-xs bg-neutral-100 text-neutral-500 border border-neutral-200 rounded-xl font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-medium uppercase tracking-wider"
            >
              {saving ? 'Updating...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
