import { getToken } from '../utils/auth';

const API_BASE_URL = '/api';

async function apiGet<T>(endpoint: string): Promise<T> {
  const token = getToken();
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'خطا در دریافت اطلاعات');
  }
  return res.json();
}

export interface PublicSubscription {
  id: number;
  name: string;
  price: number;
  duration: number;
  description?: string;
  features?: string[];
  active: boolean;
  displayInApp?: boolean;
  giftLocks?: number;
  videoQuality?: string;
  unlimitedTime?: boolean;
  giftEnabled?: boolean;
}

export interface PublicRule {
  id: string;
  title: string;
  description?: string;
  violationType?: string;
  punishmentType?: string;
  punishmentDuration?: number;
  isActive?: boolean;
}

export const publicApi = {
  subscriptions: {
    getAll: () => apiGet<{ success: boolean; data: PublicSubscription[] }>(`/subscriptions`),
  },
  rules: {
    getAll: () => apiGet<{ success: boolean; rules: PublicRule[] }>(`/rules`),
  },
};

