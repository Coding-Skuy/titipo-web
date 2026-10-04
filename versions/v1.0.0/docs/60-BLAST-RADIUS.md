# 60-BLAST-RADIUS — titipo-web

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
