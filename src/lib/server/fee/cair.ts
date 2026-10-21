import { audit as auditGlobal, type Audit } from '../audit';
import type { PesananFee } from './hitung';
import type { BarisLedger, Ledger } from './ledger';

/** Tanggal WIB (YYYY-MM-DD) dari waktu UTC. */
export const tanggalWib = (d: Date) => new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 10);

/** H-1 WIB dari `sekarang`. */
export const hMinus1 = (sekarang: Date) => tanggalWib(new Date(sekarang.getTime() - 86400_000));

/**
 * Sumber data pencairan. ASUMSI: admin openapi hanya menyediakan GET /admin/pesanan (status=selesai) dan
 * GET /admin/vendor (status=prioritas); data denda batal sepihak <2 jam belum punya endpoint (lihat PR).
 */
export interface SumberFee {
  pesananSelesai(tanggal: string): Promise<PesananFee[]>;
}

export type StatusCair = 'sukses' | 'gagal';

export interface StoreStatusCair {
  ambil(tanggal: string): StatusCair | undefined;
  set(tanggal: string, s: StatusCair, galat?: string): void;
}

export function buatStoreStatusCairMemori(): StoreStatusCair {
  const m = new Map<string, StatusCair>();
  return { ambil: (t) => m.get(t), set: (t, s) => void m.set(t, s) };
}

export interface HasilCair {
  tanggal: string;
  ok: boolean;
  jumlahPesanan: number;
  dicairkan: number;
  dilewati: number;
  baris: BarisLedger[];
  galat?: string;
}

export interface DepCair {
  sumber: SumberFee;
  ledger: Ledger;
  status: StoreStatusCair;
  sekarang?: () => Date;
}

/** Cairkan semua pesanan selesai pada `tanggal` (idempoten per kode pesanan). */
export async function cairFee(dep: DepCair, tanggal: string, aktor = 'job:cair-fee'): Promise<HasilCair> {
  const sekarang = dep.sekarang ?? (() => new Date());
  try {
    const pesanan = await dep.sumber.pesananSelesai(tanggal);
    const baris: BarisLedger[] = [];
    let dilewati = 0;
    for (const p of pesanan) {
      const b = dep.ledger.cair(p, { aktor, waktu: sekarang() });
      if (b) baris.push(b);
      else dilewati++;
    }
    dep.status.set(tanggal, 'sukses');
    return { tanggal, ok: true, jumlahPesanan: pesanan.length, dicairkan: baris.length, dilewati, baris };
  } catch (e) {
    dep.status.set(tanggal, 'gagal');
    return { tanggal, ok: false, jumlahPesanan: 0, dicairkan: 0, dilewati: 0, baris: [], galat: e instanceof Error ? e.message : String(e) };
  }
}

/** Job 00.00: proses H-1. */
export const jobCair00 = (dep: DepCair) => cairFee(dep, hMinus1((dep.sekarang ?? (() => new Date()))()));

/** Job ulang 01.00: hanya bila 00.00 gagal. Bila masih gagal, admin memakai tombol cair manual. */
export async function jobCairUlang01(dep: DepCair): Promise<HasilCair | null> {
  const tanggal = hMinus1((dep.sekarang ?? (() => new Date()))());
  if (dep.status.ambil(tanggal) !== 'gagal') return null;
  return cairFee(dep, tanggal, 'job:cair-fee-ulang');
}

/** Cair manual oleh admin: wajib aktor, tercatat di audit. */
export async function cairManual(dep: DepCair, tanggal: string, aktor: string, audit: Audit = auditGlobal): Promise<HasilCair> {
  if (!aktor) throw new Error('aktor wajib untuk cair manual');
  const h = await cairFee(dep, tanggal, aktor);
  audit.catat({ aktor, aksi: 'fee.cair-manual', sasaran: tanggal, detail: { ok: h.ok, dicairkan: h.dicairkan, galat: h.galat } });
  return h;
}
