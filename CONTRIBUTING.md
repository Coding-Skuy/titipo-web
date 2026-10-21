# Kontribusi ke titipo-web

Bahasa semua artefak (issue, commit, PR, dokumen): Indonesia. Baca dahulu [AGENTS.md](./AGENTS.md) dan seluruh ADR di `docs/decisions/`.

## Alur: fork -> branch -> atomic commit -> PR

1. Fork `Coding-Skuy/titipo-web` ke akun sendiri, clone fork, tambah remote `upstream` ke repo org.
   ```bash
   gh repo fork Coding-Skuy/titipo-web --clone=false
   gh repo clone <akun>/titipo-web && cd titipo-web
   git remote add upstream https://github.com/Coding-Skuy/titipo-web.git
   ```
2. Buat branch dari `upstream/main`. Satu branch = satu tiket = satu PR.
   Format: `feat/<kode-tiket>-<slug>`, `fix/…`, `test/…`, `docs/…`, `chore/…`
   (contoh `feat/ttp-web-002-sinkron-lumbung`).
3. Commit atomic: satu perubahan logis per commit. Pesan berawalan `docs:`, `feat:`, atau `fix:` (lihat AGENTS.md butir d), ditulis dalam bahasa Indonesia. Perbarui `CHANGELOG.md`.
4. Push ke fork, buka PR ke `Coding-Skuy/titipo-web` base `main` memakai template PR. Cantumkan `Closes #N` untuk tiket.
5. PR tidak di-merge oleh penulisnya; tinjauan manusia (CODEOWNERS) wajib. Jangan force-push ke `main`.

## Aturan
- TDD merah-hijau; jalankan `bun install && bun run check && bun test` sebelum PR.
- Dokumen `versions/v*` dan ADR lama immutable; keputusan baru = ADR baru.
- Jangan commit rahasia (`.env`, kunci, token).
