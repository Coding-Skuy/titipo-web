/**
 * Perhitungan bagi fee Varian 1 (keuangan/10-bagi-fee.md §1, BRD 30-keuangan-fee BR-306/307).
 * Ini perhitungan SERVER untuk job cair-fee; klien web tidak pernah menghitung ulang fee (AGENTS.md).
 * Semua uang integer rupiah. ASUMSI pembulatan: floor ke rupiah (ketiga kasus mengikat habis dibagi, tidak terpengaruh).
 */
export const FEE_PERSEN = 12; // % dari total_item
export const BONUS_PRIORITAS_PER_MIL = 5; // 0,5% = 5 per mil
export const ONGKIR_VENDOR = 4000;
export const DENDA_BATAL_SEPIHAK = 15000;
export const MIN_TARIK = 50000;
export const BIAYA_TRANSFER = 2500;
export const JAM_TARIK_MULAI_WIB = 6;

export interface PesananFee {
  kode: string;
  id_vendor: string;
  total_item: number;
  prioritas: boolean;
  /** Batal sepihak < 2 jam sebelum serah -> denda Rp15.000. */
  denda?: boolean;
}

export interface RincianFee {
  fee_vendor: number;
  bonus_prioritas: number;
  ongkir_vendor: number;
  denda: number;
  /** fee_vendor + bonus_prioritas + ongkir_vendor - denda (bisa negatif). */
  bersih: number;
}

export function hitungFee(p: Pick<PesananFee, 'total_item' | 'prioritas' | 'denda'>): RincianFee {
  if (!Number.isInteger(p.total_item) || p.total_item < 0) throw new RangeError('total_item harus integer rupiah >= 0');
  const fee_vendor = Math.floor((p.total_item * FEE_PERSEN) / 100);
  const bonus_prioritas = p.prioritas ? Math.floor((p.total_item * BONUS_PRIORITAS_PER_MIL) / 1000) : 0;
  const denda = p.denda ? DENDA_BATAL_SEPIHAK : 0;
  return {
    fee_vendor,
    bonus_prioritas,
    ongkir_vendor: ONGKIR_VENDOR,
    denda,
    bersih: fee_vendor + bonus_prioritas + ONGKIR_VENDOR - denda
  };
}
