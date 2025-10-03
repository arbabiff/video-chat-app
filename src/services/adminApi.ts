import { getToken, getAdminToken } from '../utils/auth';

// Base API URL
const API_BASE_URL = '/api';

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const adminToken = getAdminToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (adminToken) {
    // Fallback for admin-only flows (phone-based admin login)
    headers['x-admin-token'] = adminToken;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'درخواست با خطا مواجه شد');
  }

  return response.json();
}

// ==================== SUBSCRIPTIONS ====================

export interface Subscription {
  id: number;
  name: string;
  price: number;
  duration: number;
  description: string;
  features: string[];
  active: boolean;
  displayInApp: boolean;
  giftLocks: number;
  videoQuality: string;
  unlimitedTime: boolean;
  giftEnabled: boolean;
  isSystem?: boolean;
}

export const subscriptionApi = {
  // Get all subscriptions
  getAll: async (): Promise<{ success: boolean; data: Subscription[] }> => {
    return apiCall<{ success: boolean; data: Subscription[] }>('/subscriptions');
  },

  // Get subscription by ID
  getById: async (id: number): Promise<{ success: boolean; data: Subscription }> => {
    return apiCall<{ success: boolean; data: Subscription }>(`/subscriptions/${id}`);
  },

  // Create new subscription
  create: async (subscription: Omit<Subscription, 'id' | 'isSystem'>): Promise<{ success: boolean; data: Subscription }> => {
    return apiCall<{ success: boolean; data: Subscription }>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscription),
    });
  },

  // Update subscription
  update: async (id: number, updates: Partial<Subscription>): Promise<{ success: boolean; data: Subscription }> => {
    return apiCall<{ success: boolean; data: Subscription }>(`/subscriptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  // Delete subscription
  delete: async (id: number): Promise<{ success: boolean; data: Subscription }> => {
    return apiCall<{ success: boolean; data: Subscription }>(`/subscriptions/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== USERS ====================

export interface User {
  id: string;
  phone: string;
  status: 'active' | 'banned' | 'inactive';
  subscription: string;
  joinDate: string;
  violations: number;
  lastActive: string;
  totalChats: number;
  reportsMade: number;
  reportsReceived: number;
  invitedUsers: number;
}

export const userApi = {
  // Get all users with filters
  getAll: async (filters?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ success: boolean; data: User[]; pagination?: any }> => {
    const queryParams = new URLSearchParams(filters as any).toString();
    return apiCall<{ success: boolean; data: User[]; pagination?: any }>(
      `/admin/users${queryParams ? `?${queryParams}` : ''}`
    );
  },

  // Get user by ID
  getById: async (id: string): Promise<{ success: boolean; data: User }> => {
    return apiCall<{ success: boolean; data: User }>(`/admin/users/${id}`);
  },

  // Update user status
  updateStatus: async (id: string, status: string): Promise<{ success: boolean; data: User }> => {
    return apiCall<{ success: boolean; data: User }>(`/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Delete user
  delete: async (id: string): Promise<{ success: boolean }> => {
    return apiCall<{ success: boolean }>(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== REPORTS ====================

export interface Report {
  id: number;
  reporter: string;
  reported: string;
  reason: string;
  date: string;
  status: 'pending' | 'resolved';
  violationType: 'temporary' | 'permanent';
  punishment: string;
}

export const reportApi = {
  // Get all reports
  getAll: async (filters?: any): Promise<{ success: boolean; data: Report[] }> => {
    const queryParams = new URLSearchParams(filters).toString();
    return apiCall<{ success: boolean; data: Report[] }>(
      `/reports${queryParams ? `?${queryParams}` : ''}`
    );
  },

  // Update report status
  updateStatus: async (id: number, status: string): Promise<{ success: boolean; data: Report }> => {
    return apiCall<{ success: boolean; data: Report }>(`/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// ==================== DASHBOARD ====================

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalSubscriptions: number;
  totalRevenue: number;
  onlineUsers: number;
  dailyChats: number;
}

export const dashboardApi = {
  getStats: async (): Promise<{ success: boolean; data: DashboardStats }> => {
    return apiCall<{ success: boolean; data: DashboardStats }>('/admin/dashboard');
  },
};

// ==================== SYSTEM ====================

export const systemApi = {
  getHealth: async (): Promise<{ success: boolean; data: any }> => {
    return apiCall<{ success: boolean; data: any }>('/admin/system/health');
  },
};

