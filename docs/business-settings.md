# Pengaturan bisnis

## Perilaku

Nama toko, WhatsApp, alamat, pesan bisnis dan rekening bank dapat diubah admin. Harga dan tarif produksi berada pada template; DP, penerimaan, ongkir/pasang dan lead time disepakati per penawaran.

## Kontrak dan data

GET/PUT /settings

## Acceptance criteria

Pengaturan WhatsApp menghasilkan link nomor yang benar; role biasa tidak bisa mengubah rekening atau nomor toko.

## Verifikasi

Jalankan pemeriksaan kualitas README.md. Domain diuji dengan Bun; alur browser dan izin diuji melalui Playwright. Gunakan akun/token terpisah saat memeriksa akses privat.
