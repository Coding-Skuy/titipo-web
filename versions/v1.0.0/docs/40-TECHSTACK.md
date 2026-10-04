# 40-TECHSTACK — titipo-web

STATUS: defined pending (target dikunci, implementasi menunggu).

Mengacu: TitipO-TownHall v1.0.0

## 1. Target stack

| Lapisan | Teknologi + versi | Keterangan |
|---|---|---|
| Runtime | Bun 1.4.x latest | Bukan Node; package manager bun; test bun test |
| UI | Svelte 5 (runes $state, $derived) | Tanpa options API lama |
| Kerangka | SvelteKit 2 adapter-node | SSR tabel admin, CSR grafik |
| Bahasa | TypeScript 5.9.x strict | strict dan noUncheckedIndexedAccess true |
| DB | PostgreSQL 16 via bun:sql | Sumber kebenaran DB titipo |
| Migrasi | migrasi berurutan 001_vendor.sql 002_pesanan.sql | Pemilik skema server |
| Auth | JWT peran admin dan operasi | Tulis butuh admin |

Aturan bisnis yang dijaga server: pesan maksimal 20.00, serah 06.00–08.00, fee 12 persen, repeat minimal 40 persen, JWT beraudien titipo, service key titipo ke lumbung.

## 2. Konfigurasi kunci

- 5 halaman admin: vendor, pesanan polling 30 detik, katalog cermin, fee ledger, metrik repeat.
- 4 job: sinkron-lumbung 04.00 retry 3 kali 30 detik, timeout-konfirmasi tiap 1 menit, cair-fee 00.00, arsip tanggal 1 jam 02.00.
- Rate-limit admin 600 req per menit per IP; deploy `bun run bangun` restart service downtime target di bawah 30 detik.
- Backup DB harian 03.00 retensi 30 hari; secret via env tanpa secret di repo.

## Batasan

- Hanya web admin; tidak ada checkout rumah tangga dan tidak ada layar vendor di web.
- Tidak menghitung ulang fee dan grade di klien web untuk angka sah; angka sah dari server.
- Dilarang pindah runtime atau menaikkan versi Bun 1.4.x, Svelte 5, Kit 2, TS 5.9.x tanpa PR.
