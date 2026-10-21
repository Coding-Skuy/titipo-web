import { env } from '$env/dynamic/private';
import { buatKlienAdmin } from '$lib/api/klien';
import { urlApi } from '../konfig';
import { buatStoreStatusCairMemori, type DepCair } from './cair';
import { buatLedgerMemori } from './ledger';
import type { BeritaAcara } from './rekonsiliasi';
import { sumberFeeDariApi } from './sumber';

/** Singleton proses. ASUMSI: ledger persisten di DB `titipo` (skema belum ada di kontrak); sementara memori proses. */
export const ledger = buatLedgerMemori();
export const statusCair = buatStoreStatusCairMemori();
export const beritaAcara = new Map<string, BeritaAcara>();

/**
 * Job berjalan tanpa sesi pengguna. ASUMSI: token layanan admin di env `TITIPO_JOB_TOKEN` (belum ada di kontrak;
 * auth server-ke-server yang terdokumentasi hanya `X-Titipo-Service-Key` titipo->lumbung).
 */
export function depCairJob(): DepCair {
  return {
    sumber: sumberFeeDariApi(buatKlienAdmin({ baseUrl: urlApi(), token: env.TITIPO_JOB_TOKEN ?? '' })),
    ledger,
    status: statusCair
  };
}

export function depCairDariToken(token: string | null): DepCair {
  return { sumber: sumberFeeDariApi(buatKlienAdmin({ baseUrl: urlApi(), token: token ?? '' })), ledger, status: statusCair };
}
