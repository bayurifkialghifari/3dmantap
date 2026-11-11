# PWA dan offline draft

## Perilaku

Manifest, service worker, ikon aplikasi dan shell statis memungkinkan instalasi web app. Draft editor dan ruangan disimpan lokal. Submit, pembayaran, akun dan server library memerlukan jaringan. API, bukti pembayaran dan file privat tidak diprecache.

Model GLB default, thumbnail WebP dan font WOFF2 ikut precache statis. Setiap GLB yang dibundel berukuran di bawah batas 5 MB; total sembilan GLB sekitar 8,3 MiB termasuk avatar. Model toko/asset privat yang diambil dari API memerlukan jaringan dan tidak diprecache. Warna manifest mengikuti tampilan studio netral.

## Kontrak dan data

vite-plugin-pwa; browser localStorage

## Acceptance criteria

Manifest/build tersedia; aplikasi tidak menyajikan pembayaran privat dari cache offline.

## Verifikasi

Jalankan pemeriksaan kualitas README.md. Domain diuji dengan Bun; alur browser dan izin diuji melalui Playwright. Gunakan akun/token terpisah saat memeriksa akses privat.

Karakter dan garment bawaan tersedia offline untuk preview dipakai dan pembanding ruangan. GLB privat toko dan API tetap memerlukan jaringan.
