import React, { useState, useEffect } from 'react';
import {
  Mail,
  Search,
  CheckCircle2,
  Trash2,
  Reply,
  Clock,
  X,
  MessageSquare,
  Send
} from 'lucide-react';
import { ContactMessage } from '../../../types.ts';
import { apiFetch } from '../../../lib/api.ts';

export function ContactMessagesManager() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'replied'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Selected message to inspect / reply
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/messages');
      if (res.ok) {
        const d = await res.json();
        setMessages(d.messages || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleMarkRead = async (id: string, currentStatus: string) => {
    if (currentStatus === 'read' || currentStatus === 'replied') return;
    try {
      await apiFetch(`/api/admin/messages/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'read' })
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: 'read' } : m))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || !replyText.trim()) return;

    setIsReplying(true);
    try {
      const res = await apiFetch(`/api/admin/messages/${selectedMessage.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ reply: replyText })
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === selectedMessage.id ? { ...m, status: 'replied' } : m
          )
        );
        setSelectedMessage(null);
        setReplyText('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsReplying(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this concierge message?')) return;
    try {
      const res = await apiFetch(`/api/admin/messages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        if (selectedMessage?.id === id) setSelectedMessage(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = messages.filter((m) => {
    if (filter !== 'all' && m.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-light text-neutral-900">Concierge Inquiries & Messages</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Client service messages, bespoke styling inquiries, and custom garment consultations
          </p>
        </div>

        <button
          onClick={loadMessages}
          className="text-xs text-neutral-600 hover:text-black font-medium hover:underline"
        >
          {loading ? 'Refreshing...' : 'Refresh Inbox'}
        </button>
      </div>

      {/* 2. Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          {(['all', 'unread', 'read', 'replied'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all ${
                filter === st
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600'
              }`}
            >
              {st} ({st === 'all' ? messages.length : messages.filter((m) => m.status === st).length})
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inquiries by client name, email, subject or inquiry text..."
            className="w-full pl-10 pr-3 py-2 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
        </div>
      </div>

      {/* 3. Messages List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-neutral-200 text-center text-xs text-neutral-400">
            No client concierge inquiries found matching filter.
          </div>
        ) : (
          filtered.map((msg) => (
            <div
              key={msg.id}
              onClick={() => {
                setSelectedMessage(msg);
                handleMarkRead(msg.id, msg.status);
              }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                msg.status === 'unread'
                  ? 'bg-amber-50/40 border-amber-200 shadow-sm'
                  : 'bg-white border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="font-serif text-base font-medium text-neutral-900 truncate">
                    {msg.subject}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider shrink-0 ${
                      msg.status === 'unread'
                        ? 'bg-amber-500 text-white font-bold'
                        : msg.status === 'replied'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {msg.status}
                  </span>
                </div>

                <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                  {msg.message}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-neutral-400 font-mono pt-1">
                  <span className="text-neutral-900 font-medium">{msg.name}</span>
                  <span>&bull;</span>
                  <span>{msg.email}</span>
                  <span>&bull;</span>
                  <span>{new Date(msg.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMessage(msg);
                  }}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Reply className="w-3.5 h-3.5" />
                  <span>Reply</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(msg.id);
                  }}
                  className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 rounded-lg transition-colors"
                  title="Delete message"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Detail / Reply Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-8">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <div>
                <h3 className="font-serif text-xl font-light text-neutral-900">
                  {selectedMessage.subject}
                </h3>
                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                  From {selectedMessage.name} ({selectedMessage.email}) &bull;{' '}
                  {new Date(selectedMessage.createdAt).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setSelectedMessage(null)}>
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 text-xs text-neutral-800 leading-relaxed whitespace-pre-wrap font-sans">
                {selectedMessage.message}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Compose Atelier Concierge Response
                </label>
                <textarea
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Dear client, thank you for contacting the VELOUR Atelier..."
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                />

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMessage(null)}
                    className="px-4 py-2 border border-neutral-200 text-neutral-700 rounded-xl text-xs font-medium"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isReplying}
                    className="px-5 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-medium uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isReplying ? 'Transmitting...' : 'Dispatch Reply'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
