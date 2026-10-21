import { env } from '$env/dynamic/private';
import { buatKlienAdmin } from '$lib/api/klien';
import type { DataVendorPrioritas, PesananMetrik, PesananSelesai } from '$lib/metrik/hitung';
import { urlApi } from '../konfig';
import type { DepTimeout } from './timeout';

/**
 * Sumber data metrik. ASUMSI/GAP: admin openapi (GET /admin/pesanan) tidak memuat id_rumah_tangga, waktu serah,
 * janji serah, waktu konfirmasi, rating, maupun rating vendor, sehingga dashboard tidak bisa diisi dari API.
 * Dipasang lewat `pasangSumberMetrik` oleh adapter DB `titipo`/endpoint baru begitu kontraknya ada.
 */
export interface SumberMetrik {
  pesananSelesai(): Promise<PesananSelesai[]>;
  pesananMetrik(): Promise<PesananMetrik[]>;
  vendor(): Promise<DataVendorPrioritas[]>;
}

let sumber: SumberMetrik | null = null;
export const pasangSumberMetrik = (s: SumberMetrik) => void (sumber = s);
export const sumberMetrik = () => sumber;

/**
 * Port job timeout. Hanya `alihkan` punya endpoint (POST /admin/pesanan/{kode}/alihkan); daftar menunggu,
 * pencarian cadangan radius 2 km, dan refund H+1 belum ada di kontrak -> `null` sampai dipasang adapter.
 */
let timeoutDep: Omit<DepTimeout, 'alihkan'> | null = null;
export const pasangDepTimeout = (d: Omit<DepTimeout, 'alihkan'>) => void (timeoutDep = d);

export function depTimeoutJob(): DepTimeout | null {
  if (!timeoutDep) return null;
  const klien = buatKlienAdmin({ baseUrl: urlApi(), token: env.TITIPO_JOB_TOKEN ?? '' });
  return { ...timeoutDep, alihkan: async (kode, id) => void (await klien.alihkanPesanan(kode, id)) };
}
