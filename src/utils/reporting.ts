// Minimal utilities for capturing a snapshot from a <video> element and uploading it
// to the backend reports snapshot endpoint.

export async function captureSnapshot(
  videoEl: HTMLVideoElement,
  options?: { maxWidth?: number; quality?: number }
): Promise<Blob> {
  const maxWidth = options?.maxWidth ?? 640;
  const quality = options?.quality ?? 0.9; // browser-side; server still recompresses

  const videoWidth = videoEl.videoWidth;
  const videoHeight = videoEl.videoHeight;
  if (!videoWidth || !videoHeight) {
    throw new Error('Video element has no video stream');
  }

  const scale = Math.min(1, maxWidth / videoWidth);
  const targetWidth = Math.round(videoWidth * scale);
  const targetHeight = Math.round(videoHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get canvas context');
  ctx.drawImage(videoEl, 0, 0, targetWidth, targetHeight);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Failed to create snapshot blob'));
        resolve(blob);
      },
      'image/jpeg',
      quality
    );
  });
}

export async function uploadSnapshot(
  snapshot: Blob,
  token: string,
  baseUrl = ''
): Promise<{ url: string; expiresAt: string }> {
  const form = new FormData();
  const file = new File([snapshot], 'snapshot.jpg', { type: 'image/jpeg' });
  form.append('snapshot', file);

  const res = await fetch(`${baseUrl}/api/reports/snapshots`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Snapshot upload failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.snapshot;
}

