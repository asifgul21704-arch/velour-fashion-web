/**
 * VELOUR API Client Helper
 * Handles authentication tokens, session tracking, and request headers seamlessly.
 * Configured with VITE_API_URL support for Vercel and production deployments.
 */

const TOKEN_KEY = 'velour_auth_token';
const SESSION_KEY = 'velour_session_id';

/**
 * Base API URL configured via environment variable (VITE_API_URL).
 * When empty, relative paths (/api/...) are used for same-domain deployments.
 */
export const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL || '').replace(/\/$/, '');

/**
 * Fallback image in case an external CDN image is temporarily unavailable
 */
export const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80';

export function getApiUrl(endpoint: string): string {
  if (!endpoint) return '';
  // If already an absolute URL, return as-is
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!API_BASE_URL) {
    return cleanEndpoint;
  }
  return `${API_BASE_URL}${cleanEndpoint}`;
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.warn('Failed to store auth token', e);
  }
}

export function removeAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.warn('Failed to remove auth token', e);
  }
}

export function getGuestSessionId(): string {
  try {
    let sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
  } catch (e) {
    return `sess_${Date.now()}`;
  }
}

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const sessionId = getGuestSessionId();

  const headers = new Headers(options.headers || {});

  // Always supply JSON content type if body exists and not already defined
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Supply guest session identifier
  if (!headers.has('x-session-id')) {
    headers.set('x-session-id', sessionId);
  }

  // Attach Bearer token if present
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const mergedOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include' // send cookies alongside token
  };

  const finalUrl = getApiUrl(endpoint);
  try {
    return await fetch(finalUrl, mergedOptions);
  } catch (error) {
    console.warn(`[VELOUR API] Request failed for ${finalUrl}:`, error);
    throw error;
  }
}
