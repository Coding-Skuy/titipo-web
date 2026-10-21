import type { DefJob } from '../jadwal';
import { jobCair00 } from '../fee/cair';
import { depCairJob } from '../fee/layanan';

/** Job cair-fee 00.00 WIB: hitung pesanan selesai H-1, tulis ledger. */
const job: DefJob = { nama: 'cair-fee', jadwal: { tipe: 'harian', jam: 0 }, jalankan: () => jobCair00(depCairJob()) };
export default job;
