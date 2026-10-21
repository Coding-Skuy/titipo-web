import { beforeAll, describe, expect, mock, test } from 'bun:test';

// `$env/dynamic/private` hanya ada di runtime SvelteKit; dipalsukan agar modul layanan bisa dimuat di bun test.
mock.module('$env/dynamic/private', () => ({ env: {} }));
mock.module('$lib/server/konfig', () => ({ urlApi: () => 'http://localhost:0' }));

let GET: (e: { url: URL }) => Response | Promise<Response>;
let beritaAcara: Map<string, unknown>;
let buatBeritaAcara: typeof import('$lib/server/fee/rekonsiliasi').buatBeritaAcara;

beforeAll(async () => {
  ({ GET } = (await import('./+server')) as never);
  ({ beritaAcara } = (await import('$lib/server/fee/layanan')) as never);
  ({ buatBeritaAcara } = await import('$lib/server/fee/rekonsiliasi'));
});

const panggil = (q: string) => GET({ url: new URL(`http://x/admin/fee/rekonsiliasi.csv${q}`) });

describe('GET /admin/fee/rekonsiliasi.csv', () => {
  test('pekan belum terbit -> 404', async () => {
    let status = 0;
    try {
      await panggil('?pekan=2026-01-05');
    } catch (e) {
      status = (e as { status: number }).status;
    }
    expect(status).toBe(404);
  });

  test('tanpa parameter pekan -> 404', async () => {
    let status = 0;
    try {
      await panggil('');
    } catch (e) {
      status = (e as { status: number }).status;
    }
    expect(status).toBe(404);
  });

  test('pekan terbit -> CSV dengan header unduh', async () => {
    const ba = buatBeritaAcara('2026-01-05', '2026-01-11', []);
    beritaAcara.set('2026-01-05', ba);
    const res = await panggil('?pekan=2026-01-05');
    expect(res.headers.get('content-type')).toBe('text/csv; charset=utf-8');
    expect(res.headers.get('content-disposition')).toBe('attachment; filename="rekonsiliasi-2026-01-05.csv"');
    expect(await res.text()).toBe(ba.csv);
  });
});
