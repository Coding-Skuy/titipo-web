import type { DefJob } from '../jadwal';

/**
 * Setiap job menaruh berkas `<nama>.job.ts` dengan `export default DefJob` di folder ini;
 * dikumpulkan otomatis agar PR tiket terpisah tidak bertabrakan di berkas registri.
 */
const modul = import.meta.glob<{ default: DefJob }>('./*.job.ts', { eager: true });

export const daftarJob: DefJob[] = Object.values(modul).map((m) => m.default);
