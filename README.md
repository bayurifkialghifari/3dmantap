# 3DMantap

Web + PWA untuk custom Fashion dan Interior, dengan preview produk 3D, room planner, dan CMS konsultasi sebelum produksi. Seluruh aplikasi memakai TypeScript, Bun, React/Vite, Hono, MySQL dan Drizzle.

## Jalankan lokal

Prasyarat: Bun 1.4+, Git, dan MySQL 8.4+. Pada Windows, setup mendeteksi mysqld dari PATH (termasuk FlyEnv), membuat database lokal terisolasi di .data/mysql, lalu menjalankannya pada 127.0.0.1:33307.

```sh
bun install
bun run setup
bun run db:migrate
bun run db:seed
bun run dev
```

Buka **http://localhost:5173**. API berjalan pada port 3001. Setup membuat .env dengan secret dan password acak; kredensial admin ada di **.data/bootstrap-admin.txt**. Masuk melalui /login, lalu buka /admin. File .env dan .data tidak dikomit.

Jika memakai MySQL sendiri atau Linux/macOS, jalankan setup untuk environment, lalu sesuaikan DATABASE_URL sebelum migrations. db:seed idempotent dan tidak menimpa template/pengaturan yang sudah diubah.

## Alur pelanggan dan pengelola

1. Pilih Fashion atau Interior, buka preview 3D, lalu custom ukuran/warna dan artwork.
2. Simpan snapshot di pustaka atau submit identitas dan kebutuhan. Draft editor tersimpan otomatis di perangkat.
3. Submit menyimpan pengajuan ke CMS dahulu. Pelanggan kemudian menekan link WhatsApp dan mengirim pesan sendiri.
4. Admin mencatat hasil konsultasi, memperbaiki spesifikasi bila perlu, dan menerbitkan penawaran final.
5. Pelanggan menyetujui revisi terbaru; transfer dan upload bukti. Admin memverifikasinya.
6. Backend baru mengizinkan produksi setelah seluruh syarat lengkap. Worker menyiapkan paket kerja ZIP.
7. Admin mencatat progres/foto dan penerimaan barang. Pengiriman/penyelesaian membutuhkan pelunasan.

Sebelum menerima pesanan nyata, atur WhatsApp, rekening, alamat, harga, tarif, dan template produksi di CMS. **13 template serta harga awal adalah contoh** yang harus divalidasi bisnis. Preview fashion/aksesori memakai GLB bersumber dengan lisensi tercatat; furnitur memakai komponen GLB kabinet yang dirakit mengikuti ukuran panel. GLB toko dapat menggantikan model default. Bentuk/pola produksi dan area cetak dikonfirmasi saat konsultasi; paket kerja tidak otomatis membuat pola jahit, file bordir, atau CNC.

## Room planner dan artwork

Room planner menyediakan denah polygon, sudut/dinding, partisi, pintu/jendela, penempatan furnitur dari katalog/pustaka, snapping, pengukuran dua titik, dan tampilan 2D/3D. Ruangan dapat disimpan, dibagikan sebagai salinan, dan diekspor PNG/SVG/JSON.

Artwork menggunakan mm relatif titik pusat area cetak. Preview 2D/3D dan ekspor memakai renderer SVG yang sama; teks diubah menjadi path dengan font Noto lokal. Kabinet menggunakan area panel pintu/laci nyata. Ekspor 300 DPI memotong margin transparan dan membagi artwork besar menjadi tile maksimal 500 mm; posisi tile, permukaan, dan revisi tercatat dalam manifest.

## Scripts dan pemeriksaan

```sh
bun run lint
bun run format:check
bun run typecheck
bun run docs:check
bun run test
bunx playwright install chromium
bun run test:e2e
bun run build
```

Tes integrasi menggunakan MySQL yang dikonfigurasi; browser tests menggunakan server lokal dan akun bootstrap. CI menjalankan checks dengan MySQL terisolasi. Screenshot/trace berada di .data, test-results dan playwright-report.

Verifikasi lokal 0.2.0 pada 11 November 2026: lint, format, typecheck, dokumentasi, 19 tes domain/backend/geometri, suite 6 tes browser, dan build lulus. Alur artwork/ruangan diulang setelah perbaikan proyeksi, termasuk pemeriksaan screenshot topi dan kabinet. Build diuji dengan service worker aktif: navigasi, draft, delapan GLB default, font Inter dan gambar studio tersedia offline; respons API tidak masuk cache. Syntax Compose valid; build/run container belum diuji karena engine Docker lokal belum aktif.

Perintah tambahan: bun run format, db:migrate, db:seed, start, dan worker. Untuk server produksi yang sudah dibangun, jalankan start dan worker sebagai dua proses yang diawasi supervisor.

Model runtime sudah dibundel. Untuk memperbaruinya, jalankan **bun run models:prepare** (download sumber dengan verifikasi SHA-256) lalu **bun run models:previews** saat aplikasi lokal berjalan. [Panduan model dan kredit](docs/model-assets.md) menjelaskan sumber, pengolahan, dan batas preview.

## Deployment

Dockerfile dan compose.yaml menyiapkan API/frontend, worker, dan MySQL 8.4 dengan volume persisten.

```sh
cp .env.production.example .env.production
# Isi domain HTTPS dan semua secret/password sendiri.
docker compose --env-file .env.production up -d --build
```

API dibind ke 127.0.0.1:3001; gunakan reverse proxy HTTPS dengan Host dan X-Forwarded-Proto yang benar. APP_URL harus sama dengan origin publik untuk cookie, pemeriksaan origin, dan link WhatsApp. Health endpoint /api/v1/health memeriksa koneksi database. Worker baru dimulai setelah migrations/seed/API siap.

Backup database dan volume uploads bersama. Pada lokal, backup database 3dmantap dan .data/uploads. Pada Compose, gunakan mysqldump melalui kredensial yang dikonfigurasi serta snapshot volume uploads; uji restore pada database/volume terpisah sebelum mengganti data aktif. Jangan menghapus volume melalui docker compose down -v jika data masih diperlukan.

## Dokumentasi dan aset

- [PRD](PRD.md), [arsitektur](architecture.md), [instruksi agent](AGENTS.md), [changelog](CHANGELOG.md).
- [Indeks 20 fitur](docs/README.md), [sumber GLB dan batas model](docs/model-assets.md).
- Font Inter, Manrope dan Noto dibundel dengan SIL Open Font License di public/fonts. Kredit GLB tersedia pada /models/credits.html. Thumbnail produk berasal dari viewer GLB aplikasi. Ikon PNG dapat diregenerasi dengan bun run apps/api/src/tools/icons.ts.

Preview sepatu mempertahankan proporsi GLB asli; thumbnail katalog dirender ulang setelah koreksi orientasi dan skala.
