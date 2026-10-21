import { env } from '$env/dynamic/private';
import { buatStoreCerminMemori } from './cermin';
import { buatAmbilKatalogLumbung } from './lumbung';

/** Singleton proses. ASUMSI: persistensi DB `titipo` (tabel snapshot) belum ada kontraknya; sementara memori proses. */
export const storeCermin = buatStoreCerminMemori();

export function ambilKatalogLumbung() {
  return buatAmbilKatalogLumbung({
    url: env.LUMBUNG_KATALOG_URL ?? '',
    serviceKey: env.TITIPO_SERVICE_KEY ?? ''
  });
}
