/**
 * Katalog cermin Lumbung (TTP-WEB-002). Referensi: FSD/10-alur.md §4, produk/21 §2.6.
 * TitipO tidak membuat SKU sendiri dan tidak menulis ke DB Lumbung: snapshot hanya salinan baca-saja.
 */
import { jalankanDenganRetry, type OpsiRetry } from './../jadwal';

export interface ItemLumbung {
  sku_lumbung: string;
  nama: string;
  harga_per_kg: number;
  stok_gram: number;
}

export interface KatalogLumbung {
  diperbarui: string;
  data: ItemLumbung[];
}

export interface Snapshot {
  /** Mis. `v007`. */
  versi: string;
  diperbarui: string;
  jumlah_sku: number;
  items: ItemLumbung[];
}

export interface StatusSinkron {
  snapshot: Snapshot | null;
  /** Percobaan job terakhir gagal seluruhnya (3 kali) -> banner merah di admin. */
  gagal: boolean;
  galatTerakhir?: string;
}

export interface CatatanJob {
  waktu: string;
  ok: boolean;
  percobaan: number;
  versi?: string;
  galat?: string;
}

/** Port penyimpanan snapshot (DB `titipo`, tabel belum didefinisikan: lihat PR). */
export interface StoreCermin {
  terakhir(): Promise<Snapshot | null>;
  simpan(s: Snapshot): Promise<void>;
  status(): Promise<StatusSinkron>;
  tandaiGagal(galat: string): Promise<void>;
  catat(c: CatatanJob): Promise<void>;
  riwayat(): Promise<readonly CatatanJob[]>;
}

export function buatStoreCerminMemori(): StoreCermin {
  let terakhir: Snapshot | null = null;
  let gagal = false;
  let galat: string | undefined;
  const log: CatatanJob[] = [];
  return {
    async terakhir() {
      return terakhir;
    },
    async simpan(s) {
      terakhir = s;
      gagal = false;
      galat = undefined;
    },
    async status() {
      return { snapshot: terakhir, gagal, galatTerakhir: galat };
    },
    async tandaiGagal(g) {
      gagal = true;
      galat = g;
    },
    async catat(c) {
      log.push(c);
    },
    async riwayat() {
      return [...log];
    }
  };
}

export class GalatValidasiSku extends Error {
  constructor(readonly masalah: string[]) {
    super(`Katalog Lumbung tidak valid: ${masalah.join('; ')}`);
    this.name = 'GalatValidasiSku';
  }
}

/** Validasi SKU: kunci wajib, tanpa duplikat, uang & berat integer tak negatif (satuan baku KONTEKS). */
export function validasiKatalog(k: KatalogLumbung): string[] {
  const masalah: string[] = [];
  if (!Number.isFinite(Date.parse(k.diperbarui))) masalah.push('diperbarui bukan waktu ISO-8601');
  if (!Array.isArray(k.data) || k.data.length === 0) masalah.push('katalog kosong');
  const lihat = new Set<string>();
  for (const it of k.data ?? []) {
    const id = it?.sku_lumbung;
    if (typeof id !== 'string' || id.trim() === '') {
      masalah.push('sku_lumbung kosong');
      continue;
    }
    if (lihat.has(id)) masalah.push(`${id}: duplikat`);
    lihat.add(id);
    if (!it.nama || typeof it.nama !== 'string') masalah.push(`${id}: nama kosong`);
    if (!Number.isInteger(it.harga_per_kg) || it.harga_per_kg < 0) masalah.push(`${id}: harga_per_kg harus integer rupiah >= 0`);
    if (!Number.isInteger(it.stok_gram) || it.stok_gram < 0) masalah.push(`${id}: stok_gram harus integer gram >= 0`);
  }
  return masalah;
}

export function versiBerikut(sebelumnya: string | undefined): string {
  const n = sebelumnya ? Number(/^v(\d+)$/.exec(sebelumnya)?.[1] ?? 0) : 0;
  return `v${String(n + 1).padStart(3, '0')}`;
}

/** Umur snapshot dalam jam; mobile mengunci tombol pesan bila > 24 jam (FSD alur §4). */
export function umurJam(s: Pick<Snapshot, 'diperbarui'> | null, sekarang: Date): number {
  if (!s) return Infinity;
  return (sekarang.getTime() - Date.parse(s.diperbarui)) / 3600_000;
}

export const lebihDari24Jam = (s: Snapshot | null, sekarang: Date) => umurJam(s, sekarang) > 24;

export interface DepSinkron {
  ambilKatalog: () => Promise<KatalogLumbung>;
  store: StoreCermin;
  sekarang?: () => Date;
  retry?: Partial<OpsiRetry>;
}

/** Retry baku job: 3 kali, jeda 30 detik. */
export const RETRY_SINKRON: OpsiRetry = { percobaan: 3, jedaMs: 30_000 };

/**
 * Tarik katalog Lumbung -> validasi SKU -> tulis snapshot vNNN. Gagal 3 kali: snapshot lama tetap berlaku,
 * status `gagal` menyalakan banner merah di admin.
 */
export async function sinkronLumbung(dep: DepSinkron): Promise<CatatanJob> {
  const sekarang = dep.sekarang ?? (() => new Date());
  const hasil = await jalankanDenganRetry(
    async () => {
      const katalog = await dep.ambilKatalog();
      const masalah = validasiKatalog(katalog);
      if (masalah.length) throw new GalatValidasiSku(masalah);
      return katalog;
    },
    { ...RETRY_SINKRON, ...dep.retry }
  );

  if (!hasil.ok) {
    const galat = hasil.galat instanceof Error ? hasil.galat.message : String(hasil.galat);
    await dep.store.tandaiGagal(galat);
    const c: CatatanJob = { waktu: sekarang().toISOString(), ok: false, percobaan: hasil.percobaan, galat };
    await dep.store.catat(c);
    return c;
  }

  const katalog = hasil.nilai!;
  const lama = await dep.store.terakhir();
  const snap: Snapshot = {
    versi: versiBerikut(lama?.versi),
    diperbarui: katalog.diperbarui,
    jumlah_sku: katalog.data.length,
    items: katalog.data
  };
  await dep.store.simpan(snap);
  const c: CatatanJob = { waktu: sekarang().toISOString(), ok: true, percobaan: hasil.percobaan, versi: snap.versi };
  await dep.store.catat(c);
  return c;
}

/** Bukti milestone: log job 7 hari berturut tanpa gagal. */
export function tujuhHariTanpaGagal(log: readonly CatatanJob[], sekarang: Date): boolean {
  const hari = new Set<string>();
  for (const c of log) {
    if (Date.parse(c.waktu) < sekarang.getTime() - 7 * 86400_000) continue;
    if (!c.ok) return false;
    hari.add(c.waktu.slice(0, 10));
  }
  return hari.size >= 7;
}
