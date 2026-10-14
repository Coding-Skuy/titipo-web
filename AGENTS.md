# AGENTS.md — titipo-web

Web admin TitipO (kurasi vendor, pantau pesanan, katalog cermin, fee ledger, metrik) beserta 4 job terjadwal.

Divisi TitipO (Epic E2 [#3](https://github.com/Coding-Skuy/ChefGenie-TownHall/issues/3), milestone v1.0.0). Bahasa semua artefak: Indonesia.

## Sumber kebenaran

Dokumen beku v1.0.0 ada di repo [TitipO-TownHall](https://github.com/Coding-Skuy/TitipO-TownHall). Repo ini hanya menjalankan, bukan mendefinisikan, requirement.

| Dokumen | Isi | Link |
|---|---|---|
| `platform/versions/v1.0.0/BRD/10-vendor-kurasi.md` | Kurasi vendor 5 syarat, tingkatan, skors | [buka](https://github.com/Coding-Skuy/TitipO-TownHall/blob/main/platform/versions/v1.0.0/BRD/10-vendor-kurasi.md) |
| `platform/versions/v1.0.0/BRD/30-keuangan-fee.md` | Fee 12%, bonus Prioritas, denda, cair H+1 | [buka](https://github.com/Coding-Skuy/TitipO-TownHall/blob/main/platform/versions/v1.0.0/BRD/30-keuangan-fee.md) |
| `platform/versions/v1.0.0/FRD/10-fungsional.md` | Kebutuhan fungsional FR-001..FR-304 | [buka](https://github.com/Coding-Skuy/TitipO-TownHall/blob/main/platform/versions/v1.0.0/FRD/10-fungsional.md) |
| `platform/versions/v1.0.0/FSD/10-alur.md` | Alur sistem, tulis lokal dahulu, sinkron | [buka](https://github.com/Coding-Skuy/TitipO-TownHall/blob/main/platform/versions/v1.0.0/FSD/10-alur.md) |
| `platform/versions/v1.0.0/FSD/30-kontrak.md` | Kontrak API, event, galat | [buka](https://github.com/Coding-Skuy/TitipO-TownHall/blob/main/platform/versions/v1.0.0/FSD/30-kontrak.md) |
| `platform/versions/v1.0.0/SRS/30-non-functional.md` | Non-fungsional (kinerja, keamanan, rollback) | [buka](https://github.com/Coding-Skuy/TitipO-TownHall/blob/main/platform/versions/v1.0.0/SRS/30-non-functional.md) |
| `platform/versions/v1.0.0/SRS/40-acceptance-criteria.md` | Kriteria penerimaan QA gate | [buka](https://github.com/Coding-Skuy/TitipO-TownHall/blob/main/platform/versions/v1.0.0/SRS/40-acceptance-criteria.md) |
| `produk/21-kontrak-api-web-bun.md` | Kontrak API admin 6 endpoint (living) | [buka](https://github.com/Coding-Skuy/TitipO-TownHall/blob/main/produk/21-kontrak-api-web-bun.md) |
| `pesanan/10-alur-titip-harian.md` | Alur 8 langkah + sinyal pedaree.stok.v1 sisi konsumen (§6) (living) | [buka](https://github.com/Coding-Skuy/TitipO-TownHall/blob/main/pesanan/10-alur-titip-harian.md) |
| `keuangan/10-bagi-fee.md` | Bagi fee, 3 kasus hitungan (living) | [buka](https://github.com/Coding-Skuy/TitipO-TownHall/blob/main/keuangan/10-bagi-fee.md) |
| `metrik/10-repeat-order.md` | Metrik repeat-order (living) | [buka](https://github.com/Coding-Skuy/TitipO-TownHall/blob/main/metrik/10-repeat-order.md) |
| `KONTEKS-LINTAS-DIVISI.md` | Konteks lintas-divisi (event registry, ID, satuan, metrik) | [buka](https://github.com/Coding-Skuy/ChefGenie-TownHall/blob/main/KONTEKS-LINTAS-DIVISI.md) |
| `townhall-roadmap.md` | Epic E2 #3, milestone v1.0.0, Definisi Selesai §6 | [buka](https://github.com/Coding-Skuy/ChefGenie-TownHall/blob/main/townhall-roadmap.md) |

Aturan:
- Dilarang menduplikasi requirement di repo kode; cukup tautkan ke versi di atas.
- Requirement berubah = PR di TitipO-TownHall dahulu (versi baru), baru kode mengikuti.
- Bila dokumen divisi bertentangan dengan KONTEKS-LINTAS-DIVISI.md, laporkan; jangan memperbaiki diam-diam.

## Tech stack terkunci

- Bun 1.4.x (versi dikunci exact saat coding kickoff; `engines.bun >=1.4.0 <1.5.0`), Svelte 5 (runes), SvelteKit 2 (adapter-node), TypeScript 5.9.x strict.
- DB PostgreSQL 16 (DB logis `titipo`), migrasi berurutan; uang rupiah integer, berat gram integer, waktu timestamptz UTC.
- 5 halaman admin: vendor, pesanan (polling 30 detik), katalog cermin, fee ledger, metrik repeat. 4 job: sinkron-lumbung 04.00, timeout-konfirmasi tiap 1 menit, cair-fee 00.00, arsip tanggal 1 jam 02.00.
- Dilarang: Next.js, React, Node sebagai runtime, checkout rumah tangga di web, menghitung ulang fee di klien web, service key di browser.

Angka bisnis TitipO yang berlaku di seluruh repo: fee vendor 12% (+0,5% Prioritas), ongkir flat Rp5.000 (Rp4.000 vendor + Rp1.000 kas), pesan maksimal 20.00, serah 06.00-08.00, pokok ke Lumbung tiap Senin, denda batal sepihak Rp15.000, maksimal 50 kg per transaksi (di atasnya ditandai grosir), ID pesanan `T-2026-NNNNNN`.

## Aturan kerja AI

a. Baca AGENTS.md ini dan seluruh ADR di `docs/decisions/` sebelum menulis kode.
b. TDD merah-hijau: tulis test yang gagal dahulu. Rilis diblokir bila QA gate (SRS/40-acceptance-criteria.md) gagal.
c. Kontrak API/event hanya diubah lewat bump versi + catatan di ADR baru.
d. Pesan commit berawalan `docs:`, `feat:`, atau `fix:`; wajib memperbarui `CHANGELOG.md` repo ini.
e. Keputusan arsitektur baru = tambah ADR bernomor di `docs/decisions/`; jangan mengedit ADR lama (immutable, sama seperti aturan versi TownHall).
f. Dilarang menyentuh DB divisi lain (DB per service; Titeny read-only).
g. Khusus repo ini:
- Semua aksi tulis admin wajib mencatat aktor (audit append-only). Rate-limit admin 600 req per menit per IP.

## Definisi selesai

- Dokumen versi lengkap (BRD/PRD/FRD/FSD/SRS) + `SNAPSHOT-ROADMAP.md`.
- QA gate berbasis SRS lulus (TDD merah-hijau).
- Kontrak API terbit; audit keamanan bersih (JWT audiens + DB per service).
- Bukti metrik lintas-divisi (KONTEKS §7) tercatat.
- CHANGELOG versi diperbarui; dokumen beku tidak diedit.
Sumber: [townhall-roadmap.md §6](https://github.com/Coding-Skuy/ChefGenie-TownHall/blob/main/townhall-roadmap.md)
