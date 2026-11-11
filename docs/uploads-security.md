# Upload dan keamanan

## Perilaku

Batas file 20 MB; raster diperiksa berdasarkan signature/metadata Sharp, SVG menolak script/event/external resource/DOCTYPE, GLB diperiksa header. Assets memiliki metadata owner/kind dan akses server. Read-only preview hanya boleh membaca artwork yang dirujuk desain; bukti dan progress memakai akses pengajuan privat.

## Kontrak dan data

POST/GET /assets

## Acceptance criteria

SVG berbahaya, file palsu, model dari pelanggan dan bukti milik pengunjung lain ditolak.

## Verifikasi

Jalankan pemeriksaan kualitas README.md. Domain diuji dengan Bun; alur browser dan izin diuji melalui Playwright. Gunakan akun/token terpisah saat memeriksa akses privat.
