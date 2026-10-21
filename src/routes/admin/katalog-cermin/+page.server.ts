import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { GalatApi } from '$lib/api/klien';
import { klienDari } from '$lib/server/konfig';
import { storeCermin } from '$lib/server/katalog/layanan';
import { lebihDari24Jam } from '$lib/server/katalog/cermin';
import { audit } from '$lib/server/audit';

export const load: PageServerLoad = async ({ locals }) => {
  const lokal = await storeCermin.status();
  const banner = lokal.gagal || (lokal.snapshot !== null && lebihDari24Jam(lokal.snapshot, new Date()));
  try {
    const cermin = await klienDari(locals.token).katalogCermin();
    return { cermin, galat: null as string | null, banner, galatJob: lokal.galatTerakhir ?? null, versi: lokal.snapshot?.versi ?? null };
  } catch (e) {
    const galat = e instanceof GalatApi ? `${e.status} ${e.kode}: ${e.message}` : 'Backend tidak terjangkau';
    return { cermin: null, galat, banner, galatJob: lokal.galatTerakhir ?? null, versi: lokal.snapshot?.versi ?? null };
  }
};

export const actions: Actions = {
  /** Tombol "Sinkron ulang": memanggil POST /admin/katalog-cermin/sinkron (kontrak admin §2.6). */
  sinkron: async ({ locals }) => {
    try {
      const r = await klienDari(locals.token).sinkronKatalog();
      audit.catat({ aktor: r.dicatat_oleh, aksi: 'katalog-cermin.sinkron', sasaran: r.id });
      return { ok: true as const, oleh: r.dicatat_oleh };
    } catch (e) {
      if (e instanceof GalatApi) return fail(e.status, { galat: `${e.kode}: ${e.message}` });
      return fail(502, { galat: 'Backend tidak terjangkau' });
    }
  }
};
