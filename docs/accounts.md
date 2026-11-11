# Akun dan akses

## Perilaku

Better Auth email/password memakai sesi HttpOnly. Password minimal 12 karakter. Admin dibootstrap dari environment, bukan melalui form publik. Pengunjung memperoleh token perangkat acak; fitur privat memeriksa kepemilikan atau tautan akses.

## Kontrak dan data

/auth/*; GET /me

## Acceptance criteria

Login admin membuka CMS; akun biasa tidak boleh mengakses API admin.

## Verifikasi

Jalankan pemeriksaan kualitas README.md. Domain diuji dengan Bun; alur browser dan izin diuji melalui Playwright. Gunakan akun/token terpisah saat memeriksa akses privat.
