/**
 * Berita acara rekonsiliasi Lumbung (keuangan/10-bagi-fee.md §4): tiap Senin 09.00 WIB, pokok minggu lalu
 * dibayar transfer tunggal + CSV. Susut > 2% dibagi 50:50, maksimal Rp200.000/minggu.
 * ASUMSI (ambigu di dokumen): batas Rp200.000 berlaku pada TOTAL kerugian yang dibagi (maks Rp100.000 per pihak);
 * kelebihan di atasnya ditanggung TitipO. Mohon konfirmasi pemilik dokumen keuangan.
 */
export const AMBANG_SUSUT = 0.02;
export const BATAS_BAGI_MINGGUAN = 200_000;

export interface BarisStok {
  sku_lumbung: string;
  nama: string;
  /** Berat dipesan (gram, integer). */
  dipesan_gram: number;
  /** Selisih stok susut (gram, integer, >= 0). */
  selisih_gram: number;
  /** Harga pokok Lumbung per kg (rupiah). Harga pokok tidak diubah TitipO. */
  pokok_per_kg: number;
}

export interface BarisRekon extends BarisStok {
  pokok_rp: number;
  susut_persen: number;
  nilai_selisih_rp: number;
  dilaporkan: boolean;
}

export interface BeritaAcara {
  pekan_mulai: string;
  pekan_selesai: string;
  baris: BarisRekon[];
  total_pokok: number;
  kerugian_dilaporkan: number;
  dibagi: number;
  tanggungan_lumbung: number;
  tanggungan_titipo: number;
  csv: string;
}

const kgKeRp = (gram: number, perKg: number) => Math.round((gram * perKg) / 1000);

export function buatBeritaAcara(pekanMulai: string, pekanSelesai: string, stok: BarisStok[]): BeritaAcara {
  const baris: BarisRekon[] = stok.map((s) => {
    if (![s.dipesan_gram, s.selisih_gram, s.pokok_per_kg].every(Number.isInteger) || s.selisih_gram < 0 || s.dipesan_gram < 0)
      throw new RangeError(`${s.sku_lumbung}: gram/rupiah harus integer >= 0`);
    const susut = s.dipesan_gram === 0 ? 0 : s.selisih_gram / s.dipesan_gram;
    return {
      ...s,
      pokok_rp: kgKeRp(s.dipesan_gram, s.pokok_per_kg),
      susut_persen: Math.round(susut * 10000) / 100,
      nilai_selisih_rp: kgKeRp(s.selisih_gram, s.pokok_per_kg),
      dilaporkan: susut > AMBANG_SUSUT
    };
  });
  const total_pokok = baris.reduce((a, b) => a + b.pokok_rp, 0);
  const kerugian = baris.filter((b) => b.dilaporkan).reduce((a, b) => a + b.nilai_selisih_rp, 0);
  const dibagi = Math.min(kerugian, BATAS_BAGI_MINGGUAN);
  const tanggungan_lumbung = Math.floor(dibagi / 2);
  const tanggungan_titipo = kerugian - tanggungan_lumbung;
  const ba: BeritaAcara = {
    pekan_mulai: pekanMulai,
    pekan_selesai: pekanSelesai,
    baris,
    total_pokok,
    kerugian_dilaporkan: kerugian,
    dibagi,
    tanggungan_lumbung,
    tanggungan_titipo,
    csv: ''
  };
  ba.csv = keCsv(ba);
  return ba;
}

/** Escape CSV RFC 4180 + netralkan injeksi formula spreadsheet (awalan = + - @). */
export function selCsv(v: string | number): string {
  let s = String(v);
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function keCsv(ba: Omit<BeritaAcara, 'csv'>): string {
  const baris = (...c: (string | number)[]) => c.map(selCsv).join(',');
  const out = [
    baris('berita_acara_rekonsiliasi', ba.pekan_mulai, ba.pekan_selesai),
    baris('sku_lumbung', 'nama', 'dipesan_gram', 'selisih_gram', 'susut_persen', 'pokok_rp', 'nilai_selisih_rp', 'dilaporkan'),
    ...ba.baris.map((b) =>
      baris(b.sku_lumbung, b.nama, b.dipesan_gram, b.selisih_gram, b.susut_persen, b.pokok_rp, b.nilai_selisih_rp, b.dilaporkan ? 'ya' : 'tidak')
    ),
    baris('total_pokok_rp', ba.total_pokok),
    baris('kerugian_dilaporkan_rp', ba.kerugian_dilaporkan),
    baris('dibagi_rp_maks_200000', ba.dibagi),
    baris('tanggungan_lumbung_rp', ba.tanggungan_lumbung),
    baris('tanggungan_titipo_rp', ba.tanggungan_titipo)
  ];
  return out.join('\r\n') + '\r\n';
}
