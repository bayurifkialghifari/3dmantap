# Stiker, teks, dan area cetak

## Perilaku

Layer teks atau gambar memiliki area, titik pusat X/Y, lebar/tinggi, rotasi, opacity dan urutan. Koordinat disimpan dalam mm relatif pusat permukaan. Canvas 2D dapat menyeret layer; panel menyediakan ukuran fisik, duplikat, urutan dan hapus. Gambar resolusi rendah memberi pemberitahuan.

Renderer SVG yang sama menghasilkan gambar 2D, tekstur 3D, dan hasil cetak. Teks memakai font Noto lokal yang diubah menjadi path agar tidak bergantung pada font mesin operator. Artwork topi diproyeksikan ke permukaan melengkung; artwork furnitur mengikuti mesh panel. Template GLB dapat menetapkan meshName untuk proyeksi.

## Kontrak dan data

Teks di-outline per glyph dengan kerning dan normalisasi Unicode NFC. Font awal ditujukan untuk teks Latin/Indonesia; ligature dan shaping aksara kompleks belum tersedia. Untuk bentuk huruf khusus, upload artwork SVG/PNG yang sudah disiapkan.

ArtworkLayer; surfacesFor; artworkBounds

## Acceptance criteria

Artwork berotasi yang keluar area ditolak backend. Upload privat hanya dipakai pemilik atau preview yang merujuk asset tersebut.

## Verifikasi

Jalankan pemeriksaan kualitas README.md. Domain diuji dengan Bun; alur browser dan izin diuji melalui Playwright. Gunakan akun/token terpisah saat memeriksa akses privat.
