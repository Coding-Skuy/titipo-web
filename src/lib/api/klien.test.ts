import { describe, expect, test } from 'bun:test';
import { buatKlienAdmin, GalatApi } from './klien';
import { buatUlid } from './ulid';

function palsu(status: number, body: unknown) {
  const panggilan: { url: string; init: RequestInit }[] = [];
  const fetch = (async (url: string, init: RequestInit) => {
    panggilan.push({ url, init });
    return new Response(JSON.stringify(body), { status });
  }) as unknown as typeof globalThis.fetch;
  return { fetch, panggilan };
}

describe('buatUlid', () => {
  test('26 karakter sesuai pola openapi', () => {
    expect(buatUlid()).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });
});

describe('klien admin', () => {
  test('GET membawa Bearer dan query, tanpa Idempotency-Key', async () => {
    const { fetch, panggilan } = palsu(200, { data: [], lanjut: null });
    const k = buatKlienAdmin({ baseUrl: 'http://x/', token: 'T', fetch });
    await k.daftarVendor({ status: 'calon', batas: 20 });
    expect(panggilan[0].url).toBe('http://x/admin/vendor?status=calon&batas=20');
    const h = panggilan[0].init.headers as Record<string, string>;
    expect(h.authorization).toBe('Bearer T');
    expect(h['idempotency-key']).toBeUndefined();
  });
  test('POST membawa Idempotency-Key ULID', async () => {
    const { fetch, panggilan } = palsu(200, { ok: true, id: 'V-1', dicatat_oleh: 'a' });
    const k = buatKlienAdmin({ baseUrl: 'http://x', token: 'T', fetch });
    await k.skorsVendor('V-1', { hari: 3, alasan: 'telat' });
    const h = panggilan[0].init.headers as Record<string, string>;
    expect(h['idempotency-key']).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(panggilan[0].init.body).toBe('{"hari":3,"alasan":"telat"}');
  });
  test('galat dipetakan ke GalatApi (429)', async () => {
    const { fetch } = palsu(429, { kode: 'TERLALU_BANYAK', pesan: 'pelan' });
    const k = buatKlienAdmin({ baseUrl: 'http://x', token: 'T', fetch });
    const e = (await k.katalogCermin().catch((x) => x)) as GalatApi;
    expect(e).toBeInstanceOf(GalatApi);
    expect([e.status, e.kode]).toEqual([429, 'TERLALU_BANYAK']);
  });
});
