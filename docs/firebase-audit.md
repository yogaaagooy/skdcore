# Audit Firebase SKDCore — Tahap 1

## Status saat audit

- Variabel konfigurasi Firebase tersedia dan terisi.
- Firebase Authentication dan Cloud Firestore sudah menjadi dependency proyek.
- Fitur aktif masih menggunakan autentikasi dan penyimpanan localStorage.
- Service Firebase lama belum terhubung ke route aplikasi aktif.
- Password pengguna dan kredensial admin default masih berada di alur localStorage.
- Firestore Security Rules, indeks, dan konfigurasi deployment belum tersedia.
- File `.env` sebelumnya belum dikecualikan secara eksplisit dari Git.
- Konfigurasi Firebase sebelumnya dicetak ke console browser.

## Perbaikan Tahap 1

- Melindungi `.env` dan seluruh variannya dari Git, kecuali `.env.example`.
- Menghapus debug konfigurasi Firebase dari console.
- Menambahkan validasi konfigurasi wajib saat aplikasi dimulai.
- Menambahkan konfigurasi Firebase CLI dan indeks kosong.
- Menambahkan Firestore Security Rules tertutup secara default.

## Risiko yang belum selesai

- Password localStorage masih harus dimigrasikan ke Firebase Authentication.
- Admin default harus dihapus setelah akun admin Firebase tersedia.
- Profil, soal, hasil, peringkat, dan manajemen pengguna belum memakai Firestore.
- Rules tertutup belum boleh diganti sebelum skema dan otorisasi tiap koleksi selesai.

## Gerbang Tahap 2

Tahap 2 membuat Firebase Authentication sebagai satu-satunya sumber autentikasi,
menyimpan profil tanpa password pada `users/{uid}`, dan menetapkan role admin
melalui dokumen yang dilindungi aturan keamanan.
