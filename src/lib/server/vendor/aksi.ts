import type { KlienAdmin } from '$lib/api/klien';
import { petakanGalat } from '$lib/vendor/galat';
import { skorsBerikutBerakibatKeluar, validasiSkors, validasiVerifikasi } from '$lib/vendor/kurasi';
import type { Audit } from '../audit';

export type HasilAksi = { ok: true; pesan: string; dicatat_oleh: string; peringatan?: string } | { ok: false; status: number; galat: string };

const ambil = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === 'string' ? v : null;
};

/**
 * POST /admin/vendor/{id}/verifikasi. Skor kebersihan dikirim dari form hanya untuk validasi awal;
 * backend tetap memvalidasi ulang. Aktor diambil dari `dicatat_oleh` respons server dan dicatat di audit lokal.
 */
export async function aksiVerifikasi(klien: KlienAdmin, audit: Audit, id: string, f: FormData): Promise<HasilAksi> {
  const skorMentah = ambil(f, 'skor_kebersihan');
  const skor = skorMentah !== null && skorMentah !== '' ? Number(skorMentah) : undefined;
  const v = validasiVerifikasi({ setuju: ambil(f, 'setuju'), alasan: ambil(f, 'alasan') }, { skor_kebersihan: Number.isFinite(skor) ? skor : undefined });
  if (!v.ok) return { ok: false, status: 422, galat: v.galat };
  try {
    const r = await klien.verifikasiVendor(id, v.nilai);
    audit.catat({ aktor: r.dicatat_oleh, aksi: v.nilai.setuju ? 'vendor.verifikasi.setuju' : 'vendor.verifikasi.tolak', sasaran: id, detail: v.nilai.setuju ? { kuota_harian: v.nilai.kuota_harian } : { alasan: v.nilai.alasan } });
    return { ok: true, pesan: v.nilai.setuju ? `Vendor ${id} aktif, kuota ${v.nilai.kuota_harian}/hari.` : `Calon ${id} ditolak.`, dicatat_oleh: r.dicatat_oleh };
  } catch (e) {
    return { ok: false, ...petakanGalat(e) };
  }
}

/** POST /admin/vendor/{id}/skors: hari 3 atau 7; peringatan bila ini skors ke-3 dalam 90 hari (keluar). */
export async function aksiSkors(klien: KlienAdmin, audit: Audit, id: string, f: FormData, sekarang: Date = new Date()): Promise<HasilAksi> {
  const v = validasiSkors({ hari: ambil(f, 'hari'), alasan: ambil(f, 'alasan') });
  if (!v.ok) return { ok: false, status: 422, galat: v.galat };
  const riwayat = audit.baca().filter((c) => c.aksi === 'vendor.skors' && c.sasaran === id).map((c) => c.waktu);
  const keluar = skorsBerikutBerakibatKeluar(riwayat, sekarang);
  try {
    const r = await klien.skorsVendor(id, v.nilai);
    audit.catat({ aktor: r.dicatat_oleh, aksi: 'vendor.skors', sasaran: id, detail: { ...v.nilai } });
    return {
      ok: true,
      pesan: `Vendor ${id} diskors ${v.nilai.hari} hari.`,
      dicatat_oleh: r.dicatat_oleh,
      peringatan: keluar ? 'Skors ke-3 dalam 90 hari: vendor berstatus keluar (ditegakkan server).' : undefined
    };
  } catch (e) {
    return { ok: false, ...petakanGalat(e) };
  }
}
