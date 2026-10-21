import { describe, expect, test } from 'bun:test';
import { GalatApi, type KlienAdmin } from '$lib/api/klien';
import { buatAuditMemori } from '../audit';
import { aksiSkors, aksiVerifikasi } from './aksi';

const form = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};
const ok = { ok: true as const, id: 'V-BUDI-002', dicatat_oleh: 'admin@titipo.id' };

function klienPalsu(over: Partial<KlienAdmin> = {}) {
  const panggilan: { fn: string; args: unknown[] }[] = [];
  const k = {
    verifikasiVendor: async (...args: unknown[]) => (panggilan.push({ fn: 'verifikasi', args }), ok),
    skorsVendor: async (...args: unknown[]) => (panggilan.push({ fn: 'skors', args }), ok),
    ...over
  } as unknown as KlienAdmin;
  return { k, panggilan };
}

describe('aksiVerifikasi', () => {
  test('setuju kirim kuota 30 dan catat audit dengan aktor dari server', async () => {
    const { k, panggilan } = klienPalsu();
    const audit = buatAuditMemori();
    const r = await aksiVerifikasi(k, audit, 'V-BUDI-002', form({ setuju: 'true', skor_kebersihan: '85' }));
    expect(r.ok).toBe(true);
    expect(panggilan[0].args).toEqual(['V-BUDI-002', { setuju: true, kuota_harian: 30 }]);
    expect(audit.baca()[0]).toMatchObject({ aktor: 'admin@titipo.id', aksi: 'vendor.verifikasi.setuju', sasaran: 'V-BUDI-002' });
  });
  test('skor < 80 tidak memanggil backend', async () => {
    const { k, panggilan } = klienPalsu();
    const r = await aksiVerifikasi(k, buatAuditMemori(), 'V', form({ setuju: 'true', skor_kebersihan: '79' }));
    expect(r).toMatchObject({ ok: false, status: 422 });
    expect(panggilan.length).toBe(0);
  });
  test('tolak mencatat alasan', async () => {
    const { k, panggilan } = klienPalsu();
    const audit = buatAuditMemori();
    await aksiVerifikasi(k, audit, 'V', form({ setuju: 'false', alasan: 'Skor < 80' }));
    expect(panggilan[0].args[1]).toEqual({ setuju: false, alasan: 'Skor < 80' });
    expect(audit.baca()[0].detail).toEqual({ alasan: 'Skor < 80' });
  });
  test('429 dari backend dipetakan dan audit tidak ditulis', async () => {
    const { k } = klienPalsu({ verifikasiVendor: async () => Promise.reject(new GalatApi(429, 'TERLALU_BANYAK', 'x')) });
    const audit = buatAuditMemori();
    const r = await aksiVerifikasi(k, audit, 'V', form({ setuju: 'true' }));
    expect(r).toMatchObject({ ok: false, status: 429 });
    expect(audit.baca().length).toBe(0);
  });
});

describe('aksiSkors', () => {
  const sekarang = new Date('2026-03-01T00:00:00Z');
  test('hari 5 ditolak sebelum memanggil backend', async () => {
    const { k, panggilan } = klienPalsu();
    expect(await aksiSkors(k, buatAuditMemori(), 'V', form({ hari: '5', alasan: 'x' }), sekarang)).toMatchObject({ ok: false, status: 422 });
    expect(panggilan.length).toBe(0);
  });
  test('skors ke-3 dalam 90 hari memberi peringatan keluar', async () => {
    const { k } = klienPalsu();
    const audit = buatAuditMemori(() => new Date('2026-02-01T00:00:00Z'));
    await aksiSkors(k, audit, 'V', form({ hari: '3', alasan: 'a' }), new Date('2026-02-01T00:00:00Z'));
    const a2 = await aksiSkors(k, audit, 'V', form({ hari: '3', alasan: 'b' }), new Date('2026-02-10T00:00:00Z'));
    expect(a2.ok && a2.peringatan).toBeFalsy();
    const a3 = await aksiSkors(k, audit, 'V', form({ hari: '7', alasan: 'c' }), sekarang);
    expect(a3.ok && a3.peringatan).toContain('ke-3');
  });
  test('403 (peran operasi) dipetakan', async () => {
    const { k } = klienPalsu({ skorsVendor: async () => Promise.reject(new GalatApi(403, 'DILARANG', 'x')) });
    expect(await aksiSkors(k, buatAuditMemori(), 'V', form({ hari: '3', alasan: 'x' }))).toMatchObject({ ok: false, status: 403 });
  });
});
