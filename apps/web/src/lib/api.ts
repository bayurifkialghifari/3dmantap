import type { ProductTemplate, BusinessSettings } from '@3dmantap/shared';
let visitor = localStorage.getItem('3dmantap:visitor');
if (!visitor) {
  visitor = crypto.randomUUID() + crypto.randomUUID();
  localStorage.setItem('3dmantap:visitor', visitor);
}
export const visitorToken = visitor;
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('x-visitor-token', visitorToken);
  if (options.body && !(options.body instanceof FormData))
    headers.set('Content-Type', 'application/json');
  const response = await fetch('/api/v1' + path, { ...options, headers, credentials: 'include' });
  const data = await response.json().catch(() => ({ error: 'Server tidak tersedia' }));
  if (!response.ok) throw new Error(data.error ?? data.message ?? 'Permintaan gagal');
  return data as T;
}
export const getTemplates = async () => {
  if (!navigator.onLine) {
    const cached = localStorage.getItem('3dmantap:public-catalog');
    if (cached) return JSON.parse(cached) as ProductTemplate[];
  }
  const templates = await api<ProductTemplate[]>('/templates');
  localStorage.setItem('3dmantap:public-catalog', JSON.stringify(templates));
  return templates;
};
export const getSettings = () => api<BusinessSettings>('/settings');
export const assetUrl = (
  id: string,
  context?: { inquiry?: string; design?: string; room?: string; token?: string },
) =>
  '/api/v1/assets/' +
  id +
  '?' +
  new URLSearchParams({ accessToken: visitorToken, ...context }).toString();
export async function upload(file: File, kind = 'artwork') {
  const body = new FormData();
  body.append('file', file);
  body.append('kind', kind);
  return api<{ id: string; width: number; height: number; name: string }>('/assets', {
    method: 'POST',
    body,
  });
}
export const downloadJson = (name: string, data: unknown) => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};
