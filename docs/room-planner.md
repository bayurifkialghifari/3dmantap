# Room Planner 2D/3D

## Perilaku

Denah polygon dapat diubah dengan seret sudut dan tambah/hapus sudut. Mendukung dimensi, tinggi, partisi, bukaan pintu/jendela, warna lantai/dinding, template furnitur dan desain pustaka. Furnitur dapat dipindah, diputar, diduplikasi dan dihapus. Snap 5 cm; dimensi dinding tampil dalam cm.

Alat ukur menghitung jarak antara dua titik pada denah. Ruangan tersimpan dapat dibagikan melalui token publik; penerima membuka salinan sehingga tidak mengubah ruangan asal. Ekspor lokal tersedia sebagai PNG, SVG, dan JSON. Desain furnitur dari pustaka membawa artworknya ke preview ruangan.

## Kontrak dan data

RoomProject; GET/POST /library/rooms

## Acceptance criteria

Ruangan berpotongan atau bukaan di luar dinding ditolak. Furnitur tersimpan, mode 2D/3D, berbagi dan ekspor denah dapat dipakai.

## Verifikasi

Jalankan pemeriksaan kualitas README.md. Domain diuji dengan Bun; alur browser dan izin diuji melalui Playwright. Gunakan akun/token terpisah saat memeriksa akses privat.
