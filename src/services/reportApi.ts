import { getToken } from '../utils/auth';

const API_BASE_URL = '/api';

export async function uploadSnapshot(file: Blob): Promise<{ url: string } | null> {
  try {
    const token = getToken();
    const form = new FormData();
    form.append('snapshot', file, `snapshot_${Date.now()}.jpg`);

    const res = await fetch(`${API_BASE_URL}/reports/snapshots`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } as any : undefined,
      body: form,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.snapshot?.url ? { url: json.snapshot.url } : null;
  } catch {
    return null;
  }
}

export interface SubmitReportPayload {
  violationType: string; // backend keys (e.g., inappropriate_content)
  description?: string;
  evidence?: string[]; // URLs
  reportedUserId?: string | null;
  candidateUserIds?: string[]; // optional
  suggestedReportedUserId?: string | null;
}

export async function submitReport(payload: SubmitReportPayload): Promise<boolean> {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}
