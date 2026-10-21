import type { DefJob } from '../jadwal';
import { tanggalWib } from '../fee/cair';
import { beritaAcara } from '../fee/layanan';
import { buatBeritaAcara, type BarisStok } from '../fee/rekonsiliasi';

/**
 * Sumber stok/selisih Lumbung per pekan. ASUMSI: belum ada endpoint/kontrak untuk data ini; dipasang lewat
 * `pasangSumberStok` oleh adapter nyata. Tanpa sumber, job hanya mencatat peringatan (tidak menerbitkan CSV kosong).
 */
type SumberStok = (mulai: string, selesai: string) => Promise<BarisStok[]>;
let sumberStok: SumberStok | null = null;
export const pasangSumberStok = (s: SumberStok) => void (sumberStok = s);

/** Senin 09.00 WIB: berita acara pekan lalu (Senin-Minggu). */
const job: DefJob = {
  nama: 'rekonsiliasi-lumbung',
  jadwal: { tipe: 'mingguan', hari: 1, jam: 9 },
  jalankan: async (sekarang) => {
    const selesai = tanggalWib(new Date(sekarang.getTime() - 86400_000)); // Minggu
    const mulai = tanggalWib(new Date(sekarang.getTime() - 7 * 86400_000)); // Senin lalu
    if (!sumberStok) {
      console.warn('[job] rekonsiliasi-lumbung: sumber stok belum dikonfigurasi, berita acara tidak diterbitkan');
      return null;
    }
    const ba = buatBeritaAcara(mulai, selesai, await sumberStok(mulai, selesai));
    beritaAcara.set(mulai, ba);
    return ba;
  }
};
export default job;
