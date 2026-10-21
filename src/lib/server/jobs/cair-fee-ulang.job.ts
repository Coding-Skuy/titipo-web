import type { DefJob } from '../jadwal';
import { jobCairUlang01 } from '../fee/cair';
import { depCairJob } from '../fee/layanan';

/** Ulang 01.00 WIB hanya bila 00.00 gagal; bila masih gagal admin memakai tombol cair manual. */
const job: DefJob = { nama: 'cair-fee-ulang', jadwal: { tipe: 'harian', jam: 1 }, jalankan: () => jobCairUlang01(depCairJob()) };
export default job;
