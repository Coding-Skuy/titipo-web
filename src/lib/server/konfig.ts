import { env } from '$env/dynamic/private';
import { buatKlienAdmin, type KlienAdmin } from '$lib/api/klien';

/** Basis API backend (asumsi nama env; belum ada di dokumen): TITIPO_API_URL. Default lokal sesuai openapi. */
export function urlApi(): string {
  return env.TITIPO_API_URL ?? 'http://localhost:8080';
}

/** Klien admin memakai token sesi admin; service key tidak pernah dipakai/dikirim ke browser. */
export function klienDari(token: string | null): KlienAdmin {
  return buatKlienAdmin({ baseUrl: urlApi(), token: token ?? '' });
}
