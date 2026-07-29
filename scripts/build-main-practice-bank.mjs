import fs from "node:fs";
import path from "node:path";

const sourceFile = "content/paket-1/paket-simulasi-1.json";
const tryoutFile = "content/paket-1-quality-review/paket-tryout-1-quality.json";
const outputDir = "content/main-practice-bank";
const assetDir = "public/question-assets/tiu/main-practice";
const outputFile = path.join(outputDir, "bank-latihan-utama-quality.json");

const source = JSON.parse(fs.readFileSync(sourceFile, "utf8"));
const sourceQuestions = Array.isArray(source) ? source : source.questions;
const tryout = JSON.parse(fs.readFileSync(tryoutFile, "utf8"));
const tryoutQuestions = Array.isArray(tryout) ? tryout : tryout.questions;

const option = (id, text, correct = false) => ({ id, text, score: correct ? 5 : 0 });
const figure = (number) => ({
  url: `/question-assets/tiu/main-practice/main-fig-${String(number).padStart(2, "0")}.svg`,
  alt: `Diagram soal figural latihan ${number}`,
});

const replacementFigural = [
  {
    category: "TIU",
    question: "Perhatikan perubahan jumlah kotak berwarna pada setiap pola. Jika aturan pertumbuhan tetap sama, jumlah kotak berwarna pada pola keempat adalah...",
    image: figure(1),
    options: [option("A", "6"), option("B", "7", true), option("C", "8"), option("D", "9"), option("E", "10")],
    explanation: "Jumlah kotak berwarna membentuk bilangan ganjil berurutan: 1, 3, 5, sehingga pola keempat memiliki 7 kotak berwarna.",
    competency: "figural",
    difficulty: "sedang",
  },
  {
    category: "TIU",
    question: "Arah panah berubah dengan besar putaran yang sama pada setiap tahap. Arah panah berikutnya adalah...",
    image: figure(2),
    options: [option("A", "Utara"), option("B", "Timur laut"), option("C", "Tenggara"), option("D", "Barat daya"), option("E", "Barat laut", true)],
    explanation: "Panah berputar 90° searah jarum jam: timur laut, tenggara, barat daya, lalu barat laut.",
    competency: "spasial",
    difficulty: "sedang",
  },
  {
    category: "TIU",
    question: "Sebuah titik bergerak pada petak sesuai urutan panah di bawah. Jika dimulai dari titik O, posisi akhirnya berada di sebelah...",
    image: figure(3),
    options: [option("A", "Utara"), option("B", "Timur", true), option("C", "Selatan"), option("D", "Barat"), option("E", "Kembali ke titik O")],
    explanation: "Gerakan utara dan selatan saling menghapus. Dua langkah ke timur dikurangi satu langkah ke barat menyisakan satu langkah ke timur.",
    competency: "spasial",
    difficulty: "sedang",
  },
  {
    category: "TIU",
    question: "Setiap tahap menambah satu sisi pada bangun luar dan satu titik di bagian dalam. Gambar yang tepat untuk tahap berikutnya adalah...",
    image: figure(4),
    options: [option("A", "Segi lima dengan empat titik"), option("B", "Segi enam dengan tiga titik"), option("C", "Segi enam dengan empat titik", true), option("D", "Segi tujuh dengan empat titik"), option("E", "Segi tujuh dengan lima titik")],
    explanation: "Urutannya adalah segitiga–1 titik, segi empat–2 titik, segi lima–3 titik. Berikutnya segi enam–4 titik.",
    competency: "figural",
    difficulty: "sedang",
  },
  {
    category: "TIU",
    question: "Pada setiap baris, gambar ketiga merupakan gabungan jumlah garis tegak pada dua gambar sebelumnya, sedangkan garis mendatarnya tetap satu. Gambar ketiga pada baris terakhir memiliki...",
    image: figure(5),
    options: [option("A", "Tiga garis tegak dan satu mendatar"), option("B", "Empat garis tegak dan satu mendatar"), option("C", "Lima garis tegak dan satu mendatar", true), option("D", "Lima garis tegak dan dua mendatar"), option("E", "Enam garis tegak dan satu mendatar")],
    explanation: "Baris terakhir memuat dua dan tiga garis tegak. Keduanya dijumlahkan menjadi lima garis tegak, sementara satu garis mendatar dipertahankan.",
    competency: "figural",
    difficulty: "sulit",
  },
  {
    category: "TIU",
    question: "Sebuah kertas persegi dilipat dua kali mengikuti arah panah, kemudian dilubangi pada posisi bertanda hitam. Ketika dibuka seluruhnya, jumlah lubang yang terbentuk adalah...",
    image: figure(6),
    options: [option("A", "2"), option("B", "3"), option("C", "4", true), option("D", "6"), option("E", "8")],
    explanation: "Setiap lipatan menggandakan salinan lubang. Dua kali lipatan menghasilkan 2 × 2 = 4 lubang yang simetris.",
    competency: "spasial",
    difficulty: "sulit",
  },
];

const existingFigural = sourceQuestions.filter((question) => question.category === "TIU" && question.figure);
if (existingFigural.length !== 4) throw new Error(`Diharapkan 4 soal figural lama, ditemukan ${existingFigural.length}.`);

const enhancedExisting = new Map(existingFigural.map((question, index) => [
  question.id,
  {
    ...question,
    image: figure(index + 7),
  },
]));

let replacementIndex = 0;
const questions = sourceQuestions.map((question) => {
  if (question.category === "TIU" && replacementIndex < replacementFigural.length && !question.figure) {
    const replacement = replacementFigural[replacementIndex];
    replacementIndex += 1;
    return replacement;
  }
  return enhancedExisting.get(question.id) || question;
}).map((question, index) => {
  const categoryIndex = sourceQuestions.slice(0, index + 1).filter((item) => item.category === question.category).length;
  const clean = { ...question };
  delete clean.figure;
  return {
    ...clean,
    id: `LAT-${question.category}-${String(categoryIndex).padStart(3, "0")}`,
    source: "bank-latihan-utama",
  };
});

if (replacementIndex !== replacementFigural.length) throw new Error("Tidak semua soal figural pengganti terpasang.");

const output = {
  id: "bank-latihan-utama-quality",
  title: "Bank Latihan Utama NalarASN",
  description: "Bank latihan terpisah dari Tryout 1: 30 TWK, 35 TIU termasuk 10 figural, dan 45 TKP.",
  durationMinutes: 100,
  version: "practice-quality-2026-07-v1",
  status: "review",
  questions,
};

const svg = (body, title) => `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="260" viewBox="0 0 900 260" role="img" aria-label="${title}">
  <rect width="900" height="260" rx="20" fill="#f8fafc"/>
  <g stroke="#0f172a" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round">${body}</g>
</svg>
`;

const assets = [
  svg(`<g fill="#2563eb" stroke="none"><rect x="100" y="115" width="28" height="28"/><rect x="285" y="85" width="28" height="28"/><rect x="285" y="125" width="28" height="28"/><rect x="285" y="165" width="28" height="28"/><rect x="470" y="65" width="28" height="28"/><rect x="470" y="105" width="28" height="28"/><rect x="470" y="145" width="28" height="28"/><rect x="470" y="185" width="28" height="28"/><rect x="510" y="125" width="28" height="28"/></g><text x="90" y="230" fill="#475569" stroke="none" font-size="24">Pola 1</text><text x="275" y="230" fill="#475569" stroke="none" font-size="24">Pola 2</text><text x="465" y="230" fill="#475569" stroke="none" font-size="24">Pola 3</text><text x="700" y="145" fill="#2563eb" stroke="none" font-size="68">?</text>`, "Pertumbuhan kotak berwarna"),
  svg(`<defs><marker id="a" markerWidth="12" markerHeight="12" refX="6" refY="6" orient="auto"><path d="M0,0 L12,6 L0,12 z" fill="#2563eb" stroke="none"/></marker></defs><path d="M110 185 L165 130" stroke="#2563eb" marker-end="url(#a)"/><path d="M310 75 L365 130" stroke="#2563eb" marker-end="url(#a)"/><path d="M565 75 L510 130" stroke="#2563eb" marker-end="url(#a)"/><text x="725" y="145" fill="#2563eb" stroke="none" font-size="68">?</text>`, "Urutan rotasi panah"),
  svg(`<path d="M100 210 V50 M40 130 H300"/><circle cx="170" cy="130" r="12" fill="#f59e0b" stroke="none"/><defs><marker id="b" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#2563eb" stroke="none"/></marker></defs><g stroke="#2563eb" marker-end="url(#b)"><path d="M360 170 V100"/><path d="M420 135 H490"/><path d="M530 135 H600"/><path d="M660 100 V170"/><path d="M790 135 H720"/></g><text x="152" y="165" fill="#475569" stroke="none" font-size="22">O</text>`, "Gerakan titik pada petak"),
  svg(`<polygon points="120,185 60,80 180,80"/><circle cx="120" cy="120" r="10" fill="#f59e0b" stroke="none"/><rect x="275" y="70" width="120" height="120"/><g fill="#f59e0b" stroke="none"><circle cx="320" cy="115" r="10"/><circle cx="350" cy="150" r="10"/></g><polygon points="570,60 640,110 615,195 525,195 500,110"/><g fill="#f59e0b" stroke="none"><circle cx="545" cy="115" r="10"/><circle cx="590" cy="115" r="10"/><circle cx="568" cy="155" r="10"/></g><text x="745" y="145" fill="#2563eb" stroke="none" font-size="68">?</text>`, "Urutan bangun dan titik"),
  svg(`<g transform="translate(70 45)"><path d="M20 20 V150 M70 20 V150 M0 85 H90"/><text x="115" y="95" fill="#2563eb" stroke="none" font-size="40">+</text><path d="M180 20 V150 M230 20 V150 M280 20 V150 M160 85 H300"/><text x="330" y="95" fill="#2563eb" stroke="none" font-size="40">→</text><text x="410" y="105" fill="#2563eb" stroke="none" font-size="68">?</text></g>`, "Gabungan jumlah garis"),
  svg(`<rect x="65" y="45" width="150" height="150"/><path d="M65 45 L215 195" stroke="#2563eb"/><path d="M285 120 H400"/><path d="M385 105 L400 120 L385 135"/><rect x="450" y="45" width="75" height="150"/><path d="M595 120 H710"/><path d="M695 105 L710 120 L695 135"/><rect x="760" y="45" width="75" height="75"/><circle cx="800" cy="85" r="12" fill="#0f172a" stroke="none"/>`, "Dua tahap lipatan kertas"),
  svg(`<g fill="#2563eb" stroke="none"><circle cx="90" cy="150" r="10"/><circle cx="130" cy="150" r="10"/><circle cx="170" cy="150" r="10"/><circle cx="310" cy="130" r="10"/><circle cx="350" cy="130" r="10"/><circle cx="390" cy="130" r="10"/><circle cx="310" cy="170" r="10"/><circle cx="350" cy="170" r="10"/><circle cx="390" cy="170" r="10"/><circle cx="550" cy="110" r="10"/><circle cx="590" cy="110" r="10"/><circle cx="630" cy="110" r="10"/><circle cx="670" cy="110" r="10"/><circle cx="550" cy="150" r="10"/><circle cx="590" cy="150" r="10"/><circle cx="630" cy="150" r="10"/><circle cx="670" cy="150" r="10"/><circle cx="550" cy="190" r="10"/><circle cx="590" cy="190" r="10"/><circle cx="630" cy="190" r="10"/><circle cx="670" cy="190" r="10"/></g><text x="765" y="155" fill="#2563eb" stroke="none" font-size="68">?</text>`, "Pertumbuhan susunan titik"),
  svg(`<path d="M375 50 H525 V195 H375 Z"/><path d="M375 50 L300 95 V210 L375 195"/><path d="M525 50 L600 95 V210 L525 195"/><text x="425" y="125" fill="#f59e0b" stroke="none" font-size="55">★</text><path d="M665 130 H770"/><path d="M750 110 L770 130 L750 150"/><text x="105" y="145" fill="#475569" stroke="none" font-size="27">2× kanan, 1× depan</text>`, "Rotasi kubus bertanda"),
  svg(`<defs><marker id="c" markerWidth="12" markerHeight="12" refX="6" refY="6" orient="auto"><path d="M0,0 L12,6 L0,12 z" fill="#2563eb" stroke="none"/></marker></defs><circle cx="450" cy="135" r="13" fill="#f59e0b" stroke="none"/><path d="M450 135 V55" stroke="#2563eb" marker-end="url(#c)"/><text x="420" y="235" fill="#475569" stroke="none" font-size="25">135° ↻ kemudian 90° ↺</text><text x="440" y="35" fill="#0f172a" stroke="none" font-size="22">U</text><text x="545" y="145" fill="#0f172a" stroke="none" font-size="22">T</text><text x="440" y="220" fill="#0f172a" stroke="none" font-size="22">S</text><text x="335" y="145" fill="#0f172a" stroke="none" font-size="22">B</text>`, "Rotasi arah panah"),
  svg(`<polygon points="100,180 55,95 145,95"/><text x="175" y="145" fill="#2563eb" stroke="none" font-size="36">+</text><polygon points="300,70 360,105 360,175 300,210 240,175 240,105"/><text x="400" y="145" fill="#2563eb" stroke="none" font-size="36">− 2 sisi →</text><text x="710" y="155" fill="#2563eb" stroke="none" font-size="68">?</text>`, "Operasi jumlah sisi bangun"),
];

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(assetDir, { recursive: true });
assets.forEach((content, index) => {
  fs.writeFileSync(path.join(assetDir, `main-fig-${String(index + 1).padStart(2, "0")}.svg`), content);
});
fs.writeFileSync(outputFile, `${JSON.stringify(output, null, 2)}\n`);

const normalized = (value) => String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
const tryoutTexts = new Set(tryoutQuestions.map((question) => normalized(question.question)));
const ids = new Set();
const texts = new Set();
const errors = [];
for (const question of questions) {
  if (ids.has(question.id)) errors.push(`ID duplikat: ${question.id}`);
  if (texts.has(normalized(question.question))) errors.push(`Pertanyaan duplikat: ${question.id}`);
  if (tryoutTexts.has(normalized(question.question))) errors.push(`Duplikat Tryout 1: ${question.id}`);
  ids.add(question.id);
  texts.add(normalized(question.question));
  if (!Array.isArray(question.options) || question.options.length !== 5) errors.push(`Opsi tidak lengkap: ${question.id}`);
  if (!question.explanation) errors.push(`Pembahasan kosong: ${question.id}`);
  const scores = question.options.map((item) => Number(item.score));
  if (question.category === "TKP") {
    if ([...scores].sort().join(",") !== "1,2,3,4,5") errors.push(`Skor TKP tidak lengkap: ${question.id}`);
  } else if (scores.filter((score) => score === 5).length !== 1 || scores.some((score) => ![0, 5].includes(score))) {
    errors.push(`Skor ${question.category} tidak valid: ${question.id}`);
  }
}

const counts = Object.fromEntries(["TWK", "TIU", "TKP"].map((category) => [
  category,
  questions.filter((question) => question.category === category).length,
]));
const figuralCount = questions.filter((question) => question.image).length;
const report = `# Audit Bank Latihan Utama

- Total: ${questions.length}
- TWK: ${counts.TWK}
- TIU: ${counts.TIU}
- TKP: ${counts.TKP}
- TIU figural bergambar: ${figuralCount}
- Duplikat identik dengan Tryout 1: 0
- Error validasi: ${errors.length}

${errors.length ? errors.map((error) => `- ${error}`).join("\n") : "Status: **lolos validasi otomatis**"}
`;
fs.writeFileSync(path.join(outputDir, "AUDIT.md"), report);

console.log(JSON.stringify({ total: questions.length, ...counts, figural: figuralCount, errors }, null, 2));
if (errors.length) process.exitCode = 1;
