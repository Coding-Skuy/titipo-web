# 60-BLAST-RADIUS — titipo-web

> Versi: v1.0.0 | Status: disetujui | Menggantikan: -
> Acuan: [TitipO-TownHall platform/versions/v1.0.0](https://github.com/Coding-Skuy/TitipO-TownHall/tree/main/platform/versions/v1.0.0) (BRD/PRD/FRD/FSD/SRS beku 2026-10-07).

## Konsumen

- Pengguna langsung: admin dan operasi TitipO (kurasi, pantau, fee, metrik).
- Hulu: `titipo-backend-service` dan DB titipo (baca tulis admin), katalog Lumbung (snapshot cermin 04.00).
- Hilir: aplikasi KMP membaca hasil (snapshot, status verifikasi, saldo fee).

## Failure

- Job sinkron-lumbung gagal 3 kali: snapshot kemarin tetap berlaku + banner merah di admin; mobile mengunci pesan bila umur di atas 24 jam.
- Job cair-fee gagal: ulang 01.00 sekali; bila masih gagal, tombol cair manual admin dengan audit aktor.
- DB titipo down: halaman admin baca gagal; tulis ditolak; tidak ada tulis lokal admin sebagai pengganti.
- Secret JWT atau service key salah: semua tulis admin 401 atau 403; perbaiki env dan rotasi tanpa ubah kode.

## Rollback

- Rollback berarti deploy ulang build sebelumnya dan restart service; migrasi DB maju tidak otomatis mundur.
- Bila migrasi sudah jalan, rollback kode wajib kompatibel baca dengan skema baru; tidak ada downgrade skema tanpa skrip khusus.
- Snapshot katalog tidak dihapus saat rollback; versi snapshot tetap vNNN terakhir yang valid.

## Batasan

- Dampak maksimal halaman admin dan job terjadwal; tidak menyentuh biner mobile, model AI, atau pipeline event.
- Insiden DB dan secret dieskalasi ke pemilik infra dan backend, bukan perbaikan di lapisan UI.

## Boleh disentuh

5 halaman admin, 4 job terjadwal, tulis DB `titipo` untuk kurasi/skors/alihkan/ledger, snapshot katalog cermin.

## Dilarang

Checkout rumah tangga, layar vendor, hitung ulang fee di klien web, service key ke browser, DB Lumbung, Next.js/React.

## Kontrak yang dikonsumsi

Katalog Lumbung (snapshot cermin 04.00 via service key server); JWT peran admin/operasi; token visual `titipo-design`.

## Kontrak yang diproduksi

Endpoint admin 6 (FSD/30-kontrak.md), 4 job, event `fee.dicairkan`, `pesanan.dialihkan`, `konflik.dicatat` ke outbox bila diimplementasi di sisi ini.

Sumber batas: [townhall-roadmap.md §2](https://github.com/Coding-Skuy/ChefGenie-TownHall/blob/main/townhall-roadmap.md) baris TitipO (pesan <=20.00, serah 06.00-08.00; sinyal `pedaree.stok.v1` anjuran saja; fee vendor 12%) dan [KONTEKS-LINTAS-DIVISI.md](https://github.com/Coding-Skuy/ChefGenie-TownHall/blob/main/KONTEKS-LINTAS-DIVISI.md) §3, §8, §9.
