import type {
  AksiAdminOk,
  AppError,
  BodySkors,
  BodyVerifikasi,
  DaftarPesanan,
  DaftarVendor,
  KatalogCermin,
  StatusPesanan,
  StatusVendor
} from './tipe';
import { buatUlid } from './ulid';

export class GalatApi extends Error {
  constructor(
    readonly status: number,
    readonly kode: string,
    pesan: string,
    readonly detail?: Record<string, unknown>
  ) {
    super(pesan);
    this.name = 'GalatApi';
  }
}

export interface OpsiKlien {
  /** Mis. https://api.titipo.chefgenie.id/v1 atau http://localhost:8080 */
  baseUrl: string;
  /** JWT Bearer admin/operasi (aud=titipo). Tidak pernah service key. */
  token: string;
  fetch?: typeof fetch;
}

type Query = Record<string, string | number | undefined>;

/** Klien tipis untuk endpoint `/admin/*` sesuai openapi backend. Server adalah penentu angka sah. */
export function buatKlienAdmin(opsi: OpsiKlien) {
  const f = opsi.fetch ?? fetch;
  const dasar = opsi.baseUrl.replace(/\/+$/, '');

  async function panggil<T>(metode: 'GET' | 'POST', jalur: string, query?: Query, body?: unknown): Promise<T> {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined) qs.set(k, String(v));
    const url = `${dasar}${jalur}${qs.size ? `?${qs}` : ''}`;
    const headers: Record<string, string> = {
      authorization: `Bearer ${opsi.token}`,
      accept: 'application/json'
    };
    if (metode === 'POST') {
      headers['content-type'] = 'application/json';
      // FSD 30-kontrak: semua POST membawa kunci ULID klien.
      headers['idempotency-key'] = buatUlid();
    }
    const res = await f(url, { method: metode, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const teks = await res.text();
    const json = teks ? (JSON.parse(teks) as unknown) : undefined;
    if (!res.ok) {
      const e = (json ?? {}) as Partial<AppError>;
      throw new GalatApi(res.status, e.kode ?? `HTTP_${res.status}`, e.pesan ?? res.statusText, e.detail);
    }
    return json as T;
  }

  return {
    daftarVendor: (q: { status?: StatusVendor; batas?: number; lanjut?: string } = {}) =>
      panggil<DaftarVendor>('GET', '/admin/vendor', q),
    verifikasiVendor: (id: string, body: BodyVerifikasi) =>
      panggil<AksiAdminOk>('POST', `/admin/vendor/${encodeURIComponent(id)}/verifikasi`, undefined, body),
    skorsVendor: (id: string, body: BodySkors) =>
      panggil<AksiAdminOk>('POST', `/admin/vendor/${encodeURIComponent(id)}/skors`, undefined, body),
    daftarPesanan: (q: { status?: StatusPesanan; hari?: string; batas?: number; lanjut?: string } = {}) =>
      panggil<DaftarPesanan>('GET', '/admin/pesanan', q),
    alihkanPesanan: (kode: string, idVendorCadangan: string) =>
      panggil<AksiAdminOk>('POST', `/admin/pesanan/${encodeURIComponent(kode)}/alihkan`, undefined, {
        id_vendor_cadangan: idVendorCadangan
      }),
    katalogCermin: () => panggil<KatalogCermin>('GET', '/admin/katalog-cermin'),
    sinkronKatalog: () => panggil<AksiAdminOk>('POST', '/admin/katalog-cermin/sinkron')
  };
}

export type KlienAdmin = ReturnType<typeof buatKlienAdmin>;
