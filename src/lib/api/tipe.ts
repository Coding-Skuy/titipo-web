/**
 * Tipe kontrak admin TitipO, DITULIS TANGAN dari docs/api/openapi.yaml
 * (Coding-Skuy/titipo-backend-service, branch docs/ttp-be-008-openapi-400-422-query, v1.0.1;
 * PR backend #9, #10, #11, #12 belum merge). Ganti dengan tipe hasil generate bila openapi sudah di main.
 * Uang = integer rupiah, berat = integer gram, waktu = ISO-8601 UTC.
 */

export type StatusVendor = 'calon' | 'aktif' | 'prioritas' | 'skors' | 'keluar';

export type StatusPesanan =
  | 'menunggu_pembayaran'
  | 'menunggu_konfirmasi'
  | 'disiapkan'
  | 'diserahkan'
  | 'selesai'
  | 'kedaluwarsa'
  | 'dialihkan'
  | 'dibatalkan_sistem'
  | 'dibatalkan_vendor';

export interface VendorAdmin {
  id: string;
  nama: string;
  status: StatusVendor;
  skor_kebersihan?: number;
  dokumen?: string[];
}

export interface DaftarVendor {
  data: VendorAdmin[];
  lanjut: string | null;
}

export interface PesananRingkas {
  kode: string;
  status: StatusPesanan;
  id_vendor: string;
  total_item: number;
  ongkir: 5000;
  total_bayar: number;
  jendela_serah?: string;
}

export interface DaftarPesanan {
  data: PesananRingkas[];
  agregat: { total: number; terlambat: number; batal: number };
  lanjut: string | null;
}

export interface KatalogCermin {
  diperbarui: string;
  sumber: 'lumbung';
  jumlah_sku: number;
  status: string;
}

export type BodyVerifikasi =
  | { setuju: true; kuota_harian: 30 | 60 }
  | { setuju: false; alasan: string };

export interface BodySkors {
  hari: 3 | 7;
  alasan: string;
}

export interface AksiAdminOk {
  ok: true;
  id: string;
  dicatat_oleh: string;
}

export interface AppError {
  kode: string;
  pesan: string;
  detail?: Record<string, unknown>;
}
