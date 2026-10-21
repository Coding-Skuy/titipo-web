import { GalatApi } from '$lib/api/klien';

export interface GalatTampil {
  status: number;
  galat: string;
}

/** Terjemahan galat baku (FSD 30-kontrak): 401, 403, 404, 409, 422, 429 -> pesan admin. */
export function petakanGalat(e: unknown): GalatTampil {
  if (!(e instanceof GalatApi)) return { status: 502, galat: 'Backend tidak terjangkau. Coba lagi.' };
  switch (e.status) {
    case 401:
      return { status: 401, galat: 'Sesi berakhir. Masuk ulang melalui Lumbung.' };
    case 403:
      return { status: 403, galat: 'Peran ditolak: aksi tulis butuh peran admin (operasi hanya baca) dan token beraudiens titipo.' };
    case 404:
      return { status: 404, galat: 'Vendor tidak ditemukan.' };
    case 409:
      return { status: 409, galat: `Konflik: ${e.message}` };
    case 422:
      return { status: 422, galat: `Validasi ditolak server: ${e.message}` };
    case 429:
      return { status: 429, galat: 'Terlalu banyak permintaan (batas 600 per menit per IP). Tunggu sebentar lalu ulangi.' };
    default:
      return { status: e.status >= 400 && e.status < 600 ? e.status : 502, galat: `${e.kode}: ${e.message}` };
  }
}
