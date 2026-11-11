# Studio Fashion

## Perilaku

Template baju, hoodie, jaket, celana, bucket hat, sepatu, dan duffel dapat diubah warna utama, ukuran, jumlah, varian ukuran, serta artwork. Tali tas memiliki warna tersendiri; pakaian sumber memakai satu material utama. Bentuk mengikuti GLB yang sudah disiapkan, dengan UV/PBR dan rest pose sumber. Draft, undo/redo dan reset berlaku per template.

GLB ditempatkan pada dasar Y=0 dan disesuaikan ke dimensi template. Perubahan ukuran tidak membuat pola jahit atau simulasi jatuh kain. Material pakaian/topi diberi warna utama, sepatu mempertahankan varian beach pada warna awal. Nama ID template lama dipertahankan untuk kompatibilitas desain/pengajuan.

Area depan/belakang bucket hat dipusatkan pada crown sesuai model sumber. Posisi dan ukuran artwork tetap menggunakan koordinat area cetak tersebut; brim memerlukan area tersendiri bila toko menawarkan cetak di sana.

## Kontrak dan data

DesignDocument; POST /library/designs

## Acceptance criteria

Perubahan terlihat dalam 3D dan bertahan setelah reload; jumlah varian digunakan dalam estimasi.

## Verifikasi

Jalankan pemeriksaan kualitas README.md. Domain diuji dengan Bun; alur browser dan izin diuji melalui Playwright. Gunakan akun/token terpisah saat memeriksa akses privat.
