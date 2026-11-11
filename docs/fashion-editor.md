# Studio Fashion

## Perilaku

Template baju, hoodie, jaket, celana, bucket hat, sepatu, dan duffel dapat diubah warna utama, ukuran, jumlah, varian ukuran, serta artwork. Tali tas memiliki warna tersendiri; pakaian sumber memakai satu material utama. Bentuk mengikuti GLB yang sudah disiapkan, dengan UV/PBR dan rest pose sumber. Draft, undo/redo dan reset berlaku per template.

GLB ditempatkan pada dasar Y=0 dan disesuaikan ke dimensi template. Perubahan ukuran tidak membuat pola jahit atau simulasi jatuh kain. Material pakaian/topi diberi warna utama, sepatu mempertahankan varian beach pada warna awal. Nama ID template lama dipertahankan untuk kompatibilitas desain/pengajuan.

Area depan/belakang bucket hat dipusatkan pada crown sesuai model sumber. Posisi dan ukuran artwork tetap menggunakan koordinat area cetak tersebut; brim memerlukan area tersendiri bila toko menawarkan cetak di sana.

## Kontrak dan data

Tombol Preview dipakai tersedia pada detail/Studio untuk kaos, hoodie, jaket dan celana bawaan. Material/warna/artwork desain dibawa ke manusia 170 cm; kaos/celana netral melengkapi pakaian. Jaket terbuka memakai kaos di bawahnya. Lihat produk saja mengembalikan viewer produk.

Mode dipakai mengembalikan rest pose garment sumber sehingga pilihan ukuran belum mensimulasikan longgar/ketat atau bentuk tubuh pelanggan. Topi, sepatu, tas dan GLB unggahan belum dipasangkan pada karakter. [Batas preview manusia](human-preview.md).

Sepatu bawaan mempertahankan orientasi sumber dan skala seragam. Panjang horizontal terbesar mengikuti lebar template; tinggi/depth visual mengikuti proporsi GLB, tanpa peregangan ke dimensi nominal.

DesignDocument; POST /library/designs

## Acceptance criteria

Perubahan terlihat dalam 3D dan bertahan setelah reload; jumlah varian digunakan dalam estimasi.

## Verifikasi

Jalankan pemeriksaan kualitas README.md. Domain diuji dengan Bun; alur browser dan izin diuji melalui Playwright. Gunakan akun/token terpisah saat memeriksa akses privat.
