# CHANGELOG — titipo-web

## [Belum dirilis]

### Ditambahkan
- 2026-10-21 (TTP-WEB-004): halaman `/admin/vendor` (antrean calon, 5 syarat, skor minimal 80), aksi verifikasi (setuju kuota 30 / tolak beralasan) dan skors (hanya 3 atau 7 hari, peringatan skors ke-3 dalam 90 hari), pemetaan galat 401/403/422/429, semua aksi tulis dicatat di audit dengan aktor.
- 2026-10-21 (TTP-WEB fondasi): klien API admin bertipe dari openapi backend (`src/lib/api`), penjadwal job + retry (`src/lib/server/jadwal.ts`), audit append-only, `tsconfig`/`vite.config`/`app.html`, skrip `bun test`, pin versi exact sesuai ADR-0001.
- 2026-10-14: fondasi AI-dev v1.0.0 (`AGENTS.md`, `CLAUDE.md`, `docs/decisions/ADR-0001-fondasi-teknis.md`, `versions/v1.0.0/docs/40-TECHSTACK.md`, `versions/v1.0.0/docs/60-BLAST-RADIUS.md`).
