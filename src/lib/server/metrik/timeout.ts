/**
 * Job timeout-konfirmasi (BRD 20-titip-harian BR-203, produk/21 §2.5): tiap 1 menit, pesanan `menunggu_konfirmasi`
 * yang melewati 30 menit dialihkan otomatis ke vendor cadangan (maksimal 2 kali), lalu refund penuh H+1.
 * Server backend menegakkan batas 2x (422); di sini keputusan diambil lebih dulu agar tidak memanggil sia-sia.
 */
export const TIMEOUT_MENIT = 30;
export const MAKS_ALIH = 2;

export interface PesananMenunggu {
  kode: string;
  id_vendor: string;
  /** Waktu masuk ke vendor saat ini (di-reset tiap pengalihan). ISO UTC. */
  menunggu_sejak: string;
  /** Berapa kali sudah dialihkan. */
  jumlah_alih: number;
}

export type Keputusan = 'tunggu' | 'alihkan' | 'refund';

export function putuskan(p: PesananMenunggu, sekarang: Date): Keputusan {
  const menit = (sekarang.getTime() - Date.parse(p.menunggu_sejak)) / 60_000;
  if (menit < TIMEOUT_MENIT) return 'tunggu';
  return p.jumlah_alih < MAKS_ALIH ? 'alihkan' : 'refund';
}

/** Port. Belum ada endpoint resmi untuk ketiganya selain `alihkan` (lihat PR). */
export interface DepTimeout {
  menungguKonfirmasi(): Promise<PesananMenunggu[]>;
  /** Vendor cadangan radius 2 km (BR-104); `null` bila tidak ada. */
  cariCadangan(p: PesananMenunggu): Promise<string | null>;
  alihkan(kode: string, idVendorCadangan: string): Promise<void>;
  /** Jadwalkan refund penuh pada tanggal H+1 (YYYY-MM-DD WIB). */
  jadwalkanRefund(kode: string, tanggalRefund: string): Promise<void>;
  sekarang?: () => Date;
}

export interface HasilTimeout {
  dialihkan: string[];
  direfund: { kode: string; tanggal: string }[];
  tanpaCadangan: string[];
  galat: { kode: string; pesan: string }[];
}

/** H+1 WIB (YYYY-MM-DD). */
export const hPlus1Wib = (d: Date) => new Date(d.getTime() + 7 * 3600_000 + 86400_000).toISOString().slice(0, 10);

/** Satu putaran job. Galat per pesanan tidak menghentikan pesanan lain; pesanan dicoba lagi pada putaran berikutnya. */
export async function jalankanTimeout(dep: DepTimeout): Promise<HasilTimeout> {
  const sekarang = (dep.sekarang ?? (() => new Date()))();
  const hasil: HasilTimeout = { dialihkan: [], direfund: [], tanpaCadangan: [], galat: [] };
  for (const p of await dep.menungguKonfirmasi()) {
    try {
      const k = putuskan(p, sekarang);
      if (k === 'alihkan') {
        const cadangan = await dep.cariCadangan(p);
        if (!cadangan || cadangan === p.id_vendor) {
          hasil.tanpaCadangan.push(p.kode);
          continue;
        }
        await dep.alihkan(p.kode, cadangan);
        hasil.dialihkan.push(p.kode);
      } else if (k === 'refund') {
        const tanggal = hPlus1Wib(sekarang);
        await dep.jadwalkanRefund(p.kode, tanggal);
        hasil.direfund.push({ kode: p.kode, tanggal });
      }
    } catch (e) {
      hasil.galat.push({ kode: p.kode, pesan: e instanceof Error ? e.message : String(e) });
    }
  }
  return hasil;
}
