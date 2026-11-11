# Pembayaran transfer

## Perilaku

Rekening dikonfigurasi di pengaturan bisnis. Pelanggan yang sudah menyetujui penawaran mengunggah bukti gambar dan nominal. Admin memeriksa lalu memverifikasi bukti. Produksi membutuhkan prabayar; pengiriman/penyelesaian membutuhkan pelunasan termasuk ongkir/pasang. Bukti merupakan file privat.

Saat penawaran direvisi, bukti lama tetap tercatat. Bukti dipindahkan ke revisi terbaru saat penawaran diterbitkan dan status verifikasinya dibatalkan, sehingga admin harus memeriksanya lagi. Riwayat revisi mempertahankan snapshot sebelumnya.

## Kontrak dan data

POST /inquiries/:id/payments; POST /admin/inquiries/:id/payments/:paymentId/verify

## Acceptance criteria

Bukti tanpa persetujuan/current revision ditolak. Pelanggan tidak dapat memverifikasi pembayarannya sendiri.

## Verifikasi

Jalankan pemeriksaan kualitas README.md. Domain diuji dengan Bun; alur browser dan izin diuji melalui Playwright. Gunakan akun/token terpisah saat memeriksa akses privat.
