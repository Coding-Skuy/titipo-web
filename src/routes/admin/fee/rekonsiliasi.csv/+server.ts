import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { beritaAcara } from '$lib/server/fee/layanan';

/** GET /admin/fee/rekonsiliasi.csv?pekan=YYYY-MM-DD (Senin awal pekan). */
export const GET: RequestHandler = ({ url }) => {
  const pekan = url.searchParams.get('pekan') ?? '';
  const ba = beritaAcara.get(pekan);
  if (!ba) error(404, 'Berita acara pekan itu belum terbit');
  return new Response(ba.csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="rekonsiliasi-${pekan}.csv"`
    }
  });
};
