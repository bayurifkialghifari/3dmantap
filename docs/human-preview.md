# Preview manusia dan pakaian

## Perilaku

Room Planner memiliki manusia pembanding default 170 cm, selalu memakai kaos/celana. Seret pada denah 2D atau ruang 3D, sembunyikan, atau atur tinggi 100–220 cm. Panel furnitur membandingkan tinggi manusia dan produk. Denah dari atas menampilkan posisi/label tinggi; 3D memperlihatkan ukuran fisik.

Detail/Studio Fashion menawarkan Preview dipakai untuk kaos, hoodie, jaket dan celana bawaan. Produk terpilih membawa warna/artwork ke tubuh; garment netral melengkapi pakaian. Satu boundary loading memuat tubuh dan pakaian bersama.

## Kontrak dan sumber

RoomProject.person opsional berisi x/y/height dalam mm dan rotation dalam derajat. Data ikut draft, library, berbagi, JSON dan SVG tanpa migrasi SQL. Body CC0 dari MakeHuman community / Kasper Olesen memakai rest pose yang sama dengan garment. URL, lisensi dan hash tersedia pada [model-assets](model-assets.md) serta manifest.

## Batas

Pose statis untuk ilustrasi; belum ada animasi, simulasi kain, pengukuran tubuh pelanggan atau jaminan fit. Ukuran fashion belum mensimulasikan longgar/ketat saat dipakai. Topi, sepatu, tas dan GLB toko belum kompatibel. Posisi manusia harus di dalam polygon dan tinggi tidak boleh melewati dinding.

## Acceptance criteria dan verifikasi

Tinggi default 1700 mm bertahan saat reload/save/share/export. Manusia dan furnitur dapat diseret dalam kedua mode. Empat garment dapat beralih dipakai/produk tanpa error atau tampilan tubuh tanpa pakaian. Artwork terlihat dan draft bertahan. Domain/backend diuji dengan Bun; Playwright menguji drag, penyimpanan, empat garment, artwork dan viewport mobile. Jalankan pemeriksaan kualitas README.
