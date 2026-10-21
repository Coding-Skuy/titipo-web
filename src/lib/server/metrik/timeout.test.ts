import { describe, expect, test } from 'bun:test';
import { hPlus1Wib, jalankanTimeout, putuskan, type DepTimeout, type PesananMenunggu } from './timeout';

const SEKARANG = new Date('2026-01-07T10:00:00Z');
const sejak = (menit: number) => new Date(SEKARANG.getTime() - menit * 60_000).toISOString();
const psn = (kode: string, menit: number, alih = 0): PesananMenunggu => ({ kode, id_vendor: 'V-A', menunggu_sejak: sejak(menit), jumlah_alih: alih });

describe('putuskan', () => {
  test('< 30 menit tunggu; tepat 30 menit alihkan', () => {
    expect(putuskan(psn('a', 29.9), SEKARANG)).toBe('tunggu');
    expect(putuskan(psn('a', 30), SEKARANG)).toBe('alihkan');
  });
  test('alih ke-1 dan ke-2 diizinkan; setelah 2 kali -> refund', () => {
    expect(putuskan(psn('a', 31, 0), SEKARANG)).toBe('alihkan');
    expect(putuskan(psn('a', 31, 1), SEKARANG)).toBe('alihkan');
    expect(putuskan(psn('a', 31, 2), SEKARANG)).toBe('refund');
  });
});

describe('jalankanTimeout', () => {
  function dep(daftar: PesananMenunggu[], over: Partial<DepTimeout> = {}) {
    const log = { alih: [] as [string, string][], refund: [] as [string, string][] };
    const d: DepTimeout = {
      menungguKonfirmasi: async () => daftar,
      cariCadangan: async () => 'V-SARI-001',
      alihkan: async (k, v) => void log.alih.push([k, v]),
      jadwalkanRefund: async (k, t) => void log.refund.push([k, t]),
      sekarang: () => SEKARANG,
      ...over
    };
    return { d, log };
  }

  test('alihkan, tunggu, dan refund dalam satu putaran', async () => {
    const { d, log } = dep([psn('T-1', 31, 0), psn('T-2', 10, 0), psn('T-3', 45, 2)]);
    const h = await jalankanTimeout(d);
    expect(h.dialihkan).toEqual(['T-1']);
    expect(log.alih).toEqual([['T-1', 'V-SARI-001']]);
    expect(h.direfund).toEqual([{ kode: 'T-3', tanggal: '2026-01-08' }]); // 10.00Z = 17.00 WIB 7 Jan -> H+1 = 8 Jan
    expect(log.refund).toEqual([['T-3', '2026-01-08']]);
  });
  test('tanpa vendor cadangan: tidak dialihkan, dilaporkan, dicoba lagi putaran berikut', async () => {
    const { d, log } = dep([psn('T-1', 31)], { cariCadangan: async () => null });
    const h = await jalankanTimeout(d);
    expect(h.tanpaCadangan).toEqual(['T-1']);
    expect(log.alih).toEqual([]);
  });
  test('galat satu pesanan tidak menghentikan yang lain', async () => {
    const { d, log } = dep([psn('T-1', 31), psn('T-2', 31)], {
      alihkan: async (k) => {
        if (k === 'T-1') throw new Error('422 maksimal 2 kali');
        log.alih.push([k, 'x']);
      }
    });
    const h = await jalankanTimeout(d);
    expect(h.galat).toEqual([{ kode: 'T-1', pesan: '422 maksimal 2 kali' }]);
    expect(h.dialihkan).toEqual(['T-2']);
  });
  test('H+1 WIB melewati tengah malam', () => {
    expect(hPlus1Wib(new Date('2026-01-07T18:00:00Z'))).toBe('2026-01-09'); // 01.00 WIB 8 Jan -> H+1 = 9 Jan
  });
});
