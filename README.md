# TitipO Web Admin — Divisi TitipO (Community Commerce)

> Panel admin operasional TitipO: kelola vendor, pesanan titip harian, dan langganan.
> TownHall: [TitipO-TownHall](https://github.com/Coding-Skuy/TitipO-TownHall).
> Auth ikut pola Lumbung: JWT `aud=titipo` — lihat [Lumbung-TownHall](https://github.com/Coding-Skuy/Lumbung-TownHall).

## Teknologi (pin)

- Bun `1.4.x`
- Svelte `5`
- SvelteKit `2`
- TypeScript `5.9.x`

Lihat `package.json` untuk pin tepat.

## Mulai

```bash
bun install
bun run dev
```

Buka http://localhost:5173 — halaman `/` menampilkan status admin + tautan TownHall.

## Auth admin

1. Login via Lumbung, minta scope admin TitipO.
2. JWT harus memuat `aud=titipo` dan `role=admin`.
3. Setiap request ke backend sertakan `Authorization: Bearer <token>`.

Detail kontrak: https://github.com/Coding-Skuy/titipo-backend-service/blob/main/docs/auth.md

## Struktur

```text
src/routes/+page.svelte   # dasbor awal
svelte.config.js          # adapter-node
package.json              # pin versi
```

## Tautan

- TownHall: https://github.com/Coding-Skuy/TitipO-TownHall
- Backend: https://github.com/Coding-Skuy/titipo-backend-service
- Infra/CI web: https://github.com/Coding-Skuy/titipo-infra-devops/blob/main/ci/build-rust-web.md
