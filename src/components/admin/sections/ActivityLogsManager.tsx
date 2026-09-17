import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  FileSpreadsheet,
  RefreshCw,
  Clock,
  UserCheck,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { AuditLog } from '../../../types.ts';
import { apiFetch } from '../../../lib/api.ts';

export function ActivityLogsManager() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/audit-logs?limit=100');
      if (res.ok) {
        const d = await res.json();
        setLogs(d.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const exportCSV = () => {
    const headers = ['Timestamp', 'Admin Name', 'Admin Email', 'Action', 'Resource', 'Resource ID', 'Details', 'IP'];
    const rows = logs.map((l) => [
      new Date(l.timestamp).toISOString(),
      `"${l.adminName}"`,
      l.adminEmail,
      l.action,
      l.resource,
      l.resourceId || '',
      `"${(l.details || '').replace(/"/g, '""')}"`,
      l.ip || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `velour_security_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter((l) => {
    if (actionFilter !== 'all' && !l.action.toLowerCase().includes(actionFilter.toLowerCase())) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        l.action.toLowerCase().includes(q) ||
        l.resource.toLowerCase().includes(q) ||
        (l.details || '').toLowerCase().includes(q) ||
        l.adminName.toLowerCase().includes(q) ||
        l.adminEmail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-neutral-900" />
            <h2 className="font-serif text-2xl font-light text-neutral-900">
              Security & Audit Trail
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Immutable log of all administrative actions, stock changes, order modifications, and auth challenges
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadLogs}
            disabled={loading}
            className="p-2 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`w-4 h-4 text-neutral-700 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-medium transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Audit Trail</span>
          </button>
        </div>
      </div>

      {/* 2. Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by admin name, email, resource or action..."
            className="w-full pl-10 pr-3 py-2 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
        >
          <option value="all">All Audit Actions</option>
          <option value="PRODUCT">Product Modifications</option>
          <option value="ORDER">Order & Status Events</option>
          <option value="REFUND">Refund Transactions</option>
          <option value="STOCK">Stock Movements</option>
          <option value="COUPON">Coupons & Promos</option>
          <option value="AUTH">Authentication Events</option>
        </select>
      </div>

      {/* 3. Audit Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 font-mono uppercase text-[10px] tracking-wider border-b border-neutral-100">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Administrator</th>
                <th className="px-6 py-3">Action Type</th>
                <th className="px-6 py-3">Resource Affected</th>
                <th className="px-6 py-3">Audit Details & Memo</th>
                <th className="px-6 py-3">Client IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-400 font-sans">
                    No security events recorded matching filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/70">
                    <td className="px-6 py-4 text-neutral-500 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="px-6 py-4 font-sans">
                      <p className="font-semibold text-neutral-900">{log.adminName}</p>
                      <p className="text-[10px] text-neutral-400 font-mono">{log.adminEmail}</p>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 text-[10px] font-bold uppercase tracking-wider">
                        {log.action}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-neutral-700">
                      <span className="uppercase text-[10px] font-semibold">{log.resource}</span>
                      {log.resourceId && (
                        <span className="block text-[10px] text-neutral-400 truncate max-w-[140px]">
                          ID: {log.resourceId}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 font-sans text-xs text-neutral-700 max-w-md">
                      {log.details || 'Administrative write operation verified'}
                    </td>

                    <td className="px-6 py-4 text-neutral-400 text-[11px]">
                      {log.ip || 'Secure Client'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
