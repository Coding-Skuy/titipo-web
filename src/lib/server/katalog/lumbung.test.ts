import { describe, expect, test } from 'bun:test';
import { buatAmbilKatalogLumbung } from './lumbung';

const katalog = { diperbarui: '2026-01-08T04:00:00+07:00', data: [] };

describe('buatAmbilKatalogLumbung', () => {
  test('mengirim X-Titipo-Service-Key ke URL Lumbung dan mengurai JSON', async () => {
    let dipanggil: { url: string; headers: Record<string, string> } | undefined;
    const fetchPalsu = (async (url: string, init: { headers: Record<string, string> }) => {
      dipanggil = { url, headers: init.headers };
      return new Response(JSON.stringify(katalog), { status: 200 });
    }) as unknown as typeof fetch;
    const ambil = buatAmbilKatalogLumbung({ url: 'http://localhost:9/katalog', serviceKey: 'kunci-uji', fetch: fetchPalsu });
    expect(await ambil()).toEqual(katalog as never);
    expect(dipanggil?.url).toBe('http://localhost:9/katalog');
    expect(dipanggil?.headers['X-Titipo-Service-Key']).toBe('kunci-uji');
  });

  test('status non-2xx melempar galat berisi kode HTTP (tanpa membocorkan kunci)', async () => {
    const fetchPalsu = (async () => new Response('x', { status: 503 })) as unknown as typeof fetch;
    const ambil = buatAmbilKatalogLumbung({ url: 'http://localhost:9/k', serviceKey: 'rahasia', fetch: fetchPalsu });
    const galat = await ambil().then(() => null, (e: Error) => e);
    expect(galat?.message).toBe('Lumbung membalas HTTP 503');
    expect(galat?.message).not.toContain('rahasia');
  });
});
