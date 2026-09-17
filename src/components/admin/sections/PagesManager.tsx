import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  X,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

interface ContentPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  updatedAt: string;
}

const INITIAL_PAGES: ContentPage[] = [
  {
    id: 'page_about',
    title: 'The VELOUR Atelier Legacy',
    slug: 'about',
    content: 'VELOUR represents the intersection of quiet modernism, architectural balance, and uncompromising garment construction...',
    isPublished: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'page_shipping',
    title: 'White-Glove Shipping & Returns Policy',
    slug: 'shipping-returns',
    content: 'All orders over $300 receive complimentary insured express transit with tailored garment protection boxes...',
    isPublished: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'page_care',
    title: 'Garment Longevity & Silk Care',
    slug: 'care-guide',
    content: 'Preserving raw silks, virgin wools, and organic cotton twills through conscientious maintenance...',
    isPublished: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'page_terms',
    title: 'Terms of Service & Atelier Conditions',
    slug: 'terms',
    content: 'Standard terms of commerce, bespoke fittings, and digital privacy covenants.',
    isPublished: true,
    updatedAt: new Date().toISOString()
  }
];

export function PagesManager() {
  const [pages, setPages] = useState<ContentPage[]>(() => {
    const local = localStorage.getItem('velour_admin_pages');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {}
    }
    return INITIAL_PAGES;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<ContentPage | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    isPublished: true
  });

  const saveToStorage = (updated: ContentPage[]) => {
    setPages(updated);
    localStorage.setItem('velour_admin_pages', JSON.stringify(updated));
  };

  const handleOpenModal = (page: ContentPage | null) => {
    if (page) {
      setEditingPage(page);
      setFormData({
        title: page.title,
        slug: page.slug,
        content: page.content,
        isPublished: page.isPublished
      });
    } else {
      setEditingPage(null);
      setFormData({
        title: '',
        slug: '',
        content: '',
        isPublished: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingPage) {
      const updated = pages.map((p) =>
        p.id === editingPage.id
          ? {
              ...p,
              title: formData.title.trim(),
              slug: formData.slug.trim() || formData.title.toLowerCase().replace(/\s+/g, '-'),
              content: formData.content.trim(),
              isPublished: formData.isPublished,
              updatedAt: new Date().toISOString()
            }
          : p
      );
      saveToStorage(updated);
    } else {
      const newPage: ContentPage = {
        id: `page_${Date.now()}`,
        title: formData.title.trim(),
        slug: formData.slug.trim() || formData.title.toLowerCase().replace(/\s+/g, '-'),
        content: formData.content.trim(),
        isPublished: formData.isPublished,
        updatedAt: new Date().toISOString()
      };
      saveToStorage([...pages, newPage]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this content page?')) return;
    saveToStorage(pages.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-light text-neutral-900">Storefront Content Pages</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage editorial pages, house manifesto, legal disclosures, and customer care literature
          </p>
        </div>

        <button
          onClick={() => handleOpenModal(null)}
          className="flex items-center gap-2 px-4 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-medium uppercase tracking-wider transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Content Page</span>
        </button>
      </div>

      {/* 2. Pages Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 font-mono uppercase text-[10px] tracking-wider border-b border-neutral-100">
              <tr>
                <th className="px-6 py-3">Page Title</th>
                <th className="px-6 py-3">Storefront Path</th>
                <th className="px-6 py-3">Last Modified</th>
                <th className="px-6 py-3">Publication State</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {pages.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50/70">
                  <td className="px-6 py-4">
                    <p className="font-medium text-neutral-900">{p.title}</p>
                    <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">{p.content}</p>
                  </td>

                  <td className="px-6 py-4 font-mono text-neutral-500 text-[11px]">
                    /{p.slug}
                  </td>

                  <td className="px-6 py-4 font-mono text-neutral-500 text-[11px]">
                    {new Date(p.updatedAt).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        p.isPublished
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {p.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => handleOpenModal(p)}
                        className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Edit Page"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Delete Page"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <h3 className="font-serif text-lg text-neutral-900">
                {editingPage ? 'Edit Content Page' : 'Create Content Page'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Page Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Sustainable Atelier Sourcing"
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. sustainable-sourcing"
                  className="w-full px-3 py-2 text-xs font-mono border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Editorial Body Content
                </label>
                <textarea
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="rounded border-neutral-300 text-neutral-900 focus:ring-0"
                  />
                  <span>Live & Published</span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-neutral-200 text-neutral-700 rounded-xl text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-medium uppercase tracking-wider"
                  >
                    Save Page
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
