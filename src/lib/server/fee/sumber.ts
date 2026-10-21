import type { KlienAdmin } from '$lib/api/klien';
import type { SumberFee } from './cair';
import type { PesananFee } from './hitung';

async function semuaHalaman<T>(ambil: (lanjut?: string) => Promise<{ data: T[]; lanjut: string | null }>): Promise<T[]> {
  const hasil: T[] = [];
  let lanjut: string | undefined;
  do {
    const r = await ambil(lanjut);
    hasil.push(...r.data);
    lanjut = r.lanjut ?? undefined;
  } while (lanjut);
  return hasil;
}

/**
 * Sumber dari endpoint admin openapi: pesanan `selesai` pada `hari`, prioritas dari vendor berstatus `prioritas`.
 * ASUMSI: parameter `hari` memfilter tanggal serah. Denda batal sepihak <2 jam BELUM tersedia di kontrak -> tidak
 * dihitung di sini (denda=false); butuh endpoint/field backend (dicatat sebagai temuan di PR).
 */
export function sumberFeeDariApi(klien: KlienAdmin): SumberFee {
  return {
    async pesananSelesai(tanggal: string): Promise<PesananFee[]> {
      const [pesanan, prioritas] = await Promise.all([
        semuaHalaman((lanjut) => klien.daftarPesanan({ status: 'selesai', hari: tanggal, batas: 50, lanjut })),
        semuaHalaman((lanjut) => klien.daftarVendor({ status: 'prioritas', batas: 50, lanjut }))
      ]);
      const ids = new Set(prioritas.map((v) => v.id));
      return pesanan.map((p) => ({ kode: p.kode, id_vendor: p.id_vendor, total_item: p.total_item, prioritas: ids.has(p.id_vendor) }));
    }
  };
}
