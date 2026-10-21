import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { audit } from '$lib/server/audit';
import { klienDari } from '$lib/server/konfig';
import { aksiSkors, aksiVerifikasi, type HasilAksi } from '$lib/server/vendor/aksi';
import { petakanGalat } from '$lib/vendor/galat';
import { STATUS_VENDOR, adalahStatusVendor, cekSyarat, lolosSkor } from '$lib/vendor/kurasi';

export const load: PageServerLoad = async ({ locals, url }) => {
  const param = url.searchParams.get('status');
  const status = adalahStatusVendor(param) ? param : 'calon';
  const lanjut = url.searchParams.get('lanjut') ?? undefined;
  try {
    const r = await klienDari(locals.token).daftarVendor({ status, batas: 20, lanjut });
    return {
      status,
      semuaStatus: STATUS_VENDOR,
      galat: null as string | null,
      lanjut: r.lanjut,
      vendor: r.data.map((v) => ({ ...v, syarat: cekSyarat(v), lolos: lolosSkor(v) }))
    };
  } catch (e) {
    return { status, semuaStatus: STATUS_VENDOR, galat: petakanGalat(e).galat, lanjut: null, vendor: [] };
  }
};

const balas = (id: string, r: HasilAksi) => (r.ok ? { id, ...r } : fail(r.status, { id, galat: r.galat }));

export const actions: Actions = {
  verifikasi: async ({ request, locals }) => {
    const f = await request.formData();
    const id = String(f.get('id') ?? '');
    return balas(id, await aksiVerifikasi(klienDari(locals.token), audit, id, f));
  },
  skors: async ({ request, locals }) => {
    const f = await request.formData();
    const id = String(f.get('id') ?? '');
    return balas(id, await aksiSkors(klienDari(locals.token), audit, id, f));
  }
};
