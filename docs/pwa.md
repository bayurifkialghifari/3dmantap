# PWA dan offline draft

## Perilaku

Manifest, service worker, ikon aplikasi dan shell statis memungkinkan instalasi web app. Draft editor dan ruangan disimpan lokal. Submit, pembayaran, akun dan server library memerlukan jaringan. API, bukti pembayaran dan file privat tidak diprecache.

## Kontrak dan data

vite-plugin-pwa; browser localStorage

## Acceptance criteria

Manifest/build tersedia; aplikasi tidak menyajikan pembayaran privat dari cache offline.

## Verifikasi

Jalankan pemeriksaan kualitas README.md. Domain diuji dengan Bun; alur browser dan izin diuji melalui Playwright. Gunakan akun/token terpisah saat memeriksa akses privat.
