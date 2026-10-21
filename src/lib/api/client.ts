import type { components, paths } from './schema';

/** Tipe diturunkan dari contract/openapi.yaml (jangan ditulis tangan). */
export type DaftarVendorAdmin =
  paths['/admin/vendor']['get']['responses']['200']['content']['application/json'];
export type DaftarPesananAdmin =
  paths['/admin/pesanan']['get']['responses']['200']['content']['application/json'];
export type KatalogCermin =
  paths['/admin/katalog-cermin']['get']['responses']['200']['content']['application/json'];
export type StatusVendor = components['schemas']['StatusVendor'];
export type StatusPesanan = components['schemas']['StatusPesanan'];

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown
  ) {
    super(`API ${status}`);
  }
}

/** Klien admin tipis. `token` = JWT aud=titipo, role=admin (dari auth Lumbung). */
export function buatKlienAdmin(baseUrl: string, token: string, fetchFn: typeof fetch = fetch) {
  async function get<T>(path: string, query?: Record<string, string | number | undefined>) {
    const url = new URL(path, baseUrl);
    for (const [k, v] of Object.entries(query ?? {})) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
    const res = await fetchFn(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    });
    const body: unknown = await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(res.status, body);
    return body as T;
  }
  return {
    daftarVendor: (q: { status?: StatusVendor; batas?: number; lanjut?: string } = {}) =>
      get<DaftarVendorAdmin>('/admin/vendor', q),
    daftarPesanan: (q: { status?: StatusPesanan; hari?: string; batas?: number; lanjut?: string } = {}) =>
      get<DaftarPesananAdmin>('/admin/pesanan', q),
    katalogCermin: () => get<KatalogCermin>('/admin/katalog-cermin')
  };
}
