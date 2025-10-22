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

export interface ReferralItem {
  id: string;
  status: 'registered' | 'subscribed';
  createdAt: string;
  referrerPhone?: string | null;
  subscriptionType?: 'free' | 'premium' | 'vip' | null;
  subscriptionActivatedAt?: string | null;
  referred: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string | null;
    subscription: { type: 'free' | 'premium' | 'vip'; expiresAt?: string; autoRenew?: boolean };
    createdAt: string;
    lastActive: string;
  } | null;
  notifications: Array<{
    type: 'registered' | 'subscription';
    title: string;
    message: string;
    imageUrl?: string | null;
    createdAt: string;
    isRead: boolean;
  }>;
}

export const referralsApi = {
  getMine: () => apiGet<{ success: boolean; referrals: ReferralItem[] }>(`/referrals/mine`),
  getReferredDetails: (userId: string) => apiGet<{ success: boolean; referred: ReferralItem['referred']; referral: any }>(`/referrals/referred/${userId}`)
};
