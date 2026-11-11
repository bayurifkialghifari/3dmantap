# Room Planner 2D/3D

## Perilaku

Denah polygon dapat diubah dengan seret sudut dan tambah/hapus sudut. Mendukung dimensi, tinggi, partisi, bukaan pintu/jendela, warna lantai/dinding, template furnitur dan desain pustaka. Furnitur dapat dipindah, diputar, diduplikasi dan dihapus. Snap 5 cm; dimensi dinding tampil dalam cm.

Alat ukur menghitung jarak antara dua titik pada denah. Ruangan tersimpan dapat dibagikan melalui token publik; penerima membuka salinan sehingga tidak mengubah ruangan asal. Ekspor lokal tersedia sebagai PNG, SVG, dan JSON. Desain furnitur dari pustaka membawa artworknya ke preview ruangan.

Furnitur 3D memakai GLB yang sama dengan detail/editor produk. Tampilan cutaway menyembunyikan dinding luar yang menghadap kamera saat orbit sehingga isi ruangan terlihat; ukuran/bukaan dinding tetap ada pada dokumen dan denah. Partisi tetap terlihat. Pusat preview mengikuti batas denah. Dinding/lantai adalah geometri ruang sederhana.

## Kontrak dan data

Tambah Pintu membuat produk dan bukaan terhubung melalui openingId. Seret dalam 2D/3D untuk memproyeksikan pintu ke celah dinding terdekat, menjepitnya ke batas sudut, dan menyelaraskan rotasinya. Panel Dinding pintu dapat memilih dinding lain; posisi sepanjang dinding memakai cm. Ukuran bukaan menjadi ukuran daun pintu. Perubahan dinding menyelaraskan kembali posisi; perubahan jumlah sudut memproyeksikan bukaan ke dinding baru. Duplikat membuat link baru; penghapusan menghapus pasangan item/bukaan. Backend menolak link salah, pintu tanpa dinding, produk non-interior dan bukaan bertumpuk.

Furnitur dan manusia dapat diseret langsung dalam kedua mode. Orbit berhenti selama drag 3D dan kembali aktif saat pointer dilepas. Snap 5 cm berlaku pada pusat objek; pusat harus berada di dalam polygon. Belum ada pemeriksaan tabrakan antar furnitur atau seluruh footprint. Pintu menempel pada dinding luar; partisi belum menerima pintu. Bukaan yang terlalu besar setelah perubahan ruang harus diperbaiki sebelum simpan.

Manusia default 170 cm selalu berpakaian. Bisa disembunyikan, diatur 100–220 cm, dipindah dan ikut simpan/bagikan/ekspor. Panel furnitur membandingkan tingginya dengan manusia. Denah 2D menampilkan posisi dari atas dan label tinggi; bukan tampak elevasi. [Panduan manusia](human-preview.md).

RoomProject; GET/POST /library/rooms

## Acceptance criteria

Ruangan berpotongan atau bukaan di luar dinding ditolak. Furnitur tersimpan, mode 2D/3D, berbagi dan ekspor denah dapat dipakai.

## Verifikasi

Jalankan pemeriksaan kualitas README.md. Domain diuji dengan Bun; alur browser dan izin diuji melalui Playwright. Gunakan akun/token terpisah saat memeriksa akses privat.
