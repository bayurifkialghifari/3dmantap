# Katalog dan preview 3D

## Perilaku

Katalog memfilter studio, kategori, nama, serta urutan harga dasar/nama. Halaman setiap produk menyediakan orbit, zoom, reset kamera, dan opsi masuk editor. Daftar memakai ilustrasi ringan; viewer dimuat pada detail produk.

## Kontrak dan data

GET /templates; GET /templates/:id

## Acceptance criteria

Semua 13 template awal membuka viewer tanpa error; kegagalan WebGL memiliki fallback gambar.

## Verifikasi

Jalankan pemeriksaan kualitas README.md. Domain diuji dengan Bun; alur browser dan izin diuji melalui Playwright. Gunakan akun/token terpisah saat memeriksa akses privat.
