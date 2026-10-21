import { BIAYA_TRANSFER, JAM_TARIK_MULAI_WIB, MIN_TARIK, hitungFee, type PesananFee, type RincianFee } from './hitung';

export type JenisLedger = 'cair' | 'tarik' | 'biaya_transfer';

/** Baris ledger append-only; disimpan untuk audit 2 tahun (tidak ada operasi ubah/hapus). */
export interface BarisLedger {
  seq: number;
  waktu: string;
  id_vendor: string;
  jenis: JenisLedger;
  /** Kode pesanan untuk `cair`; kunci idempotensi pencairan. */
  kode?: string;
  rincian?: RincianFee;
  /** Perubahan saldo (+/-). */
  delta: number;
  saldo_setelah: number;
  tunggakan_setelah: number;
  catatan?: string;
  /** Aktor untuk aksi manual (cair manual / tarik); job otomatis = 'job:cair-fee'. */
  aktor: string;
}

export interface Akun {
  saldo: number;
  /** Sisa denda yang belum terpotong (saldo tidak boleh negatif; dibawa ke minggu depan). */
  tunggakan: number;
}

export class GalatLedger extends Error {
  constructor(
    readonly kode: 'DI_BAWAH_MINIMUM' | 'SALDO_KURANG' | 'BELUM_JAM_TARIK',
    pesan: string
  ) {
    super(pesan);
    this.name = 'GalatLedger';
  }
}

export interface Ledger {
  cair(p: PesananFee, opsi: { aktor: string; waktu: Date }): BarisLedger | null;
  tarik(id_vendor: string, jumlah: number, opsi: { aktor: string; waktu: Date }): { diterima: number; baris: BarisLedger[] };
  akun(id_vendor: string): Akun;
  baris(): readonly BarisLedger[];
}

/** Jam WIB (0-23) dari sebuah waktu. */
export const jamWib = (d: Date) => new Date(d.getTime() + 7 * 3600_000).getUTCHours();

export function buatLedgerMemori(): Ledger {
  const daftar: BarisLedger[] = [];
  const akun = new Map<string, Akun>();
  const sudahCair = new Set<string>();
  const ambil = (id: string): Akun => {
    let a = akun.get(id);
    if (!a) akun.set(id, (a = { saldo: 0, tunggakan: 0 }));
    return a;
  };
  const tulis = (b: Omit<BarisLedger, 'seq' | 'saldo_setelah' | 'tunggakan_setelah'>) => {
    const a = ambil(b.id_vendor);
    const baris: BarisLedger = Object.freeze({ ...b, seq: daftar.length + 1, saldo_setelah: a.saldo, tunggakan_setelah: a.tunggakan });
    daftar.push(baris);
    return baris;
  };

  return {
    cair(p, { aktor, waktu }) {
      if (sudahCair.has(p.kode)) return null; // idempoten: satu pesanan dicairkan sekali
      sudahCair.add(p.kode);
      const rincian = hitungFee(p);
      const a = ambil(p.id_vendor);
      const awal = a.saldo;
      if (rincian.bersih >= 0) {
        // Bayar tunggakan denda lebih dulu, sisanya masuk saldo.
        const bayar = Math.min(a.tunggakan, rincian.bersih);
        a.tunggakan -= bayar;
        a.saldo += rincian.bersih - bayar;
      } else {
        // Potong dari saldo, saldo tidak pernah negatif; sisa dibawa sebagai tunggakan.
        const potong = Math.min(a.saldo, -rincian.bersih);
        a.saldo -= potong;
        a.tunggakan += -rincian.bersih - potong;
      }
      return tulis({
        waktu: waktu.toISOString(),
        id_vendor: p.id_vendor,
        jenis: 'cair',
        kode: p.kode,
        rincian,
        delta: a.saldo - awal,
        aktor
      });
    },

    tarik(id_vendor, jumlah, { aktor, waktu }) {
      if (jamWib(waktu) < JAM_TARIK_MULAI_WIB)
        throw new GalatLedger('BELUM_JAM_TARIK', `Saldo bisa ditarik mulai ${String(JAM_TARIK_MULAI_WIB).padStart(2, '0')}.00 WIB`);
      if (!Number.isInteger(jumlah) || jumlah < MIN_TARIK)
        throw new GalatLedger('DI_BAWAH_MINIMUM', `Minimal tarik Rp${MIN_TARIK}`);
      const a = ambil(id_vendor);
      if (jumlah > a.saldo) throw new GalatLedger('SALDO_KURANG', 'Saldo tidak cukup');
      a.saldo -= jumlah;
      const t = waktu.toISOString();
      const utama = tulis({ waktu: t, id_vendor, jenis: 'tarik', delta: -jumlah, aktor });
      // Biaya transfer Rp2.500 ditanggung vendor: dana diterima = jumlah - biaya; saldo turun sebesar jumlah penuh.
      const biaya = tulis({ waktu: t, id_vendor, jenis: 'biaya_transfer', delta: 0, catatan: `biaya transfer ${BIAYA_TRANSFER} dipotong dari dana diterima`, aktor });
      return { diterima: jumlah - BIAYA_TRANSFER, baris: [utama, biaya] };
    },

    akun: (id) => ({ ...ambil(id) }),
    baris: () => [...daftar]
  };
}
