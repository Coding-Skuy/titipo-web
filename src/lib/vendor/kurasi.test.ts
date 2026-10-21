import { describe, expect, test } from 'bun:test';
import { GalatApi } from '$lib/api/klien';
import { petakanGalat } from './galat';
import {
  adalahStatusVendor,
  cekSyarat,
  hitungSkors90Hari,
  skorsBerikutBerakibatKeluar,
  validasiSkors,
  validasiVerifikasi
} from './kurasi';

describe('validasiVerifikasi', () => {
  test('setuju: kuota 30 dan skor 85 lolos', () => {
    expect(validasiVerifikasi({ setuju: 'true' }, { skor_kebersihan: 85 })).toEqual({ ok: true, nilai: { setuju: true, kuota_harian: 30 } });
  });
  test('setuju ditolak bila skor < 80 (batas 80 lolos)', () => {
    expect(validasiVerifikasi({ setuju: 'true' }, { skor_kebersihan: 79 }).ok).toBe(false);
    expect(validasiVerifikasi({ setuju: 'true' }, { skor_kebersihan: 80 }).ok).toBe(true);
  });
  test('tolak wajib alasan', () => {
    expect(validasiVerifikasi({ setuju: 'false', alasan: '  ' }).ok).toBe(false);
    expect(validasiVerifikasi({ setuju: 'false', alasan: ' Skor < 80 ' })).toEqual({ ok: true, nilai: { setuju: false, alasan: 'Skor < 80' } });
  });
  test('nilai setuju asing ditolak', () => expect(validasiVerifikasi({ setuju: 'mungkin' }).ok).toBe(false));
});

describe('validasiSkors', () => {
  test('hanya 3 atau 7', () => {
    for (const h of ['3', '7']) expect(validasiSkors({ hari: h, alasan: 'telat' }).ok).toBe(true);
    for (const h of ['0', '1', '5', '30', '3.5', '-3', '', 'tiga', null]) expect(validasiSkors({ hari: h, alasan: 'x' }).ok).toBe(false);
  });
  test('alasan wajib', () => expect(validasiSkors({ hari: '3', alasan: '' }).ok).toBe(false));
});

describe('skors 3x dalam 90 hari', () => {
  const now = new Date('2026-03-01T00:00:00Z');
  test('hanya hitung dalam jendela 90 hari', () => {
    expect(hitungSkors90Hari(['2026-02-01T00:00:00Z', '2025-11-01T00:00:00Z', '2026-02-20T00:00:00Z'], now)).toBe(2);
  });
  test('skors ke-3 berakibat keluar, ke-2 belum', () => {
    expect(skorsBerikutBerakibatKeluar(['2026-02-01T00:00:00Z'], now)).toBe(false);
    expect(skorsBerikutBerakibatKeluar(['2026-02-01T00:00:00Z', '2026-02-10T00:00:00Z'], now)).toBe(true);
  });
});

describe('cekSyarat 5 syarat', () => {
  test('selalu 5 butir; kebersihan mengikuti skor, KTP dari dokumen', () => {
    const s = cekSyarat({ skor_kebersihan: 85, dokumen: ['ktp.jpg', 'lapak1.jpg'] });
    expect(s.length).toBe(5);
    expect(s.find((x) => x.kunci === 'kebersihan')?.status).toBe('lolos');
    expect(s.find((x) => x.kunci === 'ktp_domisili')?.status).toBe('lolos');
    expect(s.find((x) => x.kunci === 'sla')?.status).toBe('tidak_diketahui');
    expect(cekSyarat({ skor_kebersihan: 60 }).find((x) => x.kunci === 'kebersihan')?.status).toBe('gagal');
  });
});

describe('status & galat', () => {
  test('adalahStatusVendor', () => {
    expect(adalahStatusVendor('calon')).toBe(true);
    expect(adalahStatusVendor('AAA')).toBe(false);
    expect(adalahStatusVendor('')).toBe(false);
  });
  test('429 dan 403 dipetakan ke pesan admin', () => {
    expect(petakanGalat(new GalatApi(429, 'X', 'x')).status).toBe(429);
    expect(petakanGalat(new GalatApi(429, 'X', 'x')).galat).toContain('600');
    expect(petakanGalat(new GalatApi(403, 'X', 'x')).galat).toContain('admin');
    expect(petakanGalat(new Error('net')).status).toBe(502);
  });
});
