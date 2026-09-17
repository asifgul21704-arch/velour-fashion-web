import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface AdminLoginPageProps {
  onNavigate: (path: string) => void;
}

export function AdminLoginPage({ onNavigate }: AdminLoginPageProps) {
  const { login, isAdmin, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('admin@velour.com');
  const [password, setPassword] = useState('admin123');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      onNavigate('/admin');
    }
  }, [isAuthenticated, isAdmin, onNavigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const res = await login(email.trim(), password);
    setIsLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Invalid administrator credentials.');
      return;
    }

    // Role check is handled in AuthContext; if admin, state will update
    if (res.user?.role !== 'admin') {
      setErrorMsg('This account does not have administrator privileges.');
      return;
    }

    onNavigate('/admin');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20 sm:py-28">
      <div className="bg-[#121212] text-white p-8 sm:p-10 shadow-2xl border border-neutral-800 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-semibold block">
            Executive Security Gate
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-white font-light">
            VELOUR Atelier Management
          </h1>
          <p className="text-xs text-neutral-400 font-light">
            Authorized staff and administrator sign-in only.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Demo Credential Banner */}
        <div className="p-3 bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-white uppercase tracking-wider text-[10px]">
            <KeyRound className="w-3.5 h-3.5 text-neutral-400" />
            <span>Pre-Configured Admin Credentials</span>
          </div>
          <p className="text-neutral-400">
            Email: <strong className="text-neutral-200">admin@velour.com</strong> &bull; Password: <strong className="text-neutral-200">admin123</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-1.5">
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 text-xs bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-1.5">
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 text-xs bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-white text-black text-xs uppercase tracking-[0.25em] font-semibold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Enter Administration</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => onNavigate('/login')}
            className="text-xs text-neutral-500 hover:text-white transition-colors"
          >
            Return to Customer Storefront
          </button>
        </div>
      </div>
    </div>
  );
}
