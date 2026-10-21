import { describe, expect, test } from 'bun:test';
import { buatAuditMemori } from '../audit';
import { buatStoreStatusCairMemori, cairFee, cairManual, hMinus1, jobCair00, jobCairUlang01 } from './cair';
import { buatLedgerMemori } from './ledger';
import type { PesananFee } from './hitung';

const psn: PesananFee[] = [
  { kode: 'T-2026-000112', id_vendor: 'V-SARI-001', total_item: 47000, prioritas: false },
  { kode: 'T-2026-000113', id_vendor: 'V-BUDI-002', total_item: 47000, prioritas: true }
];
const sekarang = () => new Date('2026-01-08T00:00:05+07:00');

describe('job cair-fee', () => {
  test('H-1 WIB', () => expect(hMinus1(sekarang())).toBe('2026-01-07'));

  test('00.00 mencairkan pesanan H-1 dan menulis ledger', async () => {
    const dep = { sumber: { pesananSelesai: async () => psn }, ledger: buatLedgerMemori(), status: buatStoreStatusCairMemori(), sekarang };
    const h = await jobCair00(dep);
    expect(h).toMatchObject({ ok: true, tanggal: '2026-01-07', dicairkan: 2 });
    expect(dep.ledger.akun('V-BUDI-002').saldo).toBe(9875);
    expect(await jobCairUlang01(dep)).toBeNull(); // sukses -> 01.00 tidak jalan
  });

  test('00.00 gagal -> 01.00 mengulang dan sukses', async () => {
    let gagal = true;
    const dep = {
      sumber: { pesananSelesai: async () => (gagal ? Promise.reject(new Error('backend 503')) : psn) },
      ledger: buatLedgerMemori(),
      status: buatStoreStatusCairMemori(),
      sekarang
    };
    expect((await jobCair00(dep)).ok).toBe(false);
    expect(dep.status.ambil('2026-01-07')).toBe('gagal');
    gagal = false;
    const ulang = await jobCairUlang01(dep);
    expect(ulang).toMatchObject({ ok: true, dicairkan: 2 });
  });

  test('menjalankan dua kali tidak menggandakan ledger', async () => {
    const dep = { sumber: { pesananSelesai: async () => psn }, ledger: buatLedgerMemori(), status: buatStoreStatusCairMemori(), sekarang };
    await cairFee(dep, '2026-01-07');
    const h2 = await cairFee(dep, '2026-01-07');
    expect([h2.dicairkan, h2.dilewati]).toEqual([0, 2]);
    expect(dep.ledger.baris().length).toBe(2);
  });

  test('cair manual mencatat aktor di audit dan menolak aktor kosong', async () => {
    const audit = buatAuditMemori(sekarang);
    const dep = { sumber: { pesananSelesai: async () => psn }, ledger: buatLedgerMemori(), status: buatStoreStatusCairMemori(), sekarang };
    await cairManual(dep, '2026-01-07', 'admin@titipo.id', audit);
    expect(audit.baca()[0]).toMatchObject({ aktor: 'admin@titipo.id', aksi: 'fee.cair-manual', sasaran: '2026-01-07' });
    expect(cairManual(dep, '2026-01-07', '', audit)).rejects.toThrow('aktor');
  });
});
