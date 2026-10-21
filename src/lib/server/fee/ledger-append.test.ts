import { describe, expect, test } from 'bun:test';
import { buatLedgerMemori, jamWib } from './ledger';

const W = (s: string) => new Date(`${s}+07:00`);

describe('ledger append-only', () => {
  test('seq berurutan dan baris dibekukan (tidak bisa diubah)', () => {
    const l = buatLedgerMemori();
    const t = { aktor: 'job:cair-fee', waktu: W('2026-01-08T00:00:00') };
    l.cair({ kode: 'T-1', id_vendor: 'V', total_item: 47000, prioritas: false }, t);
    l.cair({ kode: 'T-2', id_vendor: 'V', total_item: 47000, prioritas: false }, t);
    const b = l.baris();
    expect(b.map((x) => x.seq)).toEqual([1, 2]);
    expect(Object.isFrozen(b[0])).toBe(true);
    expect(() => {
      'use strict';
      (b[0] as { delta: number }).delta = 1;
    }).toThrow();
  });

  test('baris() dan akun() mengembalikan salinan: mutasi luar tidak mengubah ledger', () => {
    const l = buatLedgerMemori();
    l.cair({ kode: 'T-1', id_vendor: 'V', total_item: 47000, prioritas: false }, { aktor: 'a', waktu: W('2026-01-08T00:00:00') });
    (l.baris() as unknown[]).length = 0;
    l.akun('V').saldo = 999_999;
    expect(l.baris()).toHaveLength(1);
    expect(l.akun('V').saldo).toBe(9640);
  });

  test('pencairan ganda satu kode pesanan tidak menambah baris', () => {
    const l = buatLedgerMemori();
    const p = { kode: 'T-1', id_vendor: 'V', total_item: 47000, prioritas: false };
    const t = { aktor: 'a', waktu: W('2026-01-08T00:00:00') };
    expect(l.cair(p, t)).not.toBeNull();
    expect(l.cair(p, t)).toBeNull();
    expect(l.baris()).toHaveLength(1);
  });

  test('jamWib: 23.30 UTC = 06.30 WIB hari berikutnya', () => {
    expect(jamWib(new Date('2026-01-07T23:30:00Z'))).toBe(6);
    expect(jamWib(new Date('2026-01-07T16:59:00Z'))).toBe(23);
  });
});
