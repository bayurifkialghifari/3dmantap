# Status dan progres

## Perilaku

Status berurutan dari submitted, consulting, awaiting_approval, awaiting_payment, production, ready, shipped, sampai completed; pembatalan hanya sebelum produksi. Timeline memuat konsultasi dan foto progres. Pengunjung memakai link akses privat; pelanggan juga melihat daftar pengajuan di pustaka.

## Kontrak dan data

GET /inquiries/:id; POST /admin/inquiries/:id/status

## Acceptance criteria

Perubahan status yang melompati gerbang bisnis ditolak; halaman memperbarui data dan menampilkan revisi/pembayaran terkini.

## Verifikasi

Jalankan pemeriksaan kualitas README.md. Domain diuji dengan Bun; alur browser dan izin diuji melalui Playwright. Gunakan akun/token terpisah saat memeriksa akses privat.
