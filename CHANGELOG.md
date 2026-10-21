# CHANGELOG — titipo-web

## [Belum dirilis]

### Ditambahkan
- 2026-10-21 (TTP-WEB-005): query repeat 28 hari bergulir, 4 metrik pendamping dengan ambang, usul Prioritas otomatis (repeat >=40% 4 minggu + rating >=4,7), job `timeout-konfirmasi` tiap 1 menit (alih maks 2 kali lalu refund H+1) dan dashboard `/admin/metrik`.
- 2026-10-21 (TTP-WEB fondasi): klien API admin bertipe dari openapi backend (`src/lib/api`), penjadwal job + retry (`src/lib/server/jadwal.ts`), audit append-only, `tsconfig`/`vite.config`/`app.html`, skrip `bun test`, pin versi exact sesuai ADR-0001.
- 2026-10-14: fondasi AI-dev v1.0.0 (`AGENTS.md`, `CLAUDE.md`, `docs/decisions/ADR-0001-fondasi-teknis.md`, `versions/v1.0.0/docs/40-TECHSTACK.md`, `versions/v1.0.0/docs/60-BLAST-RADIUS.md`).
