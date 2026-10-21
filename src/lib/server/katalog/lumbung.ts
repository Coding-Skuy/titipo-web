import type { KatalogLumbung } from './cermin';

export interface OpsiLumbung {
  /**
   * URL katalog Lumbung (env `LUMBUNG_KATALOG_URL`). ASUMSI: endpoint & bentuk respons belum ada di kontrak beku;
   * dipakai bentuk skema `Katalog` openapi TitipO ({ diperbarui, data: ItemKatalog[] }). Konfirmasi dengan divisi Lumbung.
   */
  url: string;
  /** `TITIPO_SERVICE_KEY` (env server, tidak pernah ke browser). */
  serviceKey: string;
  fetch?: typeof fetch;
}

export function buatAmbilKatalogLumbung(o: OpsiLumbung): () => Promise<KatalogLumbung> {
  const f = o.fetch ?? fetch;
  return async () => {
    const res = await f(o.url, { headers: { 'X-Titipo-Service-Key': o.serviceKey, accept: 'application/json' } });
    if (!res.ok) throw new Error(`Lumbung membalas HTTP ${res.status}`);
    return (await res.json()) as KatalogLumbung;
  };
}
