import type { PageServerLoad } from './$types';
import {
  hitungPendamping,
  lampuRepeatKota,
  lampuRepeatVendor,
  nilaiLampu,
  repeat28,
  usulPrioritas
} from '$lib/metrik/hitung';
import { sumberMetrik } from '$lib/server/metrik/layanan';

export const load: PageServerLoad = async () => {
  const s = sumberMetrik();
  if (!s) return { tersedia: false as const };
  const sekarang = new Date();
  try {
    const [selesai, metrik, vendor] = await Promise.all([s.pesananSelesai(), s.pesananMetrik(), s.vendor()]);
    const kota = repeat28(selesai, sekarang);
    const pendamping = hitungPendamping(metrik, sekarang);
    const perVendor = vendor
      .filter((v) => v.status === 'prioritas')
      .map((v) => {
        const r = repeat28(selesai, sekarang, v.id_vendor);
        return { id: v.id_vendor, repeat: r, lampu: lampuRepeatVendor(r) };
      });
    return {
      tersedia: true as const,
      galat: null as string | null,
      kota: { nilai: kota, lampu: lampuRepeatKota(kota) },
      pendamping,
      lampu: nilaiLampu(pendamping),
      perVendor,
      usulan: usulPrioritas(vendor, selesai, sekarang)
    };
  } catch (e) {
    return { tersedia: true as const, galat: e instanceof Error ? e.message : 'Gagal memuat metrik', kota: null, pendamping: null, lampu: null, perVendor: [], usulan: [] };
  }
};
