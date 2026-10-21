/**
 * Metrik repeat-order dan pendamping (metrik/10-repeat-order.md, BRD 20-titip-harian BR-203).
 * Fungsi murni; setara query baku SQL §2 tetapi dihitung dari baris pesanan `selesai`.
 */
export const HARI_REPEAT = 28;
export const TARGET_REPEAT_VENDOR = 0.4;
export const TARGET_REPEAT_KOTA = 0.35;
export const TARGET_TEPAT_SERAH = 95; // %
export const TOLERANSI_SERAH_MENIT = 15;
export const AMBANG_BATAL_VENDOR = 2; // % maksimum
export const TARGET_RATING = 4.5;
export const TARGET_MEDIAN_KONFIRMASI = 20; // menit
export const SYARAT_PRIORITAS_REPEAT = 0.4;
export const SYARAT_PRIORITAS_RATING = 4.7;
export const MINGGU_PRIORITAS = 4;

/** Satu pesanan berstatus `selesai`. */
export interface PesananSelesai {
  id_rumah_tangga: string;
  id_vendor: string;
  /** ISO-8601 UTC waktu serah. */
  diserahkan: string;
}

const HARI_MS = 86400_000;

/**
 * Repeat 28 hari bergulir: rumah tangga dengan >=2 pesanan selesai / rumah tangga aktif (>=1) dalam jendela
 * (sekarang-28h, sekarang]. Kembalikan `null` bila tidak ada rumah tangga aktif (hindari bagi nol).
 */
export function repeat28(pesanan: readonly PesananSelesai[], sekarang: Date, filterVendor?: string): number | null {
  const batas = sekarang.getTime() - HARI_REPEAT * HARI_MS;
  const hitung = new Map<string, number>();
  for (const p of pesanan) {
    if (filterVendor && p.id_vendor !== filterVendor) continue;
    const t = Date.parse(p.diserahkan);
    if (t > batas && t <= sekarang.getTime()) hitung.set(p.id_rumah_tangga, (hitung.get(p.id_rumah_tangga) ?? 0) + 1);
  }
  if (hitung.size === 0) return null;
  let ulang = 0;
  for (const n of hitung.values()) if (n >= 2) ulang++;
  return ulang / hitung.size;
}

export type Lampu = 'hijau' | 'merah' | 'kosong';
const lampu = (nilai: number | null, ok: (n: number) => boolean): Lampu => (nilai === null ? 'kosong' : ok(nilai) ? 'hijau' : 'merah');

export interface PesananMetrik {
  status: string;
  /** ISO UTC. */
  dibuat: string;
  dikonfirmasi?: string;
  janji_serah?: string;
  diserahkan?: string;
  rating?: number;
}

export interface MetrikPendamping {
  tepatSerah: number | null;
  batalVendor: number | null;
  rating30: number | null;
  medianKonfirmasi: number | null;
}

export function median(n: number[]): number | null {
  if (!n.length) return null;
  const s = [...n].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** 4 metrik pendamping. Tepat serah/rating/batal memakai jendela 30 hari kecuali dinyatakan lain; konfirmasi median dari created->confirmed. */
export function hitungPendamping(pesanan: readonly PesananMetrik[], sekarang: Date): MetrikPendamping {
  const batas = sekarang.getTime() - 30 * HARI_MS;
  const dalam = pesanan.filter((p) => Date.parse(p.dibuat) > batas && Date.parse(p.dibuat) <= sekarang.getTime());

  const selesaiBerjanji = dalam.filter((p) => p.status === 'selesai' && p.diserahkan && p.janji_serah);
  const tepat = selesaiBerjanji.filter(
    (p) => Math.abs(Date.parse(p.diserahkan!) - Date.parse(p.janji_serah!)) <= TOLERANSI_SERAH_MENIT * 60_000
  );
  const dibatalkanVendor = dalam.filter((p) => p.status === 'dibatalkan_vendor').length;
  const rating = dalam.filter((p) => p.status === 'selesai' && typeof p.rating === 'number').map((p) => p.rating!);
  const konfirmasi = dalam.filter((p) => p.dikonfirmasi).map((p) => (Date.parse(p.dikonfirmasi!) - Date.parse(p.dibuat)) / 60_000);

  return {
    tepatSerah: selesaiBerjanji.length ? (tepat.length / selesaiBerjanji.length) * 100 : null,
    batalVendor: dalam.length ? (dibatalkanVendor / dalam.length) * 100 : null,
    rating30: rating.length ? rating.reduce((a, b) => a + b, 0) / rating.length : null,
    medianKonfirmasi: median(konfirmasi)
  };
}

export interface LampuPendamping {
  tepatSerah: Lampu;
  batalVendor: Lampu;
  rating30: Lampu;
  medianKonfirmasi: Lampu;
}

export function nilaiLampu(m: MetrikPendamping): LampuPendamping {
  return {
    tepatSerah: lampu(m.tepatSerah, (n) => n >= TARGET_TEPAT_SERAH),
    batalVendor: lampu(m.batalVendor, (n) => n <= AMBANG_BATAL_VENDOR),
    rating30: lampu(m.rating30, (n) => n >= TARGET_RATING),
    medianKonfirmasi: lampu(m.medianKonfirmasi, (n) => n <= TARGET_MEDIAN_KONFIRMASI)
  };
}

export const lampuRepeatVendor = (r: number | null) => lampu(r, (n) => n >= TARGET_REPEAT_VENDOR);
export const lampuRepeatKota = (r: number | null) => lampu(r, (n) => n >= TARGET_REPEAT_KOTA);

export interface DataVendorPrioritas {
  id_vendor: string;
  status: 'aktif' | 'prioritas' | string;
  /** Rating rata-rata terkini. */
  rating: number | null;
}

/**
 * Usul Prioritas (BR-103 + metrik §4.3): repeat vendor >= 40% pada 4 titik mingguan berturut-turut
 * (jendela 28 hari bergulir diukur di akhir tiap minggu, 4 minggu terakhir) dan rating >= 4,7.
 * Hanya vendor `aktif`. Admin tinggal menyetujui; fungsi ini tidak mengubah status apa pun.
 */
export function usulPrioritas(
  vendor: readonly DataVendorPrioritas[],
  pesanan: readonly PesananSelesai[],
  sekarang: Date
): string[] {
  return vendor
    .filter((v) => v.status === 'aktif' && v.rating !== null && v.rating >= SYARAT_PRIORITAS_RATING)
    .filter((v) => {
      for (let k = 0; k < MINGGU_PRIORITAS; k++) {
        const r = repeat28(pesanan, new Date(sekarang.getTime() - k * 7 * HARI_MS), v.id_vendor);
        if (r === null || r < SYARAT_PRIORITAS_REPEAT) return false;
      }
      return true;
    })
    .map((v) => v.id_vendor);
}
