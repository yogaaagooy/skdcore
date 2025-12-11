# Panduan Import Soal JSON

Anda bisa mengimport soal ke SKDCore Simulasi melalui Admin Panel. Ada dua cara:

## 1. Import File JSON Lengkap (Semua Kategori)

1. Buka Admin Panel
2. Klik tombol **"Import JSON soal"**
3. Pilih file JSON dengan format:
```json
[
  {
    "id": 1,
    "category": "TWK",
    "question": "Pertanyaan?",
    "options": [
      {"id": "A", "text": "Opsi A", "score": 5},
      {"id": "B", "text": "Opsi B", "score": 0},
      ...
    ]
  }
]
```

## 2. Import JSON Per Mode Simulasi

1. Buka Admin Panel
2. Klik tombol **"📁 Import JSON per mode"**
3. Pilih mode: Semua, TWK, TIU, atau TKP
4. Upload file JSON
5. Sistem akan otomatis filter soal sesuai kategori yang dipilih

## 3. Input Manual 10 Soal

1. Buka Admin Panel
2. Klik tombol **"+ Input 10 soal manual"**
3. Isi form dengan data soal
4. Klik **"Simpan soal"**

## Format JSON Soal

### Untuk TWK dan TIU (Pilihan Tunggal)
```json
{
  "id": 1,
  "category": "TWK",
  "question": "Pertanyaan PKN?",
  "options": [
    {"id": "A", "text": "Jawaban A", "score": 5},
    {"id": "B", "text": "Jawaban B", "score": 0},
    {"id": "C", "text": "Jawaban C", "score": 0},
    {"id": "D", "text": "Jawaban D", "score": 0},
    {"id": "E", "text": "Jawaban E", "score": 0}
  ]
}
```

### Untuk TKP (Skala Nilai 1-5)
```json
{
  "id": 7,
  "category": "TKP",
  "question": "Situasi atau skenario?",
  "options": [
    {"id": "A", "text": "Respons A", "score": 1},
    {"id": "B", "text": "Respons B", "score": 3},
    {"id": "C", "text": "Respons C", "score": 5},
    {"id": "D", "text": "Respons D", "score": 4},
    {"id": "E", "text": "Respons E", "score": 2}
  ]
}
```

## Catatan Penting

- **Score untuk TWK/TIU**: Hanya satu opsi yang bernilai 5 (jawaban benar), sisanya 0
- **Score untuk TKP**: Range 1-5 sesuai tingkat kesesuaian respons
- **ID soal**: Harus unik, bisa angka atau string
- **Kategori**: Hanya "TWK", "TIU", atau "TKP" (case-sensitive)
- **Opsi**: Minimal 5 pilihan (A, B, C, D, E)

## File Contoh

Lihat `sample-questions.json` untuk contoh lengkap 10 soal (3 TWK, 3 TIU, 4 TKP).

---

**Pertanyaan?** Hubungi admin atau lihat dokumentasi di copilot-instructions.md
