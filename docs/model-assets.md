# Model 3D dan kredit aset

## Sumber yang dibundel

Model dimuat sebagai GLB lokal. Geometri pakaian dan panel produk berasal dari mesh aset. Three.js digunakan untuk menampilkan mesh, material, pencahayaan, dan proyeksi artwork.

| File                                  | Pembuat dan sumber                                                                                                                                              | Lisensi                                                   | Pengolahan                                                                                                                                    |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| avatar, tshirt, hoodie, jacket, jeans | MakeHuman community / Kasper Olesen, [CharacterCreator output](https://github.com/kblood/CharacterCreator/tree/852e48f316b90a0937234886630e4fb4cdfd1f78/output) | CC0 1.0 untuk body/garment yang dihasilkan                | Delapan morph gender/weight/koreksi dipertahankan; rig/UV/PBR tetap dari sumber. Kaos memakai material polos untuk menghilangkan logo sumber. |
| fishermans_hat                        | [Poly Haven](https://polyhaven.com/a/fishermans_hat)                                                                                                            | [CC0 1.0](https://polyhaven.com/license)                  | Texture 1K, albedo dinetralkan agar bisa diberi warna; UV/normal/roughness dipertahankan.                                                     |
| sneaker                               | © 2021 Shopify, [MaterialsVariantsShoe](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/MaterialsVariantsShoe)                              | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Varian beach dipilih; varian lain dibuang, tekstur diperkecil ke 1K/JPEG.                                                                     |
| duffel                                | accidentallyc, [Duffel Bag](https://poly.pizza/m/rysPhwuIP4)                                                                                                    | CC0 1.0                                                   | Mesh low-poly asli; warna badan/tali dapat diubah.                                                                                            |
| furniture-parts                       | [Poly Haven modern wooden cabinet](https://polyhaven.com/a/modern_wooden_cabinet)                                                                               | [CC0 1.0](https://polyhaven.com/license)                  | Board dan pintu diekstrak, dipusatkan dan dinormalisasi ke unit panel; UV dan peta PBR asli dipertahankan.                                    |

[License notes upstream](https://github.com/kblood/CharacterCreator/blob/852e48f316b90a0937234886630e4fb4cdfd1f78/LICENSE-NOTES.md) membedakan lisensi kode GPL dari file garment CC0. Kode project sumber tidak disalin ke aplikasi ini. Kredit juga tersedia di /models/credits.html untuk pengguna aplikasi.

## Cara memperbarui

bun run models:prepare mengambil resource dalam scripts/assets/model-sources.json, memverifikasi SHA-256 sebelum mengolahnya, dan menulis sembilan GLB serta manifest output. File sumber dicache di .data/model-source-cache. URL garment dipin ke commit; resource lainnya dikunci dengan hash. Perubahan upstream harus ditinjau sebelum mengganti hash.

Jalankan aplikasi lalu bun run models:previews untuk merender thumbnail WebP dari viewer yang sama. Script ini memakai browser terpisah dan data ruangan sementara; tidak submit pesanan atau mengubah desain pengguna. PREVIEW_BASE_URL dapat mengganti origin lokal. GLB dan preview adalah aset runtime yang dikomit; cache sumber, screenshot QA dan hasil build tidak dikomit.

## Batas preview

Furniture parametrik dirakit dari komponen GLB kabinet. Dimensi/posisi panel mengikuti furniturePanels, sumber yang sama dengan daftar potong dan estimasi. UV diskalakan bersama panel sehingga arah dan ukuran serat tidak menggambarkan setiap bahan produksi secara presisi. Dinding/lantai denah tetap memakai geometri ruang sederhana.

Garment mengikuti rest pose sumber, tanpa simulasi kain atau pembuatan pola jahit. Tas memakai gaya low-poly. Tampilan aksen tersedia untuk tali tas yang mempunyai material terpisah; satu material pakaian diberi warna utama. GLB toko yang diupload menggantikan model default dan perlu area cetak yang sesuai. Thumbnail katalog menggambarkan model default per jenis; konfigurasi aktual ditampilkan di viewer 3D. Gambar, bahan, ukuran dan produksi akhir dikonfirmasi saat konsultasi.

## Verifikasi

Runtime memask segitiga tubuh yang tertutup kaos/celana atau lengan garment panjang pada salinan mesh, untuk menjaga kulit di bawah pakaian. Source GLB/cache tidak dimutasi. Artwork dipakai dibake ke UV; target fisik ekspor cetak tetap memakai DesignDocument dan surfaceSvg yang sama.

Tes Bun memeriksa integritas file, batas cache, mesh finite, referensi self-contained serta ukuran/UV/PBR komponen panel. Playwright menunggu GLB benar-benar selesai dimuat untuk semua 13 produk dan memeriksa custom artwork serta room planner. Referensi Dribbble tidak berhasil diakses pada sesi ini; tampilan tidak diklaim sebagai salinan desain Dribbble tertentu.

Tes proyeksi juga memeriksa konversi atribut quantized tanpa mengubah geometri sumber, serta penolakan sisi belakang/brim horizontal untuk cetak depan.

## Karakter manusia dan proporsi sepatu

Avatar berasal dari base_body.glb pada commit CharacterCreator yang sama dengan garment. Delapan morph gender/weight beserta koreksi pasangan dipertahankan dengan targetNames yang selaras; target lain dibuang. Tekstur avatar dioptimalkan ke 1K dan SHA-256 input/output dicatat. Body dan garment mempertahankan UV/skin weights serta rig/rest pose bersama; runtime memuat kaos/celana bersamaan untuk menutupi tubuh. models:prepare juga menghasilkan metadata kalibrasi penampang/landmark dan lima preset bind-relative melalui scripts/calibrate-avatar.ts. Renderer memfit tubuh/garment bersama lalu mengkalibrasi tinggi anatomis dalam pose berdiri. Preview dipakai tersedia untuk empat garment bawaan yang kompatibel. [Ukuran tubuh dan pose](body-poses.md).

Sepatu panjang pada sumbu X. Runtime mempertahankan orientasi ini dan skala seragam berdasarkan sumbu horizontal terpanjang. Thumbnail diregenerasi setelah koreksi. Untuk merender jenis tertentu gunakan bun run models:previews shoe; room dan hero juga dapat dipilih sebagai argumen.
