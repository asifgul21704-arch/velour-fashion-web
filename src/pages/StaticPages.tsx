import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { useToast } from '../context/ToastContext.tsx';

interface PageProps {
  onNavigate: (path: string) => void;
}

export function AboutPage({ onNavigate }: PageProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-12">
      <div className="text-center space-y-4">
        <span className="text-xs uppercase tracking-[0.3em] text-neutral-400 font-semibold block">
          Heritage & Ethos
        </span>
        <h1 className="font-serif text-4xl sm:text-6xl text-neutral-900 font-light">
          The VELOUR Atelier
        </h1>
        <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto font-light leading-relaxed">
          Founded on the principle that luxury is found in tactile subtlety, architectural restraint, and heirloom durability.
        </p>
      </div>

      <div className="aspect-[16/9] w-full overflow-hidden bg-neutral-100">
        <img
          src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&q=85"
          alt="Velour Studio Workspace"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-sm text-neutral-600 font-light leading-relaxed">
        <div className="space-y-4">
          <h2 className="font-serif text-2xl text-neutral-900 font-normal">
            Conscious Sourcing
          </h2>
          <p>
            Every meter of fabric in our catalog is traced back to ethical mills in Biella, Japan, and Inner Mongolia. We reject synthetic fast-fashion blends in favor of raw Mulberry silk, GOTS-certified organic cotton, and virgin worsted wool.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="font-serif text-2xl text-neutral-900 font-normal">
            Architectural Precision
          </h2>
          <p>
            Our patterns are draped by hand to provide ease of movement while maintaining crisp sculptural drape. Each garment undergoes strict quality inspections, reinforced inner seams, and custom natural horn hardware.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ContactPage({ onNavigate }: PageProps) {
  const { showToast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    showToast('Your message has been dispatched to our concierge.', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-12">
      <div className="text-center space-y-4">
        <span className="text-xs uppercase tracking-[0.3em] text-neutral-400 font-semibold block">
          Client Concierge
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl text-neutral-900 font-light">
          Get in Touch
        </h1>
        <p className="text-sm text-neutral-500 max-w-md mx-auto font-light">
          For sizing advisement, bespoke alterations, or order inquiries, our private stylists are at your disposal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-6 border-y border-neutral-200 text-xs">
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-neutral-900 shrink-0" />
          <div>
            <span className="font-semibold uppercase tracking-wider text-neutral-900 block mb-1">Email Concierge</span>
            <p className="text-neutral-500">concierge@velour-atelier.com</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Phone className="w-5 h-5 text-neutral-900 shrink-0" />
          <div>
            <span className="font-semibold uppercase tracking-wider text-neutral-900 block mb-1">Direct Line</span>
            <p className="text-neutral-500">+1 (800) 835-6871 (Mon-Fri 9-18 EST)</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-neutral-900 shrink-0" />
          <div>
            <span className="font-semibold uppercase tracking-wider text-neutral-900 block mb-1">Atelier Flagship</span>
            <p className="text-neutral-500">742 Madison Ave, New York, NY</p>
          </div>
        </div>
      </div>

      {submitted ? (
        <div className="bg-neutral-50 border border-neutral-200 p-8 text-center space-y-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <h3 className="font-serif text-2xl text-neutral-900">Message Received</h3>
          <p className="text-xs text-neutral-500 uppercase tracking-wider">
            Our atelier representative will respond within 12 business hours.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto bg-white border border-neutral-200 p-8 shadow-xs">
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-700 font-semibold mb-1">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-neutral-300 focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-700 font-semibold mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-neutral-300 focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-700 font-semibold mb-1">Subject</label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={e => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-neutral-300 focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-700 font-semibold mb-1">Message</label>
            <textarea
              rows={4}
              required
              value={formData.message}
              onChange={e => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-neutral-300 focus:outline-none focus:border-black"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-black text-white text-xs uppercase tracking-widest font-semibold hover:bg-neutral-800 transition-colors"
          >
            Send Inquiry
          </button>
        </form>
      )}
    </div>
  );
}

export function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24 space-y-8 text-neutral-700 font-light text-sm leading-relaxed">
      <div className="border-b border-neutral-200 pb-6">
        <span className="text-xs uppercase tracking-[0.25em] text-neutral-400 font-semibold block mb-1">Legal</span>
        <h1 className="font-serif text-4xl text-neutral-900 font-normal">Privacy Policy</h1>
        <p className="text-xs text-neutral-500 mt-1">Last Updated: January 2025</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-serif text-xl text-neutral-900 font-semibold">1. Information We Collect</h2>
        <p>
          VELOUR collects personal identifying details strictly required to process your fashion wardrobe orders, arrange doorstep delivery, and maintain your account profile. This includes your name, shipping address, contact telephone, and email address.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl text-neutral-900 font-semibold">2. Cash on Delivery & Payment Security</h2>
        <p>
          We do not store full payment credentials on unencrypted servers. When opting for Cash on Delivery, your address and phone number are securely shared exclusively with our contracted courier partner for the physical fulfillment of your package.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl text-neutral-900 font-semibold">3. Third-Party Disclosures</h2>
        <p>
          We will never sell, lease, or monetize your client data with third-party advertising brokers. Your information is held with strict confidentiality.
        </p>
      </section>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24 space-y-8 text-neutral-700 font-light text-sm leading-relaxed">
      <div className="border-b border-neutral-200 pb-6">
        <span className="text-xs uppercase tracking-[0.25em] text-neutral-400 font-semibold block mb-1">Legal</span>
        <h1 className="font-serif text-4xl text-neutral-900 font-normal">Terms of Service</h1>
        <p className="text-xs text-neutral-500 mt-1">Last Updated: January 2025</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-serif text-xl text-neutral-900 font-semibold">1. Orders & Pricing</h2>
        <p>
          All prices displayed are in US Dollars (USD). While we strive for accuracy, errors in catalog stock or pricing will be addressed promptly. We reserve the right to decline or cancel orders if necessary.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl text-neutral-900 font-semibold">2. 30-Day Bespoke Returns</h2>
        <p>
          Garments may be returned or exchanged within 30 days of doorstep receipt, provided they are in unworn, unwashed condition with all original atelier labels and security ribbons intact.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl text-neutral-900 font-semibold">3. Cash on Delivery Terms</h2>
        <p>
          Customers choosing Cash on Delivery are expected to provide exact payment upon doorstep arrival of the courier. Refusal of delivery without reasonable cause may affect privilege membership status.
        </p>
      </section>
    </div>
  );
}
