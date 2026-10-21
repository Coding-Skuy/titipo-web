import { describe, expect, test } from 'bun:test';
import {
  hitungPendamping,
  lampuRepeatKota,
  lampuRepeatVendor,
  median,
  nilaiLampu,
  repeat28,
  usulPrioritas,
  type PesananSelesai
} from './hitung';

const SEKARANG = new Date('2026-01-12T00:00:00Z');
const hariLalu = (n: number, jam = 0) => new Date(SEKARANG.getTime() - n * 86400_000 - jam * 3600_000).toISOString();
const ps = (rt: string, n: number, vendor = 'V-A'): PesananSelesai => ({ id_rumah_tangga: rt, id_vendor: vendor, diserahkan: hariLalu(n) });

describe('repeat28', () => {
  test('contoh dokumen: 84 dari 200 rumah tangga = 42%', () => {
    const rows: PesananSelesai[] = [];
    for (let i = 0; i < 200; i++) {
      rows.push(ps(`R${i}`, 3));
      if (i < 84) rows.push(ps(`R${i}`, 10));
    }
    expect(repeat28(rows, SEKARANG)).toBeCloseTo(0.42, 10);
    expect(lampuRepeatVendor(0.42)).toBe('hijau');
  });
  test('hanya pesanan dalam 28 hari; di luar jendela diabaikan', () => {
    const rows = [ps('R1', 3), ps('R1', 29), ps('R2', 3), ps('R2', 5)];
    expect(repeat28(rows, SEKARANG)).toBe(0.5); // R1 hanya 1 dalam jendela, R2 ada 2
  });
  test('batas tepat 28 hari tidak termasuk (> now-28h)', () => {
    expect(repeat28([ps('R1', 28), ps('R1', 1)], SEKARANG)).toBe(0); // R1 hanya 1 di jendela
  });
  test('tanpa rumah tangga aktif -> null (bukan NaN)', () => {
    expect(repeat28([], SEKARANG)).toBeNull();
    expect(lampuRepeatKota(null)).toBe('kosong');
  });
  test('ambang kota 35%, vendor 40%', () => {
    expect(lampuRepeatKota(0.35)).toBe('hijau');
    expect(lampuRepeatKota(0.349)).toBe('merah');
    expect(lampuRepeatVendor(0.399)).toBe('merah');
  });
  test('filter vendor', () => {
    const rows = [ps('R1', 3, 'V-A'), ps('R1', 4, 'V-A'), ps('R2', 3, 'V-B')];
    expect(repeat28(rows, SEKARANG, 'V-A')).toBe(1);
    expect(repeat28(rows, SEKARANG, 'V-B')).toBe(0);
  });
});

describe('metrik pendamping (contoh dashboard 7 Jan: 96% / 1,2% / median 13 menit)', () => {
  const dibuat = hariLalu(2);
  const plus = (menit: number) => new Date(Date.parse(dibuat) + menit * 60_000).toISOString();
  test('tepat serah +-15 menit, batal vendor, rating, median konfirmasi', () => {
    const baris = [
      ...Array.from({ length: 24 }, () => ({ status: 'selesai', dibuat, dikonfirmasi: plus(13), janji_serah: plus(1000), diserahkan: plus(1010), rating: 5 })),
      { status: 'selesai', dibuat, dikonfirmasi: plus(13), janji_serah: plus(1000), diserahkan: plus(1016), rating: 4 } // telat 16 menit
    ];
    const m = hitungPendamping(baris, SEKARANG);
    expect(m.tepatSerah).toBe(96);
    expect(m.medianKonfirmasi).toBe(13);
    expect(m.rating30).toBeCloseTo(4.96, 2);
    expect(m.batalVendor).toBe(0);
    expect(nilaiLampu(m)).toEqual({ tepatSerah: 'hijau', batalVendor: 'hijau', rating30: 'hijau', medianKonfirmasi: 'hijau' });
  });
  test('toleransi tepat 15 menit masih tepat; batal vendor 3% merah; median 21 merah; rating 4,4 merah', () => {
    const b = hitungPendamping([{ status: 'selesai', dibuat, janji_serah: plus(100), diserahkan: plus(115) }], SEKARANG);
    expect(b.tepatSerah).toBe(100);
    const rows = [
      ...Array.from({ length: 97 }, () => ({ status: 'selesai', dibuat, dikonfirmasi: plus(21), rating: 4.4 })),
      ...Array.from({ length: 3 }, () => ({ status: 'dibatalkan_vendor', dibuat }))
    ];
    const m = hitungPendamping(rows, SEKARANG);
    expect(m.batalVendor).toBe(3);
    expect(m.medianKonfirmasi).toBe(21);
    expect(m.rating30).toBeCloseTo(4.4, 5);
    expect(nilaiLampu(m)).toEqual({ tepatSerah: 'kosong', batalVendor: 'merah', rating30: 'merah', medianKonfirmasi: 'merah' });
  });
  test('data kosong -> semua null/kosong; pesanan >30 hari diabaikan', () => {
    const m = hitungPendamping([{ status: 'dibatalkan_vendor', dibuat: hariLalu(31) }], SEKARANG);
    expect(m).toEqual({ tepatSerah: null, batalVendor: null, rating30: null, medianKonfirmasi: null });
  });
  test('median genap', () => expect(median([1, 2, 3, 4])).toBe(2.5));
});

describe('usulPrioritas', () => {
  /** Dua pesanan per rumah tangga di tiap pekan selama 7 minggu -> repeat 100% di 4 titik terakhir. */
  const loyal = (vendor: string) => {
    const r: PesananSelesai[] = [];
    for (let w = 0; w < 7; w++) for (const rt of ['R1', 'R2']) { r.push(ps(rt, w * 7 + 1, vendor)); r.push(ps(rt, w * 7 + 2, vendor)); }
    return r;
  };
  test('repeat >=40% 4 minggu + rating >=4,7 -> diusulkan', () => {
    expect(usulPrioritas([{ id_vendor: 'V-A', status: 'aktif', rating: 4.7 }], loyal('V-A'), SEKARANG)).toEqual(['V-A']);
  });
  test('rating 4,69 tidak', () => {
    expect(usulPrioritas([{ id_vendor: 'V-A', status: 'aktif', rating: 4.69 }], loyal('V-A'), SEKARANG)).toEqual([]);
  });
  test('sudah prioritas / bukan aktif tidak diusulkan', () => {
    expect(usulPrioritas([{ id_vendor: 'V-A', status: 'prioritas', rating: 4.9 }], loyal('V-A'), SEKARANG)).toEqual([]);
  });
  test('hanya 3 minggu data -> tidak', () => {
    const r: PesananSelesai[] = [];
    for (let w = 0; w < 3; w++) for (const rt of ['R1']) { r.push(ps(rt, w * 7 + 1, 'V-A')); r.push(ps(rt, w * 7 + 2, 'V-A')); }
    expect(usulPrioritas([{ id_vendor: 'V-A', status: 'aktif', rating: 5 }], r, SEKARANG)).toEqual([]);
  });
});
