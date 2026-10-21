import type { DefJob } from '../jadwal';
import { depTimeoutJob } from '../metrik/layanan';
import { jalankanTimeout } from '../metrik/timeout';

let sudahPeringatan = false;

/** Job timeout-konfirmasi tiap 1 menit. Tanpa adapter data terpasang, job no-op dengan satu peringatan. */
const job: DefJob = {
  nama: 'timeout-konfirmasi',
  jadwal: { tipe: 'interval', ms: 60_000 },
  jalankan: async () => {
    const dep = depTimeoutJob();
    if (!dep) {
      if (!sudahPeringatan) console.warn('[job] timeout-konfirmasi: sumber data belum dipasang (kontrak daftar-menunggu/cadangan/refund belum ada)');
      sudahPeringatan = true;
      return null;
    }
    return jalankanTimeout(dep);
  }
};
export default job;
