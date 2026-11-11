# CMS bisnis

## Perilaku

Admin mengelola daftar pengajuan, pencarian/status, detail pelanggan, konsultasi, penawaran, revisi, bukti transfer, progres, status produksi, template, pelanggan, jobs, audit, dan pengaturan. Semua endpoint admin memeriksa role pada server.

## Kontrak dan data

/admin/inquiries; /admin/customers; /admin/jobs; /admin/audit

## Acceptance criteria

Pengajuan muncul sebelum konsultasi; admin tidak bisa memulai produksi ketika gerbang belum lengkap.

## Verifikasi

Jalankan pemeriksaan kualitas README.md. Domain diuji dengan Bun; alur browser dan izin diuji melalui Playwright. Gunakan akun/token terpisah saat memeriksa akses privat.
