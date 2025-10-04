// Lightweight auth utilities for the user-facing app (no admin logic)

export function getToken(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', token);
  } catch {}
}

export function clearToken() {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
  } catch {}
}

export function parseJwt(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    // pad base64 string
    const pad = base64.length % 4;
    const padded = base64 + (pad ? '='.repeat(4 - pad) : '');
    const json = typeof atob !== 'undefined' ? atob(padded) : Buffer.from(padded, 'base64').toString('binary');
    // decodeURIComponent may throw on invalid chars; fallback to direct parse
    try {
      return JSON.parse(decodeURIComponent(Array.prototype.map.call(json, (c: string) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')));
    } catch {
      return JSON.parse(json);
    }
  } catch {
    return null;
  }
}

