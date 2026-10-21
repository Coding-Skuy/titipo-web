import { describe, expect, test } from 'bun:test';
import { jalanBerikut, jalankanDenganRetry, mulaiJob } from './jadwal';

const wib = (iso: string) => new Date(iso + '+07:00');

describe('jalanBerikut', () => {
  test('harian 04.00 WIB: sebelum jam -> hari yang sama', () => {
    expect(jalanBerikut({ tipe: 'harian', jam: 4 }, wib('2026-01-07T03:00:00')).toISOString()).toBe(
      wib('2026-01-07T04:00:00').toISOString()
    );
  });
  test('harian 04.00 WIB: tepat/sesudah jam -> besok', () => {
    expect(jalanBerikut({ tipe: 'harian', jam: 4 }, wib('2026-01-07T04:00:00')).toISOString()).toBe(
      wib('2026-01-08T04:00:00').toISOString()
    );
  });
  test('interval 1 menit', () => {
    const t = new Date('2026-01-07T00:00:10Z');
    expect(jalanBerikut({ tipe: 'interval', ms: 60_000 }, t).getTime()).toBe(t.getTime() + 60_000);
  });
  test('mingguan Senin 09.00 WIB dari Rabu', () => {
    // 2026-01-07 = Rabu; Senin berikut = 2026-01-12
    expect(jalanBerikut({ tipe: 'mingguan', hari: 1, jam: 9 }, wib('2026-01-07T10:00:00')).toISOString()).toBe(
      wib('2026-01-12T09:00:00').toISOString()
    );
  });
  test('bulanan tanggal 1 jam 02.00 WIB', () => {
    expect(jalanBerikut({ tipe: 'bulanan', tanggal: 1, jam: 2 }, wib('2026-01-07T10:00:00')).toISOString()).toBe(
      wib('2026-02-01T02:00:00').toISOString()
    );
  });
});

describe('jalankanDenganRetry', () => {
  test('berhasil pada percobaan ke-3 dengan jeda 30 detik', async () => {
    const jeda: number[] = [];
    const r = await jalankanDenganRetry(
      async (ke) => {
        if (ke < 3) throw new Error('gagal');
        return 'ok';
      },
      { percobaan: 3, jedaMs: 30_000, tidur: async (ms) => void jeda.push(ms) }
    );
    expect(r).toMatchObject({ ok: true, percobaan: 3, nilai: 'ok' });
    expect(jeda).toEqual([30_000, 30_000]);
  });
  test('gagal 3 kali -> ok=false, hanya 2 jeda', async () => {
    const jeda: number[] = [];
    const r = await jalankanDenganRetry(async () => Promise.reject(new Error('x')), {
      percobaan: 3,
      jedaMs: 30_000,
      tidur: async (ms) => void jeda.push(ms)
    });
    expect(r.ok).toBe(false);
    expect(jeda.length).toBe(2);
  });
});

describe('mulaiJob', () => {
  test('galat job tidak menjatuhkan penjadwal dan dijadwalkan ulang', async () => {
    const dipasang: number[] = [];
    const log: string[] = [];
    let fn: (() => void) | undefined;
    const henti = mulaiJob(
      [{ nama: 'x', jadwal: { tipe: 'interval', ms: 60_000 }, jalankan: async () => Promise.reject(new Error('boom')) }],
      {
        sekarang: () => new Date('2026-01-07T00:00:00Z'),
        setTimer: ((cb: () => void, ms: number) => {
          fn = cb;
          dipasang.push(ms);
          return 1;
        }) as unknown as typeof setTimeout,
        clearTimer: (() => {}) as unknown as typeof clearTimeout,
        log: (p) => log.push(p)
      }
    );
    fn!();
    await new Promise((r) => setTimeout(r, 0));
    expect(log).toEqual(['x gagal']);
    expect(dipasang).toEqual([60_000, 60_000]);
    henti();
  });
});
