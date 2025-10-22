import { getToken } from '../utils/auth';

const API_BASE_URL = '/api';

export async function blockUser(userId: string): Promise<boolean> {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/users/${userId}/block`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function unblockUser(userId: string): Promise<boolean> {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/users/${userId}/block`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
    });
    return res.ok;
  } catch {
    return false;
  }
}
