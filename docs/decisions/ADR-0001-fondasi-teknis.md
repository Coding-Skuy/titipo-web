# ADR-0001 — Fondasi teknis titipo-web

Status: Diterima | Tanggal: 2026-10-14

## Konteks

titipo-web adalah bagian divisi TitipO (Epic E2 #3, milestone v1.0.0). Spesifikasi v1.0.0 beku sejak 2026-10-07 di [TitipO-TownHall](https://github.com/Coding-Skuy/TitipO-TownHall/blob/main/platform/versions/v1.0.0/FSD/30-kontrak.md). Repo ini memerlukan fondasi teknis yang tetap agar pengembangan oleh AI dan manusia konsisten.

## Keputusan

Keputusan kunci CEO yang berlaku untuk repo ini:

1. **Stack web terkunci.** Bun + Svelte 5 + SvelteKit 2 + TypeScript 5.9.x strict. Next.js dan React dilarang.
2. **Web hanya admin.** Tidak ada checkout rumah tangga dan tidak ada layar vendor di web; semua itu milik mobile.
3. **Job terjadwal.** sinkron-lumbung 04.00 (retry 3 kali interval 30 detik), timeout-konfirmasi tiap 1 menit, cair-fee 00.00 (ulang 01.00 bila gagal), arsip tanggal 1 jam 02.00.
4. **JWT audiens titipo + service key.** Peran admin/operasi; token audiens selain titipo ditolak 403. Service key titipo-lumbung hanya di env server, tidak pernah ke browser.

Keputusan lintas repo: satu DB logis per service, JWT beraudien divisi, kunci idempoten ULID klien pada semua POST, uang integer rupiah, waktu timestamptz UTC.

## Konsekuensi

Kenaikan versi Bun/Svelte/Kit/TS butuh PR dan ADR baru. Pin di `package.json` yang masih berupa rentang caret wajib dikunci exact saat coding kickoff.
ADR ini immutable; perubahan keputusan ditulis sebagai ADR baru yang menggantikan.
