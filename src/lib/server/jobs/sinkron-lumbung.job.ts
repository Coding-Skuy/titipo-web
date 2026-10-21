import type { DefJob } from '../jadwal';
import { sinkronLumbung } from '../katalog/cermin';
import { ambilKatalogLumbung, storeCermin } from '../katalog/layanan';

/** Job sinkron-lumbung 04.00 WIB (retry 3 kali, jeda 30 detik). */
const job: DefJob = {
  nama: 'sinkron-lumbung',
  jadwal: { tipe: 'harian', jam: 4 },
  jalankan: () => sinkronLumbung({ ambilKatalog: ambilKatalogLumbung(), store: storeCermin })
};

export default job;
