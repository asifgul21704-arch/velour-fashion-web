import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Users,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  Search,
  Sparkles,
  Calendar
} from 'lucide-react';
import { apiFetch } from '../../../lib/api.ts';

interface Subscriber {
  id: string;
  email: string;
  createdAt: string;
  isActive?: boolean;
}

export function MarketingManager() {
  const [activeTab, setActiveTab] = useState<'subscribers' | 'campaigns'>('subscribers');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Campaign Form
  const [campaign, setCampaign] = useState({
    subject: 'Autumn Atelier Collection — Privileged Access',
    preheader: 'Discover hand-tailored pieces sculpted in pure silk and Italian virgin wool',
    audience: 'all',
    body: 'Dear Patron,\n\nWe cordially invite you to explore the latest architectural silhouettes from the VELOUR Atelier. Limited quantities are now available for immediate dispatch.\n\nWarm regards,\nThe Atelier Team'
  });
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const loadSubscribers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/subscribers');
      if (res.ok) {
        const d = await res.json();
        setSubscribers(d.subscribers || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscribers();
  }, []);

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaign.subject.trim() || !campaign.body.trim()) return;

    setIsSending(true);
    try {
      const res = await apiFetch('/api/admin/campaigns/send', {
        method: 'POST',
        body: JSON.stringify(campaign)
      });
      if (res.ok) {
        setSendSuccess(true);
        setTimeout(() => setSendSuccess(false), 5000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const exportSubscribersCSV = () => {
    const headers = ['Email', 'Subscribed At', 'Status'];
    const rows = subscribers.map((s) => [
      s.email,
      new Date(s.createdAt).toISOString(),
      s.isActive !== false ? 'Active' : 'Unsubscribed'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `velour_subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSubscribers = subscribers.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Navigation */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-light text-neutral-900">Marketing & Dispatches</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Engage subscribed clients with bespoke private editorial newsletters and lookbooks
          </p>
        </div>

        <div className="inline-flex p-1 bg-neutral-100 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('subscribers')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'subscribers'
                ? 'bg-white text-neutral-950 shadow-sm'
                : 'text-neutral-500 hover:text-black'
            }`}
          >
            Subscribers Directory ({subscribers.length})
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'campaigns'
                ? 'bg-white text-neutral-950 shadow-sm'
                : 'text-neutral-500 hover:text-black'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Compose Dispatch</span>
          </button>
        </div>
      </div>

      {activeTab === 'subscribers' ? (
        /* Subscribers Tab */
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search newsletter subscriber email address..."
                className="w-full pl-10 pr-3 py-2 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            <button
              onClick={exportSubscribersCSV}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 font-mono uppercase text-[10px] tracking-wider border-b border-neutral-100">
                <tr>
                  <th className="px-6 py-3">Subscriber Email</th>
                  <th className="px-6 py-3">Joined Date</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredSubscribers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-neutral-400">
                      No subscribers found. New signups from the footer newsletter form will appear here.
                    </td>
                  </tr>
                ) : (
                  filteredSubscribers.map((sub) => (
                    <tr key={sub.id} className="hover:bg-neutral-50/70">
                      <td className="px-6 py-4 font-mono font-medium text-neutral-900">
                        {sub.email}
                      </td>
                      <td className="px-6 py-4 font-mono text-neutral-500">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                          Active Recipient
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Campaigns Dispatch Tab */
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm max-w-3xl">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-serif text-xl font-light text-neutral-900">
              Compose Atelier Editorial Dispatch
            </h3>
          </div>

          {sendSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Dispatch broadcasted successfully to all active subscribers.</span>
            </div>
          )}

          <form onSubmit={handleSendCampaign} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Recipient Segment *
              </label>
              <select
                value={campaign.audience}
                onChange={(e) => setCampaign({ ...campaign, audience: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
              >
                <option value="all">All Active Atelier Subscribers ({subscribers.length} patrons)</option>
                <option value="vip">VIP Patrons (Over $1,000 spend)</option>
                <option value="new">New Joiners (Last 30 Days)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Subject Line *
              </label>
              <input
                type="text"
                required
                value={campaign.subject}
                onChange={(e) => setCampaign({ ...campaign, subject: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Preheader Preview Text
              </label>
              <input
                type="text"
                value={campaign.preheader}
                onChange={(e) => setCampaign({ ...campaign, preheader: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Editorial Body *
              </label>
              <textarea
                rows={6}
                required
                value={campaign.body}
                onChange={(e) => setCampaign({ ...campaign, body: e.target.value })}
                className="w-full px-3 py-2 text-xs font-sans leading-relaxed border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSending}
                className="px-6 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-medium uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>{isSending ? 'Transmitting Dispatch...' : 'Broadcast Dispatch'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
