import { describe, expect, test } from 'bun:test';
import { hitungFee } from './hitung';
import { GalatLedger, buatLedgerMemori } from './ledger';

const W = (iso: string) => new Date(iso + '+07:00');

describe('3 kasus mengikat BRD keuangan', () => {
  test('A: vendor Aktif tanpa denda = Rp9.640', () => {
    const r = hitungFee({ total_item: 47000, prioritas: false });
    expect([r.fee_vendor, r.bonus_prioritas, r.bersih]).toEqual([5640, 0, 9640]);
  });
  test('B: vendor Prioritas = Rp9.875', () => {
    const r = hitungFee({ total_item: 47000, prioritas: true });
    expect([r.fee_vendor, r.bonus_prioritas, r.bersih]).toEqual([5640, 235, 9875]);
  });
  test('C: batal sepihak = minus Rp5.360', () => {
    expect(hitungFee({ total_item: 47000, prioritas: false, denda: true }).bersih).toBe(-5360);
  });
  test('menolak total_item bukan integer', () => {
    expect(() => hitungFee({ total_item: 10.5, prioritas: false })).toThrow(RangeError);
  });
});

describe('ledger', () => {
  const t = W('2026-01-08T00:00:00');
  test('kasus A & B menambah saldo dan idempoten per kode', () => {
    const l = buatLedgerMemori();
    const b = l.cair({ kode: 'T-2026-000112', id_vendor: 'V-SARI-001', total_item: 47000, prioritas: false }, { aktor: 'job', waktu: t });
    expect(b?.delta).toBe(9640);
    expect(l.cair({ kode: 'T-2026-000112', id_vendor: 'V-SARI-001', total_item: 47000, prioritas: false }, { aktor: 'job', waktu: t })).toBeNull();
    l.cair({ kode: 'T-2026-000113', id_vendor: 'V-SARI-001', total_item: 47000, prioritas: true }, { aktor: 'job', waktu: t });
    expect(l.akun('V-SARI-001')).toEqual({ saldo: 9640 + 9875, tunggakan: 0 });
  });

  test('kasus C: saldo kosong tidak negatif, sisa denda jadi tunggakan lalu dilunasi pendapatan berikut', () => {
    const l = buatLedgerMemori();
    const c = l.cair({ kode: 'T-1', id_vendor: 'V', total_item: 47000, prioritas: false, denda: true }, { aktor: 'job', waktu: t });
    expect(l.akun('V')).toEqual({ saldo: 0, tunggakan: 5360 });
    expect(c?.saldo_setelah).toBe(0);
    l.cair({ kode: 'T-2', id_vendor: 'V', total_item: 47000, prioritas: false }, { aktor: 'job', waktu: t });
    expect(l.akun('V')).toEqual({ saldo: 9640 - 5360, tunggakan: 0 });
  });

  test('denda dipotong dari saldo yang ada lebih dulu', () => {
    const l = buatLedgerMemori();
    l.cair({ kode: 'T-1', id_vendor: 'V', total_item: 47000, prioritas: false }, { aktor: 'job', waktu: t }); // 9.640
    l.cair({ kode: 'T-2', id_vendor: 'V', total_item: 47000, prioritas: false, denda: true }, { aktor: 'job', waktu: t }); // -5.360
    expect(l.akun('V')).toEqual({ saldo: 4280, tunggakan: 0 });
  });

  test('contoh ledger BRD: tarik 100.000 -> terima 97.500, saldo turun sebesar jumlah penuh', () => {
    const l = buatLedgerMemori();
    // Saldo sintetis 132.000 (12% x 1.000.000 + 2 x ongkir 4.000); aturan yang diuji sama dengan contoh BRD (saldo turun sebesar jumlah penuh).
    l.cair({ kode: 'a', id_vendor: 'V', total_item: 1_000_000, prioritas: false }, { aktor: 'job', waktu: t }); // 124.000
    l.cair({ kode: 'b', id_vendor: 'V', total_item: 0, prioritas: false }, { aktor: 'job', waktu: t }); // 4.000
    l.cair({ kode: 'c', id_vendor: 'V', total_item: 0, prioritas: false }, { aktor: 'job', waktu: t }); // 4.000 -> 132.000
    expect(l.akun('V').saldo).toBe(132_000);
    const r = l.tarik('V', 100_000, { aktor: 'V', waktu: W('2026-01-08T06:00:00') });
    expect(r.diterima).toBe(97_500);
    expect(l.akun('V').saldo).toBe(32_000);
  });

  test('aturan tarik: sebelum 06.00, di bawah minimum, saldo kurang', () => {
    const l = buatLedgerMemori();
    l.cair({ kode: 'a', id_vendor: 'V', total_item: 1_000_000, prioritas: false }, { aktor: 'job', waktu: t });
    const kode = (f: () => unknown) => {
      try {
        f();
      } catch (e) {
        return (e as GalatLedger).kode;
      }
    };
    expect(kode(() => l.tarik('V', 50_000, { aktor: 'V', waktu: W('2026-01-08T05:59:00') }))).toBe('BELUM_JAM_TARIK');
    expect(kode(() => l.tarik('V', 49_999, { aktor: 'V', waktu: W('2026-01-08T06:00:00') }))).toBe('DI_BAWAH_MINIMUM');
    expect(kode(() => l.tarik('V', 500_000, { aktor: 'V', waktu: W('2026-01-08T06:00:00') }))).toBe('SALDO_KURANG');
    expect(l.tarik('V', 50_000, { aktor: 'V', waktu: W('2026-01-08T06:00:00') }).diterima).toBe(47_500);
  });

  test('ledger append-only: baris beku dan salinan', () => {
    const l = buatLedgerMemori();
    const b = l.cair({ kode: 'a', id_vendor: 'V', total_item: 100, prioritas: false }, { aktor: 'job', waktu: t })!;
    expect(Object.isFrozen(b)).toBe(true);
    (l.baris() as unknown[]).pop();
    expect(l.baris().length).toBe(1);
  });
});
