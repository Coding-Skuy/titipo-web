/**
 * Penjadwal job Bun (FSD 30-kontrak "Job Bun 4 jadwal"). Logika waktu murni agar bisa diuji;
 * pewaktu nyata disuntik. Asumsi: jam jadwal = WIB (UTC+7, tanpa DST); keuangan/10-bagi-fee.md menyebut "00.00 WIB".
 */
const WIB_MS = 7 * 3600_000;

export type Jadwal =
  | { tipe: 'harian'; jam: number; menit?: number }
  | { tipe: 'interval'; ms: number }
  | { tipe: 'bulanan'; tanggal: number; jam: number; menit?: number }
  | { tipe: 'mingguan'; hari: number; jam: number; menit?: number }; // hari 0=Minggu .. 1=Senin

export interface DefJob {
  nama: string;
  jadwal: Jadwal;
  jalankan: (sekarang: Date) => Promise<unknown>;
}

/** Waktu jalan berikutnya (lebih besar dari `sekarang`). */
export function jalanBerikut(jadwal: Jadwal, sekarang: Date): Date {
  if (jadwal.tipe === 'interval') return new Date(sekarang.getTime() + jadwal.ms);
  const wib = new Date(sekarang.getTime() + WIB_MS); // baca komponen via getUTC*
  const menit = jadwal.menit ?? 0;
  let c: Date;
  if (jadwal.tipe === 'harian') {
    c = new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate(), jadwal.jam, menit));
    if (c <= wib) c = new Date(c.getTime() + 86400_000);
  } else if (jadwal.tipe === 'mingguan') {
    c = new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate(), jadwal.jam, menit));
    c = new Date(c.getTime() + ((jadwal.hari - c.getUTCDay() + 7) % 7) * 86400_000);
    if (c <= wib) c = new Date(c.getTime() + 7 * 86400_000);
  } else {
    c = new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), jadwal.tanggal, jadwal.jam, menit));
    if (c <= wib) c = new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth() + 1, jadwal.tanggal, jadwal.jam, menit));
  }
  return new Date(c.getTime() - WIB_MS);
}

export interface OpsiRetry {
  percobaan: number;
  jedaMs: number;
  tidur?: (ms: number) => Promise<void>;
}

export interface HasilRetry<T> {
  ok: boolean;
  percobaan: number;
  nilai?: T;
  galat?: unknown;
}

/** Jalankan `fn` hingga `percobaan` kali dengan jeda tetap (mis. 3 kali, 30 detik). */
export async function jalankanDenganRetry<T>(fn: (ke: number) => Promise<T>, opsi: OpsiRetry): Promise<HasilRetry<T>> {
  const tidur = opsi.tidur ?? ((ms) => new Promise<void>((r) => setTimeout(r, ms)));
  let galat: unknown;
  for (let ke = 1; ke <= opsi.percobaan; ke++) {
    try {
      return { ok: true, percobaan: ke, nilai: await fn(ke) };
    } catch (e) {
      galat = e;
      if (ke < opsi.percobaan) await tidur(opsi.jedaMs);
    }
  }
  return { ok: false, percobaan: opsi.percobaan, galat };
}

/** Mulai semua job; kembalikan fungsi penghenti. Galat job dicatat, tidak menjatuhkan proses. */
export function mulaiJob(
  defs: DefJob[],
  dep: {
    sekarang?: () => Date;
    setTimer?: typeof setTimeout;
    clearTimer?: typeof clearTimeout;
    log?: (pesan: string, galat?: unknown) => void;
  } = {}
): () => void {
  const sekarang = dep.sekarang ?? (() => new Date());
  const setT = dep.setTimer ?? setTimeout;
  const clearT = dep.clearTimer ?? clearTimeout;
  const log = dep.log ?? ((p, g) => console.error(`[job] ${p}`, g ?? ''));
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  let berhenti = false;

  const jadwalkan = (d: DefJob) => {
    if (berhenti) return;
    const tunggu = Math.max(0, jalanBerikut(d.jadwal, sekarang()).getTime() - sekarang().getTime());
    timers.set(
      d.nama,
      setT(async () => {
        try {
          await d.jalankan(sekarang());
        } catch (e) {
          log(`${d.nama} gagal`, e);
        }
        jadwalkan(d);
      }, tunggu)
    );
  };
  defs.forEach(jadwalkan);
  return () => {
    berhenti = true;
    timers.forEach((t) => clearT(t));
  };
}
