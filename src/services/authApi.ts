import { getToken } from '../utils/auth';

const API_BASE_URL = '/api';

export async function login(loginId: string, password: string): Promise<{ success: boolean; token: string; user: any }>{
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: loginId, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'ورود ناموفق بود');
  }
  return res.json();
}

export async function getMe(): Promise<{ success: boolean; user: any } | null> {
  try {
    const token = getToken();
    if (!token) return null;
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
