import { MatchersV3, PactV4 } from '@pact-foundation/pact';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buatKlienAdmin } from '../../src/lib/api/client';

const { like, eachLike, regex, integer, string, datetime } = MatchersV3;

const provider = new PactV4({
  consumer: 'titipo-web',
  provider: 'titipo-backend-service',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'warn'
});

const AUTH = { Authorization: 'Bearer token-uji-admin' };

describe('kontrak admin titipo-web -> titipo-backend-service (contract/openapi.yaml)', () => {
  it('GET /admin/vendor?status=calon -> antrean kurasi vendor', async () => {
    await provider
      .addInteraction()
      .given('ada vendor berstatus calon')
      .uponReceiving('permintaan antrean kurasi vendor calon')
      .withRequest('GET', '/admin/vendor', (b) => b.headers(AUTH).query({ status: 'calon' }))
      .willRespondWith(200, (b) =>
        b.jsonBody({
          data: eachLike({
            id: string('V-BUDI-002'),
            nama: string('Warung Budi'),
            status: regex(/^(calon|aktif|prioritas|skors|keluar)$/, 'calon'),
            skor_kebersihan: integer(85)
          }),
          lanjut: like(null)
        })
      )
      .executeTest(async (mock) => {
        const res = await buatKlienAdmin(mock.url, 'token-uji-admin').daftarVendor({ status: 'calon' });
        expect(res.data[0].id).toBe('V-BUDI-002');
        expect(res.data[0].status).toBe('calon');
      });
  });

  it('GET /admin/pesanan?status=disiapkan -> pesanan + agregat', async () => {
    await provider
      .addInteraction()
      .given('ada pesanan berstatus disiapkan')
      .uponReceiving('permintaan pantau pesanan harian')
      .withRequest('GET', '/admin/pesanan', (b) =>
        b.headers(AUTH).query({ status: 'disiapkan', hari: '2026-01-07' })
      )
      .willRespondWith(200, (b) =>
        b.jsonBody({
          data: eachLike({
            kode: regex(/^T-[0-9]{4}-[0-9]{6}$/, 'T-2026-000112'),
            status: string('disiapkan'),
            id_vendor: string('V-BUDI-002'),
            total_item: integer(35000),
            ongkir: 5000,
            total_bayar: integer(40000)
          }),
          agregat: { total: integer(132), terlambat: integer(4), batal: integer(1) },
          lanjut: like(null)
        })
      )
      .executeTest(async (mock) => {
        const res = await buatKlienAdmin(mock.url, 'token-uji-admin').daftarPesanan({
          status: 'disiapkan',
          hari: '2026-01-07'
        });
        expect(res.data[0].ongkir).toBe(5000);
        expect(res.agregat.total).toBeGreaterThanOrEqual(0);
      });
  });

  it('GET /admin/katalog-cermin -> status snapshot', async () => {
    await provider
      .addInteraction()
      .given('snapshot katalog cermin tersedia')
      .uponReceiving('permintaan status katalog cermin')
      .withRequest('GET', '/admin/katalog-cermin', (b) => b.headers(AUTH))
      .willRespondWith(200, (b) =>
        b.jsonBody({
          diperbarui: datetime("yyyy-MM-dd'T'HH:mm:ss'Z'", '2026-01-07T04:00:00Z'),
          sumber: 'lumbung',
          jumlah_sku: integer(48),
          status: string('ok')
        })
      )
      .executeTest(async (mock) => {
        const res = await buatKlienAdmin(mock.url, 'token-uji-admin').katalogCermin();
        expect(res.sumber).toBe('lumbung');
        expect(res.jumlah_sku).toBe(48);
      });
  });

  it('GET /admin/vendor tanpa peran admin -> 403', async () => {
    await provider
      .addInteraction()
      .given('token beraudiens bukan titipo atau peran bukan admin')
      .uponReceiving('permintaan antrean vendor oleh non-admin')
      .withRequest('GET', '/admin/vendor', (b) => b.headers({ Authorization: 'Bearer token-uji-bukan-admin' }))
      .willRespondWith(403)
      .executeTest(async (mock) => {
        await expect(buatKlienAdmin(mock.url, 'token-uji-bukan-admin').daftarVendor()).rejects.toMatchObject({
          status: 403
        });
      });
  });
});
