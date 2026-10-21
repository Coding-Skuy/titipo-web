import { describe, expect, test } from 'bun:test';
import {
  buatStoreCerminMemori,
  lebihDari24Jam,
  sinkronLumbung,
  tujuhHariTanpaGagal,
  umurJam,
  validasiKatalog,
  versiBerikut,
  type KatalogLumbung
} from './cermin';

const katalog = (n = 2): KatalogLumbung => ({
  diperbarui: '2026-01-07T04:00:00Z',
  data: [
    { sku_lumbung: 'LMB-BAYAM-001', nama: 'Bayam', harga_per_kg: 9000, stok_gram: 50000 },
    { sku_lumbung: 'LMB-TELUR-001', nama: 'Telur', harga_per_kg: 29000, stok_gram: 30000 }
  ].slice(0, n)
});
const tanpaTidur = { jedaMs: 0, tidur: async () => {} };

describe('validasiKatalog', () => {
  test('katalog sah', () => expect(validasiKatalog(katalog())).toEqual([]));
  test('menolak duplikat, harga pecahan, stok negatif, sku kosong', () => {
    const k = katalog();
    k.data.push({ ...k.data[0] });
    k.data.push({ sku_lumbung: 'X', nama: 'x', harga_per_kg: 10.5, stok_gram: -1 });
    k.data.push({ sku_lumbung: ' ', nama: 'y', harga_per_kg: 1, stok_gram: 1 });
    const m = validasiKatalog(k).join('|');
    expect(m).toContain('duplikat');
    expect(m).toContain('harga_per_kg');
    expect(m).toContain('stok_gram');
    expect(m).toContain('sku_lumbung kosong');
  });
  test('katalog kosong ditolak', () => expect(validasiKatalog({ ...katalog(), data: [] })).toContain('katalog kosong'));
});

describe('versiBerikut', () => {
  test('urut vNNN', () => {
    expect(versiBerikut(undefined)).toBe('v001');
    expect(versiBerikut('v009')).toBe('v010');
  });
});

describe('sinkronLumbung', () => {
  test('sukses menulis snapshot v001 lalu v002', async () => {
    const store = buatStoreCerminMemori();
    const dep = { ambilKatalog: async () => katalog(), store, retry: tanpaTidur };
    expect((await sinkronLumbung(dep)).versi).toBe('v001');
    expect((await sinkronLumbung(dep)).versi).toBe('v002');
    const s = await store.status();
    expect(s.gagal).toBe(false);
    expect(s.snapshot?.jumlah_sku).toBe(2);
  });

  test('retry: gagal 2 kali lalu sukses pada percobaan ke-3 (tidur 30 detik)', async () => {
    const jeda: number[] = [];
    let n = 0;
    const store = buatStoreCerminMemori();
    const c = await sinkronLumbung({
      ambilKatalog: async () => {
        if (++n < 3) throw new Error('timeout');
        return katalog();
      },
      store,
      retry: { tidur: async (ms) => void jeda.push(ms) }
    });
    expect(c).toMatchObject({ ok: true, percobaan: 3 });
    expect(jeda).toEqual([30_000, 30_000]);
  });

  test('gagal 3 kali: snapshot kemarin tetap berlaku + banner merah', async () => {
    const store = buatStoreCerminMemori();
    await sinkronLumbung({ ambilKatalog: async () => katalog(), store, retry: tanpaTidur });
    let n = 0;
    const c = await sinkronLumbung({
      ambilKatalog: async () => {
        n++;
        throw new Error('lumbung 503');
      },
      store,
      retry: tanpaTidur
    });
    expect(n).toBe(3);
    expect(c.ok).toBe(false);
    const s = await store.status();
    expect(s.gagal).toBe(true);
    expect(s.galatTerakhir).toBe('lumbung 503');
    expect(s.snapshot?.versi).toBe('v001');
  });

  test('katalog tidak valid dihitung gagal, snapshot tidak ditulis', async () => {
    const store = buatStoreCerminMemori();
    const c = await sinkronLumbung({ ambilKatalog: async () => ({ ...katalog(), data: [] }), store, retry: tanpaTidur });
    expect(c.ok).toBe(false);
    expect((await store.status()).snapshot).toBeNull();
  });

  test('sukses sesudah gagal mematikan banner', async () => {
    const store = buatStoreCerminMemori();
    await sinkronLumbung({ ambilKatalog: async () => Promise.reject(new Error('x')), store, retry: tanpaTidur });
    expect((await store.status()).gagal).toBe(true);
    await sinkronLumbung({ ambilKatalog: async () => katalog(), store, retry: tanpaTidur });
    expect((await store.status()).gagal).toBe(false);
  });
});

describe('umur snapshot', () => {
  const snap = { diperbarui: '2026-01-07T04:00:00Z' };
  test('<=24 jam sah, >24 jam mengunci', () => {
    expect(lebihDari24Jam(snap as never, new Date('2026-01-08T04:00:00Z'))).toBe(false);
    expect(lebihDari24Jam(snap as never, new Date('2026-01-08T04:00:01Z'))).toBe(true);
    expect(umurJam(null, new Date())).toBe(Infinity);
  });
});

describe('tujuhHariTanpaGagal', () => {
  const mk = (tgl: string, ok = true) => ({ waktu: `${tgl}T04:00:00Z`, ok, percobaan: 1 });
  const hari = ['01', '02', '03', '04', '05', '06', '07'].map((d) => `2026-01-${d}`);
  const sekarang = new Date('2026-01-07T05:00:00Z');
  test('7 hari ok -> true', () => expect(tujuhHariTanpaGagal(hari.map((h) => mk(h)), sekarang)).toBe(true));
  test('ada gagal -> false', () => expect(tujuhHariTanpaGagal([...hari.map((h) => mk(h)), mk('2026-01-07', false)], sekarang)).toBe(false));
  test('kurang dari 7 hari -> false', () => expect(tujuhHariTanpaGagal(hari.slice(0, 5).map((h) => mk(h)), sekarang)).toBe(false));
});
