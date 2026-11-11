# Pustaka dan berbagi

## Perilaku

Desain server tersimpan dengan pemilik akun atau token perangkat; draft lokal terpisah. Pustaka menyediakan edit, duplikat, hapus, berbagi hanya-lihat, dan pencabutan link. Tautan pengajuan privat terpisah dari preview publik.

## Kontrak dan data

Profil tubuh lengkap tersimpan untuk pemilik desain/ruangan. Share desain, share room (termasuk avatar pada item desain) dan preview WhatsApp menghapus AvatarProfile lalu mengirim AvatarRenderRecipe. Berat serta lingkar/panjang mentah tidak berada dalam respons publik. Recipe mempertahankan bentuk/pose sehingga proporsi visual tetap dapat terlihat. Salinan room publik menyimpan recipe sampai penerima membuat profil sendiri; [kontrak profil dan pose](body-poses.md).

/library/designs; /library/share/:id; /library/rooms/share/:id

## Acceptance criteria

Link preview tidak membuka nomor telepon, pembayaran atau paket produksi; cabut link membuat tautan lama tidak tersedia.

## Verifikasi

Jalankan pemeriksaan kualitas README.md. Domain diuji dengan Bun; alur browser dan izin diuji melalui Playwright. Gunakan akun/token terpisah saat memeriksa akses privat.
