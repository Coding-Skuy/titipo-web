import type { Handle } from '@sveltejs/kit';
import { daftarJob } from '$lib/server/jobs';
import { mulaiJob } from '$lib/server/jadwal';

// Job terjadwal dijalankan di proses server (adapter-node); tidak aktif saat build/prerender.
let jobBerjalan = false;
if (!jobBerjalan && !import.meta.env.DEV) {
  jobBerjalan = true;
  mulaiJob(daftarJob);
}

/**
 * Token admin dibaca dari cookie `sesi` (JWT Lumbung aud=titipo; login dilakukan di Lumbung, TitipO tidak punya endpoint login).
 * Verifikasi tanda tangan/audiens/peran tetap dilakukan backend (403 bila audiens salah).
 */
export const handle: Handle = async ({ event, resolve }) => {
  event.locals.token = event.cookies.get('sesi') ?? null;
  return resolve(event);
};
