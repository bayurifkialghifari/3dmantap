# Paket kerja produksi

## Perilaku

Worker database mengambil job dengan row lock dan lease, kemudian membuat ZIP untuk revisi disetujui. Paket memuat approved-design.json, manifest, production-sheet.pdf, daftar potong CSV untuk interior, artwork SVG/PNG 300 DPI/PDF skala asli serta sumber gambar. Paket hanya dapat diunduh pemilik pengajuan/admin. Job memiliki retry terbatas.

Daftar potong mencantumkan ID dan posisi panel; gambar perakitan berasal dari geometri panel yang sama dengan preview. Manifest menyertakan panel, permukaan cetak, aturan koordinat, dan posisi tile. Margin transparan dipotong; artwork besar dibagi menjadi tile maksimal 500 mm pada 300 DPI. Operator mencocokkan nama seperti door-0-1 dengan panel door-0 lalu menempatkannya mengikuti offset manifest. Cetak PDF pada ukuran aktual (100%), tanpa fit-to-page.

Lease kedaluwarsa diulang selama batas tiga percobaan belum tercapai; setelah itu job ditandai gagal. Jalankan API dan worker sebagai proses terpisah yang diawasi pada deployment.

## Kontrak dan data

POST /admin/inquiries/:id/production; GET /production/:id; GET /production/:id/:job/download

## Acceptance criteria

Paket terkait revisi disetujui; satu inci artwork berukuran 300 pixel dan PDF 72 point. Output merupakan paket kerja untuk review operator, bukan pola jahit, file bordir atau CNC otomatis.

## Verifikasi

Jalankan pemeriksaan kualitas README.md. Domain diuji dengan Bun; alur browser dan izin diuji melalui Playwright. Gunakan akun/token terpisah saat memeriksa akses privat.
