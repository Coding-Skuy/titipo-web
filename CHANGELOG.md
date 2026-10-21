# CHANGELOG — titipo-web

## [Belum dirilis]

### Ditambahkan
- 2026-10-21 (TTP-WEB-003): perhitungan fee Varian 1 (3 kasus mengikat), ledger append-only dengan saldo tidak negatif + tunggakan denda, aturan tarik (06.00, min Rp50.000, biaya Rp2.500), job `cair-fee` 00.00 (ulang 01.00, cair manual beraudit), berita acara CSV rekonsiliasi Senin 09.00 dan halaman `/admin/fee`.
- 2026-10-21 (TTP-WEB fondasi): klien API admin bertipe dari openapi backend (`src/lib/api`), penjadwal job + retry (`src/lib/server/jadwal.ts`), audit append-only, `tsconfig`/`vite.config`/`app.html`, skrip `bun test`, pin versi exact sesuai ADR-0001.
- 2026-10-14: fondasi AI-dev v1.0.0 (`AGENTS.md`, `CLAUDE.md`, `docs/decisions/ADR-0001-fondasi-teknis.md`, `versions/v1.0.0/docs/40-TECHSTACK.md`, `versions/v1.0.0/docs/60-BLAST-RADIUS.md`).
