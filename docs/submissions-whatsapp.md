# Pengajuan dan WhatsApp

## Perilaku

Submit memvalidasi dokumen, kepemilikan asset, nama dan nomor telepon. Pengajuan serta snapshot disimpan dengan kunci idempotensi sebelum membuka halaman konsultasi. Tombol WhatsApp memuat nomor pengajuan, produk, estimasi dan link preview. Pelanggan sendiri mengirim pesan. Nomor toko kosong menonaktifkan link, tetapi pengajuan tetap tercatat.

## Kontrak dan data

POST /inquiries; GET /inquiries/:id/whatsapp

## Acceptance criteria

Retry kunci yang sama tidak menggandakan pengajuan. Mengklik WhatsApp tidak mengubah status persetujuan/produksi.

## Verifikasi

Jalankan pemeriksaan kualitas README.md. Domain diuji dengan Bun; alur browser dan izin diuji melalui Playwright. Gunakan akun/token terpisah saat memeriksa akses privat.
