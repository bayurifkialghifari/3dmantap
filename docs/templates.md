# Produk dan template

## Perilaku

Admin mengatur kategori bebas, studio, harga, model awal atau GLB, ukuran, area cetak, warna dan tarif. Form sederhana dilengkapi editor dokumen JSON tervalidasi. Model GLB menggunakan meter, dasar Y=0. Template dan harga awal diberi tanda demo serta perlu validasi produksi bisnis.

## Kontrak dan data

PUT /templates/:id; POST /assets kind=model

## Acceptance criteria

Pelanggan tidak dapat mengubah template; publikasi memerlukan area cetak dan model GLB valid bila dipilih.

## Verifikasi

Jalankan pemeriksaan kualitas README.md. Domain diuji dengan Bun; alur browser dan izin diuji melalui Playwright. Gunakan akun/token terpisah saat memeriksa akses privat.
