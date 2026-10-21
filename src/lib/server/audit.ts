/** Audit append-only aksi tulis admin (AGENTS.md aturan g): hanya `catat` dan `baca`, tanpa ubah/hapus. */
export interface CatatanAudit {
  waktu: string;
  aktor: string;
  aksi: string;
  sasaran: string;
  detail?: Record<string, unknown>;
}

export interface Audit {
  catat(c: Omit<CatatanAudit, 'waktu'>): CatatanAudit;
  baca(): readonly CatatanAudit[];
}

export function buatAuditMemori(sekarang: () => Date = () => new Date()): Audit {
  const daftar: CatatanAudit[] = [];
  return {
    catat(c) {
      if (!c.aktor) throw new Error('aktor wajib diisi untuk aksi tulis admin');
      const baris = Object.freeze({ ...c, waktu: sekarang().toISOString() });
      daftar.push(baris);
      return baris;
    },
    baca: () => [...daftar]
  };
}

/** Singleton proses; ganti dengan adapter DB `titipo` saat tersedia (asumsi, belum ada kontrak tabel audit). */
export const audit: Audit = buatAuditMemori();
