# Ukuran tubuh dan editor pose

## Penggunaan

Di Studio fashion yang kompatibel, buka tab Manusia. Di detail produk, buka Model, ukuran tubuh & pose. Di Room Planner, pilih manusia untuk membuka inspector.

Pilih laki-laki/perempuan, tinggi 100–220 cm dan berat 25–200 kg. Lingkar dada/pinggang/pinggul, lebar bahu, panjang bahu ke pergelangan tangan dan panjang kaki bagian dalam memiliki nilai otomatis dari model. Mengedit sebuah angka membuat override manual; Reset di samping angka mengembalikannya ke otomatis. Angka diterapkan saat blur/Enter. Reset tubuh mengembalikan model/ukuran default sambil mempertahankan pose.

Preset pose: berdiri santai, T-pose, tangan ke depan, tangan di pinggang dan duduk. Memilih preset mengganti semua rotasi sebelumnya. Pilih sendi dengan titik pada model atau dropdown; putar handle 3D lokal, slider X/Y/Z, atau angka. Kepala, torso, bahu, siku, pergelangan, pinggul, lutut dan pergelangan kaki memiliki batas rotasi. Reset pose mempertahankan ukuran tubuh.

Orbit berhenti selama handle diputar. Drag manusia di Room Planner dinonaktifkan selama sendi dipilih; kosongkan pilihan sendi untuk memindahkan orang lagi. Satu gesture handle/slider di Studio menjadi satu langkah history. Perubahan angka/preset menjadi satu langkah. Profil tidak menjadi daftar profil akun terpisah.

## Kalibrasi dan batas

models:prepare mempertahankan delapan morph gender/weight dan corrective yang sesuai, lalu menghasilkan avatar-calibration.json dari GLB sumber yang hash-nya terkunci. Kalibrasi mencatat cross-section torso, landmark rig, offset morph tulang dan preset relatif bind. Berat dipetakan ke koefisien bentuk; ini bukan kalkulasi medis atau model komposisi tubuh.

Renderer membake morph dan deformasi regional ke tubuh serta garment, memfit anchor skeleton, mempertahankan skin weights/UV, lalu menerapkan rotasi tulang. Lingkar menggunakan skala penampang regional; panjang lengan menggunakan bahu sebagai pivot. Tinggi kalibrasi selalu menggunakan pose referensi berdiri. Ukuran manual adalah target visual, bukan hasil pengukuran tubuh atau sertifikasi akurasi fitting; rasio yang ekstrem dibatasi untuk menjaga geometri finite.

Denah 2D memperlihatkan footprint/arah dan label tinggi berdiri, bukan elevasi. Pakaian tetap mengikuti tubuh saat duduk/bergerak; tidak ada collision/cloth simulation dan pose ekstrem dapat menyebabkan penetrasi kain/tubuh.

## Persistensi dan privasi

AvatarProfile menyimpan sex, height (mm), weight (gram), overrides (mm), preset dan rotasi lokal (derajat). Default ukuran yang belum diedit tetap otomatis; berat/tinggi tidak mengubah override lain. Optional fields kompatibel dengan JSON lama. Snapshot inquiry/CMS dan pustaka pemilik mempertahankan data penuh.

GET /library/share/:id, /library/rooms/share/:id dan /inquiries/preview/:id memproyeksikan AvatarRenderRecipe dan menghapus AvatarProfile, termasuk avatar desain di dalam item room. Recipe hanya berisi koefisien geometri/pose serta tinggi visual yang memang dibagikan. Bentuk tetap memperlihatkan proporsi; recipe bukan anonimisasi visual. Ukuran mentah dan berat tidak dikirim ke endpoint publik.

Salinan room dari link publik mempertahankan recipe. Tombol Buat profil sendiri memulai profil milik penerima; aplikasi tidak mengarang ukuran mentah pemilik asli. Account/visitor ownership dan token preview tetap berlaku.

## Acceptance criteria dan verifikasi

Kedua model, seluruh ukuran, preset/rotasi, reset terpisah, pose berkaki pada lantai, offline GLB, history Studio dan snapshot diuji. Bun memastikan schema lama tetap valid dan API publik tidak membocorkan raw measurements. Tes rig memakai seluruh lima GLB nyata dan memeriksa tinggi fisik independen dari parent viewer. E2E memastikan artwork draft tidak terhapus saat membawa profil dari detail produk.
