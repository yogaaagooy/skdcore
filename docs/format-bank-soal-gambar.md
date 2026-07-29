# Format Bank Soal Bergambar NalarASN

Format ini bersifat **backward-compatible**. Soal teks lama tetap valid tanpa menambahkan field baru.

## Field gambar

Gambar pertanyaan menggunakan field `image`:

```json
{
  "url": "/question-assets/tiu/fig-001-question.svg",
  "alt": "Rangkaian tiga kotak dengan pola rotasi panah"
}
```

Setiap pilihan juga dapat memiliki `image`. Pilihan boleh:

- hanya memiliki `text`;
- hanya memiliki `image`; atau
- memiliki `text` dan `image`.

URL yang diterima:

- HTTPS, misalnya `https://...`;
- aset aplikasi dengan path yang diawali `/`, misalnya `/question-assets/tiu/...`; atau
- data image Base64 berformat PNG, JPEG, WebP, GIF, atau SVG.

Untuk penggunaan produksi, utamakan aset aplikasi atau Firebase Storage. Jangan memakai tautan situs yang dapat kedaluwarsa.

## Contoh soal figural lengkap

```json
{
  "id": "TIU-FIG-001",
  "category": "TIU",
  "question": "Gambar yang tepat untuk melanjutkan pola adalah...",
  "image": {
    "url": "/question-assets/examples/figural-question.svg",
    "alt": "Tiga panel pola: segitiga berputar searah jarum jam dan titik bertambah satu"
  },
  "options": [
    {
      "id": "A",
      "text": "",
      "image": {
        "url": "/question-assets/examples/figural-option-a.svg",
        "alt": "Segitiga mengarah ke kiri dengan empat titik"
      },
      "score": 0
    },
    {
      "id": "B",
      "text": "",
      "image": {
        "url": "/question-assets/examples/figural-option-b.svg",
        "alt": "Segitiga mengarah ke atas dengan empat titik"
      },
      "score": 5
    },
    {
      "id": "C",
      "text": "",
      "image": {
        "url": "/question-assets/examples/figural-option-c.svg",
        "alt": "Segitiga mengarah ke atas dengan tiga titik"
      },
      "score": 0
    },
    {
      "id": "D",
      "text": "",
      "image": {
        "url": "/question-assets/examples/figural-option-d.svg",
        "alt": "Segitiga mengarah ke kanan dengan empat titik"
      },
      "score": 0
    },
    {
      "id": "E",
      "text": "",
      "image": {
        "url": "/question-assets/examples/figural-option-e.svg",
        "alt": "Segitiga mengarah ke atas dengan lima titik"
      },
      "score": 0
    }
  ],
  "explanation": "Arah segitiga berputar 90 derajat searah jarum jam dan jumlah titik bertambah satu. Karena itu jawaban yang tepat adalah B."
}
```

## Ketentuan aset

- Gunakan SVG atau WebP agar tajam tetapi ringan.
- Setiap gambar wajib memiliki `alt` yang menjelaskan isi, bukan membocorkan jawaban.
- Gunakan rasio dan ketebalan garis yang konsisten pada seluruh opsi.
- Hindari perbedaan ukuran, posisi, atau kualitas yang tidak termasuk pola soal.
- Pastikan gambar tetap terbaca pada lebar layar sekitar 320 piksel.
- Jangan menyimpan kunci pada nama file, metadata, maupun teks alternatif.

## Kompatibilitas lama

Field `figure` lama tetap didukung untuk pola berbasis karakter/teks. Untuk soal figural produksi, gunakan `image` agar hasil tetap tajam dan konsisten pada desktop maupun HP.
