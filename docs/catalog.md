# Katalog dan preview 3D

## Perilaku

Katalog memfilter studio, kategori, nama, serta urutan harga dasar/nama. Halaman setiap produk menyediakan orbit, zoom, reset kamera, dan opsi masuk editor. Daftar memakai thumbnail WebP yang dirender dari GLB; viewer dimuat pada detail produk. Loading tampil di luar canvas; kegagalan model menampilkan fallback dan pesan muat ulang.

Model default dipilih per modelKind dari aset lokal; glbAssetId milik template menggantikannya. Detail/Studio menampilkan konfigurasi template yang berlaku. Thumbnail menggambarkan model default per jenis dan belum dibuat ulang otomatis untuk setiap upload/perubahan CMS. Sumber dan batas visual dijelaskan dalam [model-assets](model-assets.md).

## Kontrak dan data

GET /templates; GET /templates/:id

## Acceptance criteria

Semua 13 template awal membuka viewer tanpa error; kegagalan WebGL memiliki fallback gambar.

## Verifikasi

Jalankan pemeriksaan kualitas README.md. Domain diuji dengan Bun; alur browser dan izin diuji melalui Playwright. Gunakan akun/token terpisah saat memeriksa akses privat.

Thumbnail Canvas Sneaker dirender ulang dengan orientasi GLB asli dan skala seragam. Detail dan katalog memperlihatkan proporsi yang sama.
