# Preview manusia dan pakaian

## Perilaku

Manusia pembanding Room Planner default laki-laki, 170 cm, 65 kg dan selalu memakai kaos/celana. Pilih model laki-laki/perempuan, atur tubuh dan pose, seret dalam denah 2D atau ruang 3D, putar arah, atau sembunyikan. Panel furnitur membandingkan tinggi anatomis dengan pintu/lemari.

Detail/Studio Fashion menawarkan Preview dipakai untuk kaos, hoodie, jaket dan celana bawaan. Warna dan artwork desain mengikuti garment yang dipakai; pakaian netral melengkapi tubuh dan jaket terbuka memakai kaos di bawahnya. Pilihan profil di detail produk dibawa ke Studio tanpa menghapus artwork draft yang sudah ada.

Tab Manusia memiliki ukuran tubuh dan editor pose. Tinggi/berat/ukuran disimpan bersama desain atau ruangan, termasuk cloud library dan snapshot CMS. Undo/redo Studio mencakup perubahan profil. Panduan lengkap: [ukuran tubuh dan pose](body-poses.md).

## Kontrak dan sumber

DesignDocument.avatar dan RoomProject.person.avatar opsional memakai AvatarProfile versi 1. UI cm/kg, JSON dimensi mm dan berat gram. Dokumen lama tanpa avatar tetap dibuka dengan model default, tanpa migrasi SQL. Person.height diselaraskan dengan tinggi profil saat simpan.

Body/garment CC0 dari MakeHuman community / Kasper Olesen memakai rig 53 tulang bersama. Delapan morph gender/berat/koreksi dipertahankan; koordinat, UV dan PBR sumber tetap menjadi dasar. Renderer membuat geometri dan skeleton milik instance, memfit tubuh/garment bersama, serta memasang pose relatif bind pose. Artwork garment dibake ke UV sehingga ikut morph dan skinning. URL, lisensi, modifikasi dan hash: [model-assets](model-assets.md).

## Batas

Preview adalah ilustrasi bentuk dan proporsi. Tidak membuat pola jahit, simulasi jatuh kain, prediksi longgar/ketat, avatar hasil scan, atau jaminan fit. Model ekstrem/manual dapat terlihat kurang alami. Topi, sepatu, tas dan GLB unggahan belum dipasangkan pada karakter; produk tersebut tetap memiliki preview produk mandiri. Tidak ada animasi.

## Acceptance criteria dan verifikasi

Tinggi dikalibrasi dalam pose berdiri dan kaki diletakkan pada lantai. Duduk mengurangi tinggi bounds visual tanpa menaikkan skala tubuh menjadi tinggi berdiri. Kamera memframe bounds posed. Kedua model dan empat garment menggunakan skeleton/deformasi yang sama; pose tidak memindahkan artwork dari kain. Data profil bertahan setelah reload dan perubahan dapat di-undo di Studio. Share desain/room/preview WhatsApp mengembalikan recipe visual, tanpa ukuran mentah.

Bun menguji rig GLB nyata, tinggi berdiri/duduk, perubahan transform parent, kontrak/persistensi dan izin API. Playwright menguji profil, pose, undo/redo, transfer detail ke Studio, kedua mode room, empat garment, artwork dan mobile. Jalankan pemeriksaan kualitas README.
