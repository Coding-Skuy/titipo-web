import { describe, expect, test } from 'bun:test';
import { buatBeritaAcara, selCsv } from './rekonsiliasi';

const sku = (over: object = {}) => ({
  sku_lumbung: 'LMB-BAYAM-001',
  nama: 'Bayam',
  dipesan_gram: 100_000,
  selisih_gram: 1_000,
  pokok_per_kg: 9000,
  ...over
});

describe('rekonsiliasi', () => {
  test('susut <= 2% tidak dilaporkan', () => {
    const ba = buatBeritaAcara('2026-01-05', '2026-01-11', [sku({ selisih_gram: 2_000 })]);
    expect(ba.baris[0]).toMatchObject({ susut_persen: 2, dilaporkan: false });
    expect(ba.kerugian_dilaporkan).toBe(0);
  });
  test('susut > 2% dibagi 50:50', () => {
    const ba = buatBeritaAcara('2026-01-05', '2026-01-11', [sku({ selisih_gram: 5_000 })]);
    expect(ba.baris[0]).toMatchObject({ susut_persen: 5, nilai_selisih_rp: 45_000, dilaporkan: true });
    expect([ba.dibagi, ba.tanggungan_lumbung, ba.tanggungan_titipo]).toEqual([45_000, 22_500, 22_500]);
  });
  test('kerugian di atas Rp200.000/minggu: yang dibagi dibatasi, sisanya ditanggung TitipO', () => {
    const ba = buatBeritaAcara('2026-01-05', '2026-01-11', [
      sku({ sku_lumbung: 'LMB-TELUR-001', nama: 'Telur', dipesan_gram: 100_000, selisih_gram: 10_000, pokok_per_kg: 29_000 })
    ]); // selisih 290.000
    expect(ba.kerugian_dilaporkan).toBe(290_000);
    expect(ba.dibagi).toBe(200_000);
    expect(ba.tanggungan_lumbung).toBe(100_000);
    expect(ba.tanggungan_titipo).toBe(190_000);
  });
  test('total pokok dan CSV', () => {
    const ba = buatBeritaAcara('2026-01-05', '2026-01-11', [sku(), sku({ sku_lumbung: 'LMB-X', nama: 'Cabai, merah', dipesan_gram: 2_000, selisih_gram: 0, pokok_per_kg: 50_000 })]);
    expect(ba.total_pokok).toBe(900_000 + 100_000);
    const baris = ba.csv.split('\r\n');
    expect(baris[0]).toBe('berita_acara_rekonsiliasi,2026-01-05,2026-01-11');
    expect(baris[3]).toContain('"Cabai, merah"');
    expect(ba.csv.endsWith('\r\n')).toBe(true);
  });
  test('selCsv: kutip, dan netralkan injeksi formula', () => {
    expect(selCsv('a"b')).toBe('"a""b"');
    expect(selCsv('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(selCsv(-5)).toBe('-5');
  });
  test('menolak nilai bukan integer', () => {
    expect(() => buatBeritaAcara('a', 'b', [sku({ selisih_gram: 1.5 })])).toThrow(RangeError);
  });
});
