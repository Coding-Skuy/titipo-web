import { describe, expect, test } from 'bun:test';
import type { KlienAdmin } from '$lib/api/klien';
import { sumberFeeDariApi } from './sumber';

describe('sumberFeeDariApi', () => {
  test('mengikuti paginasi lanjut dan menandai vendor prioritas', async () => {
    const halaman: Record<string, unknown> = {
      '': { data: [{ kode: 'T-2026-000001', status: 'selesai', id_vendor: 'V-A', total_item: 47000, ongkir: 5000, total_bayar: 52000 }], agregat: {}, lanjut: 'T-2026-000001' },
      'T-2026-000001': { data: [{ kode: 'T-2026-000002', status: 'selesai', id_vendor: 'V-B', total_item: 10000, ongkir: 5000, total_bayar: 15000 }], agregat: {}, lanjut: null }
    };
    const panggilan: unknown[] = [];
    const klien = {
      daftarPesanan: async (q: { lanjut?: string; hari?: string; status?: string }) => {
        panggilan.push(q);
        return halaman[q.lanjut ?? ''];
      },
      daftarVendor: async () => ({ data: [{ id: 'V-B', nama: 'B', status: 'prioritas' }], lanjut: null })
    } as unknown as KlienAdmin;
    const hasil = await sumberFeeDariApi(klien).pesananSelesai('2026-01-07');
    expect(hasil).toEqual([
      { kode: 'T-2026-000001', id_vendor: 'V-A', total_item: 47000, prioritas: false },
      { kode: 'T-2026-000002', id_vendor: 'V-B', total_item: 10000, prioritas: true }
    ]);
    expect(panggilan[0]).toMatchObject({ status: 'selesai', hari: '2026-01-07', batas: 50 });
  });
});
