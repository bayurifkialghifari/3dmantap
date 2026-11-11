# Konsultasi dan penawaran

## Perilaku

Admin mencatat hasil konsultasi di CMS, lalu menerbitkan penawaran: harga produk, prabayar, ongkir, pasang, penerimaan, hari pengerjaan, dan spesifikasi. Revisi diarsipkan dan membatalkan persetujuan sebelumnya. Pelanggan menyetujui versi terbaru melalui aplikasi.

## Kontrak dan data

POST /admin/inquiries/:id/note, /quote, /revise; POST /inquiries/:id/approve

## Acceptance criteria

Revisi lama tidak dapat disetujui; penawaran membutuhkan konfirmasi admin dan catatan konsultasi.

## Verifikasi

Jalankan pemeriksaan kualitas README.md. Domain diuji dengan Bun; alur browser dan izin diuji melalui Playwright. Gunakan akun/token terpisah saat memeriksa akses privat.
