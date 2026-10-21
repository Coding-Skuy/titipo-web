# ADR-0002 — Tata kelola branch dan alur PR

Status: Diusulkan | Tanggal: 2026-10-21

## Konteks

Beberapa kontributor (manusia dan AI) mengerjakan titipo-web paralel. Perlu alur seragam agar `main` stabil dan riwayat dapat ditelusuri ke tiket.

## Keputusan

1. Kontribusi lewat fork -> branch dari `upstream/main` -> atomic commit -> PR ke `main` (detail di `CONTRIBUTING.md`).
2. Satu branch = satu tiket = satu PR; nama branch `feat|fix|test|docs|chore/<kode-tiket>-<slug>`.
3. PR memakai `.github/pull_request_template.md`; `CODEOWNERS` menetapkan `@Coding-Skuy` sebagai peninjau.
4. Penulis PR tidak merge PR sendiri.

## Usulan proteksi branch `main` (USULAN, belum diterapkan)

Perubahan pengaturan repo dilakukan oleh admin org, bukan oleh PR ini:
- Wajib PR dan minimal 1 persetujuan dari code owner.
- Wajib status check lulus (`bun run check`, `bun test`) dan branch up-to-date.
- Larang force-push dan penghapusan `main`.
- Wajib riwayat linear / squash merge; selesaikan semua percakapan sebelum merge.

## Konsekuensi

Alur sedikit lebih formal, tetapi setiap perubahan terkait tiket dan tertinjau. ADR ini immutable; perubahan ditulis sebagai ADR baru.
