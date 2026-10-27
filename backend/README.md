# FindIt Portal — Backend

Backend REST API Express + PostgreSQL untuk proyek PBL FindIt Portal. Revisi ini mempertahankan endpoint yang sudah ada dan memperketat validasi, autentikasi, CORS, penanganan transaksi, serta privasi data laporan.

## Sebelum mengganti folder lama

1. **Jangan menghapus `.env` lama sebelum mencadangkannya.** Arsip revisi ini sengaja tidak menyertakan `.env`, karena berisi rahasia koneksi database/JWT.
2. Simpan salinan folder backend lama.
3. Ekstrak file revisi, lalu salin nilai konfigurasi lokal dari `.env` lama ke `.env` baru. Pertahankan `DB_PORT` yang benar untuk PostgreSQL kamu; jika server lokal memakai port `55555`, gunakan `DB_PORT=55555`, bukan nilai contoh `5432`.
4. Pastikan `.env` tidak diunggah ke GitHub. Jika rahasia pernah ter-commit atau dibagikan, ganti password database dan JWT secret.

## Menjalankan

Persyaratan: Node.js 20+ dan PostgreSQL.

```bash
npm install
npm test
npm run test:db
npm start
```

Buka `http://localhost:5000/` untuk status API dan `http://localhost:5000/api/health` untuk cek database. Endpoint root hanya informasi API, bukan halaman frontend.

Buat `.env` berdasarkan `.env.example`. Hasilkan JWT secret lokal dengan:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Salin output ke `JWT_SECRET` di `.env`; jangan kirim secret ke chat atau commit ke Git.

## Database yang diharapkan

Kode ini mengandalkan tabel/kolom yang sudah digunakan backend sebelumnya:

- `users`: `id`, `nim`, `full_name`, `email`, `phone`, `password_hash`, `role`, `profile_photo`, `created_at`
- `reports`: `id`, `reporter_id`, `report_type`, `item_name`, `category`, `description`, `location`, `incident_date`, `characteristics`, `item_photo`, `status`, `admin_notes`, `published_at`, `created_at`, `updated_at`
- `report_witnesses`: `report_id`, `witness_name`, `witness_nim`, `witness_phone`
- `report_history`: `report_id`, `admin_id` (nullable untuk aksi mahasiswa), `action`, `details`
- `notifications`: `user_id`, `title`, `message`

Jalankan `npm run test:db` untuk memverifikasi koneksi. Koneksi sukses tidak menjamin semua tabel/kolom tersedia; coba alur aplikasi dan periksa error server bila ada. Jangan jalankan SQL migrasi yang tidak cocok dengan skema database aktual.

## Endpoint yang tersedia

| Method | Endpoint | Akses | Fungsi |
|---|---|---|---|
| GET | `/` | Publik | Informasi API |
| GET | `/api/health` | Publik | Cek database |
| POST | `/api/register` | Publik | Registrasi mahasiswa; role admin tidak bisa dipilih dari request |
| POST | `/api/login` | Publik | Login mahasiswa/admin |
| GET | `/api/me` | Login | Profil akun sendiri |
| GET | `/api/laporan` | Publik/login | Publik hanya melihat laporan terverifikasi/selesai; mahasiswa melihat laporan sendiri dan laporan publik; admin melihat semua plus data saksi |
| POST | `/api/laporan` | Mahasiswa | Buat laporan; identitas pelapor diambil dari token |
| PUT | `/api/laporan/:id` | Admin | Edit, verifikasi, tolak, minta perbaikan, atau selesaikan laporan |
| DELETE | `/api/laporan/:id` | Admin | Hapus laporan |

Token login dikirim pada header `Authorization: Bearer <token>`.

## Membuat akun admin

Endpoint registrasi publik sengaja selalu membuat role `mahasiswa`. Jangan menambahkan pilihan `role=admin` ke form registrasi. Untuk setup lokal satu kali, jalankan `node scripts/create-admin.js` dari terminal interaktif. Password dimasukkan tanpa ditampilkan di layar. Script akan meminta konfirmasi `YA`; jika NIM/ID sudah ada, akun itu akan dipromosikan menjadi admin dan password-nya diganti. Pastikan kamu benar-benar ingin mengubah akun tersebut sebelum mengonfirmasi. Jangan pernah membuka pembuatan admin sebagai endpoint publik.

## Catatan integrasi frontend

- API berjalan di port 5000 secara default.
- Frontend lokal umum (Live Server, Vite, localhost/127.0.0.1) diizinkan; tambahkan origin frontend lain ke `CORS_ORIGINS` sebagai daftar origin persis dipisahkan koma.
- Endpoint foto hanya menerima referensi URL HTTP(S) atau path relatif aman; backend ini tidak menyediakan upload file gambar.
- Untuk menjaga privasi, nama pelapor pada laporan publik disamarkan menjadi `Mahasiswa`. Admin tetap menerima data pelapor dan saksi.
- Notifikasi disimpan di database. Integrasi real-time/email/WhatsApp belum termasuk pada backend ini.
