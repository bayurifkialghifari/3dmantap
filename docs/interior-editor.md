# Studio Interior

## Perilaku

Meja, lemari, rak, kabinet, pintu, dan panel menggunakan ukuran parametrik. Kabinet/rak mendukung kolom, ambalan, pintu, dan laci. Backend menghitung daftar panel dan estimasi dari konfigurasi yang sama dengan viewer.

Viewer memakai komponen board/pintu dari GLB kabinet Poly Haven, mempertahankan UV dan tekstur PBR. Komponen diduplikasi dengan dimensi, rotasi dan posisi panel dari generator fisik. Finishing memberi tint ilustratif pada tekstur; jenis bahan serta serat final ditentukan saat konsultasi. [Pengolahan model](model-assets.md) menjelaskan batas geometri dan tekstur.

Laci memakai kolom pertama; pintu dimulai dari kolom berikutnya. Ambalan kolom laci berada di atas tumpukan laci dengan ruang bersih minimal 10 cm. Area cetak depan berasal dari panel pintu dan muka laci nyata, termasuk ID dan titik pusatnya. Rak terbuka tanpa pintu/laci menyediakan sisi dan permukaan atas untuk artwork.

## Kontrak dan data

DesignDocument; furniturePanels; priceDesign

## Acceptance criteria

Perubahan lebar mengubah geometri, daftar potong dan harga; konfigurasi tidak layak ditandai sebelum submit.

## Verifikasi

Jalankan pemeriksaan kualitas README.md. Domain diuji dengan Bun; alur browser dan izin diuji melalui Playwright. Gunakan akun/token terpisah saat memeriksa akses privat.
