/**
 * Aturan kurasi vendor sisi web (BRD 10-vendor-kurasi BR-101, BR-102, BR-107; produk/21 §2.1-2.3).
 * Server backend tetap penentu; fungsi ini hanya untuk validasi awal dan tampilan.
 */
import type { StatusVendor, VendorAdmin } from '$lib/api/tipe';

export const SKOR_LOLOS = 80;
export const KUOTA_AKTIF = 30;
export const HARI_SKORS = [3, 7] as const;
export const MAKS_SKORS_90_HARI = 3;
export const JENDELA_SKORS_HARI = 90;
export const STATUS_VENDOR: readonly StatusVendor[] = ['calon', 'aktif', 'prioritas', 'skors', 'keluar'];

export const adalahStatusVendor = (s: string | null): s is StatusVendor => !!s && (STATUS_VENDOR as readonly string[]).includes(s);

export type StatusSyarat = 'lolos' | 'gagal' | 'tidak_diketahui';
export interface ItemSyarat {
  kunci: 'ktp_domisili' | 'perangkat' | 'kebersihan' | 'sla' | 'deposit';
  label: string;
  status: StatusSyarat;
}

/**
 * 5 syarat BR-101. Kontrak admin hanya mengirim `skor_kebersihan` dan nama berkas `dokumen`; syarat lain
 * ditampilkan `tidak_diketahui` (ASUMSI: nama berkas KTP memuat "ktp"; belum ada field resmi).
 */
export function cekSyarat(v: Pick<VendorAdmin, 'skor_kebersihan' | 'dokumen'>): ItemSyarat[] {
  const dok = (v.dokumen ?? []).map((d) => d.toLowerCase());
  const ada = (kata: string) => (dok.some((d) => d.includes(kata)) ? 'lolos' : 'tidak_diketahui');
  return [
    { kunci: 'ktp_domisili', label: 'KTP dan domisili radius 5 km dari titik serah Lumbung', status: ada('ktp') },
    { kunci: 'perangkat', label: 'Perangkat Android 9+ atau iOS 16+', status: 'tidak_diketahui' },
    {
      kunci: 'kebersihan',
      label: `Uji kebersihan skor minimal ${SKOR_LOLOS}`,
      status: v.skor_kebersihan === undefined ? 'tidak_diketahui' : v.skor_kebersihan >= SKOR_LOLOS ? 'lolos' : 'gagal'
    },
    { kunci: 'sla', label: 'Setuju SLA (tanda tangan digital)', status: 'tidak_diketahui' },
    { kunci: 'deposit', label: 'Deposit Rp100.000 diakumulasi dari fee', status: 'tidak_diketahui' }
  ];
}

export const lolosSkor = (v: Pick<VendorAdmin, 'skor_kebersihan'>) => (v.skor_kebersihan ?? -1) >= SKOR_LOLOS;

export type HasilValidasi<T> = { ok: true; nilai: T } | { ok: false; galat: string };

export type InputVerifikasi = { setuju: true; kuota_harian: 30 } | { setuju: false; alasan: string };

/**
 * Setuju => calon -> aktif dengan kuota 30 (kuota 60 hanya Prioritas, lewat usulan metrik; openapi mengizinkan enum 30|60,
 * tiket ini hanya 30). Tolak => alasan wajib.
 */
export function validasiVerifikasi(f: { setuju: string | null; alasan?: string | null }, v?: Pick<VendorAdmin, 'skor_kebersihan'>): HasilValidasi<InputVerifikasi> {
  if (f.setuju === 'true') {
    if (v && v.skor_kebersihan !== undefined && !lolosSkor(v))
      return { ok: false, galat: `Skor kebersihan ${v.skor_kebersihan} di bawah ${SKOR_LOLOS}; calon tidak boleh disetujui.` };
    return { ok: true, nilai: { setuju: true, kuota_harian: KUOTA_AKTIF } };
  }
  if (f.setuju === 'false') {
    const alasan = (f.alasan ?? '').trim();
    if (!alasan) return { ok: false, galat: 'Alasan penolakan wajib diisi.' };
    return { ok: true, nilai: { setuju: false, alasan } };
  }
  return { ok: false, galat: 'Pilihan setuju/tolak tidak valid.' };
}

export interface InputSkors {
  hari: 3 | 7;
  alasan: string;
}

/** Skors hanya 3 atau 7 hari; alasan wajib. */
export function validasiSkors(f: { hari: string | null; alasan?: string | null }): HasilValidasi<InputSkors> {
  const hari = Number(f.hari);
  if (!(f.hari !== null && /^\d+$/.test(f.hari) && (HARI_SKORS as readonly number[]).includes(hari)))
    return { ok: false, galat: 'Skors hanya boleh 3 atau 7 hari.' };
  const alasan = (f.alasan ?? '').trim();
  if (!alasan) return { ok: false, galat: 'Alasan skors wajib diisi.' };
  return { ok: true, nilai: { hari: hari as 3 | 7, alasan } };
}

/** Jumlah skors dalam 90 hari terakhir (berdasarkan tanggal ISO). */
export function hitungSkors90Hari(tanggalSkors: readonly string[], sekarang: Date): number {
  const batas = sekarang.getTime() - JENDELA_SKORS_HARI * 86400_000;
  return tanggalSkors.filter((t) => Date.parse(t) > batas && Date.parse(t) <= sekarang.getTime()).length;
}

/** Skors baru ini menjadi yang ke-3 (atau lebih) dalam 90 hari => vendor keluar (BR-102). */
export const skorsBerikutBerakibatKeluar = (tanggalSkors: readonly string[], sekarang: Date) =>
  hitungSkors90Hari(tanggalSkors, sekarang) + 1 >= MAKS_SKORS_90_HARI;
