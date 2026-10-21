import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { depCairDariToken, beritaAcara, ledger, statusCair } from '$lib/server/fee/layanan';
import { cairManual, hMinus1 } from '$lib/server/fee/cair';

export const load: PageServerLoad = async () => {
  const baris = ledger.baris();
  const vendor = [...new Set(baris.map((b) => b.id_vendor))].map((id) => ({ id, ...ledger.akun(id) }));
  const tanggal = hMinus1(new Date());
  return {
    vendor,
    baris: baris.slice(-100).reverse(),
    tanggal,
    statusH1: statusCair.ambil(tanggal) ?? null,
    pekan: [...beritaAcara.keys()].sort().reverse()
  };
};

export const actions: Actions = {
  /** Tombol cair manual (bila 00.00 dan 01.00 gagal). Aktor wajib; dicatat di audit. */
  cairManual: async ({ request, locals }) => {
    const f = await request.formData();
    const tanggal = String(f.get('tanggal') ?? '');
    const aktor = String(f.get('aktor') ?? '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return fail(422, { galat: 'Tanggal harus YYYY-MM-DD' });
    // ASUMSI: identitas aktor diambil dari klaim token pada tahap auth; sementara dari kolom form (wajib).
    if (!aktor) return fail(422, { galat: 'Aktor wajib diisi' });
    const h = await cairManual(depCairDariToken(locals.token), tanggal, aktor);
    return h.ok ? { ok: true as const, dicairkan: h.dicairkan, dilewati: h.dilewati } : fail(502, { galat: h.galat ?? 'Gagal' });
  }
};
