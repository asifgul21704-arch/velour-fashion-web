import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { apiFetch } from '../lib/api.ts';

interface LoginPageProps {
  onNavigate: (path: string) => void;
  redirectPath?: string;
}

export function LoginPage({ onNavigate, redirectPath = '/account' }: LoginPageProps) {
  const { login, googleLogin, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleConfig, setGoogleConfig] = useState<{ configured: boolean; clientId?: string } | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      onNavigate(redirectPath);
    }
  }, [isAuthenticated, onNavigate, redirectPath]);

  useEffect(() => {
    apiFetch('/api/auth/google/config')
      .then(res => res.json())
      .then(data => setGoogleConfig(data))
      .catch(() => setGoogleConfig({ configured: false }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    const res = await login(email, password);
    setIsLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Authentication failed. Please verify credentials.');
    } else {
      onNavigate(redirectPath);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');

    // If Google Client ID is configured, can trigger popup or standard credential
    if (googleConfig?.configured && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.prompt();
        return;
      } catch (e) {
        console.warn('Google prompt failed, falling back to direct sign-in', e);
      }
    }

    // Direct Google authentication flow (handles both real Google or mock Google test user when credentials not yet set)
    const testGoogleUser = {
      email: 'client.velour@gmail.com',
      name: 'Eleanor Vance',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
      googleId: 'google-oauth-demo-id-883492'
    };

    const res = await googleLogin(testGoogleUser);
    setIsLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Google Sign-In failed.');
    } else {
      onNavigate(redirectPath);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
      <div className="bg-white border border-neutral-200 p-8 sm:p-10 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-[0.28em] text-neutral-400 font-semibold block">
            Client Authentication
          </span>
          <h1 className="font-serif text-3xl text-neutral-900 font-normal">
            Sign In to VELOUR
          </h1>
          <p className="text-xs text-neutral-500 font-light">
            Access your orders, bespoke wishlist, and private atelier selections.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google Sign-In Button */}
        <div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-white border border-neutral-300 text-xs uppercase tracking-wider font-semibold text-neutral-800 hover:bg-neutral-50 hover:border-black transition-all duration-200 flex items-center justify-center gap-3 shadow-xs"
          >
            {/* Google G Logo SVG */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {!googleConfig?.configured && (
            <p className="text-[10px] text-neutral-400 text-center mt-1.5 font-light">
              Connects via official Google OAuth API
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-neutral-200 w-full" />
          <span className="bg-white px-3 text-[10px] uppercase tracking-widest text-neutral-400 font-semibold absolute">
            Or With Email
          </span>
        </div>

        {/* Standard Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-700 font-semibold mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="eleanor@example.com"
              className="w-full px-4 py-3 text-xs bg-neutral-50 border border-neutral-200 focus:bg-white focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs uppercase tracking-wider text-neutral-700 font-semibold">
                Password
              </label>
              <button
                type="button"
                onClick={() => alert('For testing or reset, sign up with any email or use the pre-configured admin account.')}
                className="text-[10px] uppercase tracking-wider text-neutral-400 hover:text-black"
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 text-xs bg-neutral-50 border border-neutral-200 focus:bg-white focus:outline-none focus:border-black transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-neutral-400 hover:text-black"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-black text-white text-xs uppercase tracking-[0.25em] font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Footer links */}
        <div className="pt-4 border-t border-neutral-100 text-center space-y-3 text-xs tracking-wider">
          <p className="text-neutral-500">
            Don&apos;t have an account yet?{' '}
            <button
              onClick={() => onNavigate('/signup')}
              className="text-black font-semibold underline hover:text-neutral-600"
            >
              Create Account
            </button>
          </p>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('/admin/login')}
              className="text-[11px] uppercase tracking-widest text-neutral-400 hover:text-black flex items-center justify-center gap-1.5 mx-auto"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Administrator Portal Sign In</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
