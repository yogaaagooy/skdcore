import fs from "node:fs";
import path from "node:path";

const sources = [
  { batch: 1, file: "content/REVIEW-30-SOAL-BERKUALITAS-BATCH-1.md" },
  { batch: 2, file: "content/REVIEW-30-SOAL-BERKUALITAS-BATCH-2.md" },
  { batch: 3, file: "content/REVIEW-30-SOAL-BERKUALITAS-BATCH-3.md" },
];

const excludedTiu = new Set([
  "2-5", // Penjadwalan: pola sangat mirip dengan batch pertama.
  "2-6", // Silogisme: struktur berulang.
  "3-5", // Penjadwalan: struktur berulang.
  "3-6", // Silogisme: struktur berulang.
  "3-7", // Implikasi: struktur berulang.
]);

function compactQuestion(lines) {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.startsWith("- ") ? `• ${line.slice(2)}` : line)
    .join("\n");
}

function parseQuestions(markdown) {
  const questions = [];
  const pattern = /^### (TWK|TIU|TKP) (\d+)[^\n]*\n([\s\S]*?)(?=^### |^---$|^## )/gm;
  for (const match of markdown.matchAll(pattern)) {
    const [, category, rawNumber, body] = match;
    const lines = body.trim().split("\n");
    const optionStart = lines.findIndex((line) => /^A\. /.test(line.trim()));
    if (optionStart < 0) continue;
    const questionLines = lines.slice(0, optionStart);
    const optionLines = lines.slice(optionStart).filter((line) => /^[A-E]\. /.test(line.trim()));
    const options = optionLines.map((line) => {
      const clean = line.trim();
      return { id: clean[0], text: clean.slice(3).replace(/\s{2,}$/, ""), score: 0 };
    });
    questions.push({
      sourceNumber: Number(rawNumber),
      category,
      question: compactQuestion(questionLines),
      options,
    });
  }
  return questions;
}

function section(markdown, heading, nextHeading) {
  const start = markdown.indexOf(heading);
  if (start < 0) return "";
  const end = nextHeading ? markdown.indexOf(nextHeading, start + heading.length) : markdown.length;
  return markdown.slice(start, end < 0 ? markdown.length : end);
}

function parseSingleKeySection(text) {
  const keys = new Map();
  for (const line of text.split("\n")) {
    const match = line.match(/^(\d+)\.\s+\*\*([A-E])(?:\s+\([^)]+\))?\*\*\s+—\s+(.+)$/);
    if (match) keys.set(Number(match[1]), { correct: match[2], explanation: match[3].trim() });
  }
  return keys;
}

function parseTkpKeySection(text) {
  const keys = new Map();
  for (const line of text.split("\n")) {
    const match = line.match(/^(\d+)\.\s+\*\*A=(\d), B=(\d), C=(\d), D=(\d), E=(\d)\*\*\s+—\s+(.+)$/);
    if (!match) continue;
    keys.set(Number(match[1]), {
      scores: { A: Number(match[2]), B: Number(match[3]), C: Number(match[4]), D: Number(match[5]), E: Number(match[6]) },
      explanation: match[7].trim(),
    });
  }
  return keys;
}

function hydrateBatch(source) {
  const markdown = fs.readFileSync(source.file, "utf8");
  const parsed = parseQuestions(markdown);
  const twkKeys = parseSingleKeySection(section(markdown, "## D. Kunci dan Pembahasan TWK", "## E."));
  const tiuKeys = parseSingleKeySection(section(markdown, "## E. Kunci dan Pembahasan TIU", "## F."));
  const tkpKeys = parseTkpKeySection(section(markdown, "## F. Skor dan Pembahasan TKP", "## G."));

  return parsed.map((question) => {
    const key = question.category === "TWK"
      ? twkKeys.get(question.sourceNumber)
      : question.category === "TIU"
        ? tiuKeys.get(question.sourceNumber)
        : tkpKeys.get(question.sourceNumber);
    if (!key) throw new Error(`${source.file}: kunci ${question.category} ${question.sourceNumber} tidak ditemukan.`);
    const options = question.options.map((option) => ({
      ...option,
      score: question.category === "TKP" ? key.scores[option.id] : option.id === key.correct ? 5 : 0,
    }));
    return { ...question, batch: source.batch, options, explanation: key.explanation };
  });
}

function parseBatchFour() {
  const file = "content/REVIEW-15-TKP-BERKUALITAS-BATCH-4.md";
  const markdown = fs.readFileSync(file, "utf8");
  const questions = parseQuestions(markdown);
  const keys = parseTkpKeySection(section(markdown, "## B. Skor dan Pembahasan", "## C."));
  return questions.map((question) => {
    const key = keys.get(question.sourceNumber);
    if (!key) throw new Error(`${file}: kunci TKP ${question.sourceNumber} tidak ditemukan.`);
    return {
      ...question,
      batch: 4,
      options: question.options.map((option) => ({ ...option, score: key.scores[option.id] })),
      explanation: key.explanation,
    };
  });
}

const firstThree = sources.flatMap(hydrateBatch);
const twk = firstThree.filter((question) => question.category === "TWK");
const tiuTextAll = firstThree.filter((question) => question.category === "TIU");
const tiuText = tiuTextAll.filter((question) => !excludedTiu.has(`${question.batch}-${question.sourceNumber}`));
const tkp = [...firstThree.filter((question) => question.category === "TKP"), ...parseBatchFour()];
const tiuFigural = JSON.parse(fs.readFileSync("content/REVIEW-10-SOAL-FIGURAL-BATCH-1.json", "utf8"));

function clean(question) {
  const { batch, sourceNumber, ...rest } = question;
  return rest;
}

const finalTwk = twk.map((question, index) => ({ ...clean(question), id: `TWK-${String(index + 1).padStart(3, "0")}` }));
const finalTiuText = tiuText.map((question, index) => ({ ...clean(question), id: `TIU-TEKS-${String(index + 1).padStart(3, "0")}` }));
const finalTiuFigural = tiuFigural.map((question, index) => ({ ...question, id: `TIU-FIG-${String(index + 1).padStart(3, "0")}` }));
const finalTkp = tkp.map((question, index) => ({ ...clean(question), id: `TKP-${String(index + 1).padStart(3, "0")}` }));

const questions = [...finalTwk, ...finalTiuText, ...finalTiuFigural, ...finalTkp];
const output = {
  id: "tryout-1-quality-review",
  title: "Tryout 1 — Paket Berkualitas",
  description: "Paket review NalarASN: 30 TWK, 25 TIU teks, 10 TIU figural, dan 45 TKP.",
  durationMinutes: 100,
  version: "quality-2026-07-review",
  status: "review",
  questions,
};

const outDir = "content/paket-1-quality-review";
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "paket-tryout-1-quality.json"), `${JSON.stringify(output, null, 2)}\n`);

const excludedRows = [
  ["Batch 2 TIU 5", "Penjadwalan analitis", "Pola terlalu mirip dengan penjadwalan pada Batch 1"],
  ["Batch 2 TIU 6", "Silogisme", "Struktur penarikan kesimpulan berulang"],
  ["Batch 3 TIU 5", "Penjadwalan ruang", "Pola terlalu mirip dengan penjadwalan pada Batch 1"],
  ["Batch 3 TIU 6", "Penalaran kategoris", "Struktur penarikan kesimpulan berulang"],
  ["Batch 3 TIU 7", "Implikasi logis", "Struktur hampir sama dengan implikasi yang sudah dipilih"],
];

const report = `# Audit Kurasi Tryout 1 Berkualitas

Status: **paket uji lokal, belum masuk Firebase**

## Komposisi

| Bagian | Jumlah |
|---|---:|
| TWK | ${finalTwk.length} |
| TIU teks/numerik | ${finalTiuText.length} |
| TIU figural | ${finalTiuFigural.length} |
| TKP | ${finalTkp.length} |
| **Total** | **${questions.length}** |

## TIU teks yang dikeluarkan

| Sumber | Jenis | Alasan |
|---|---|---|
${excludedRows.map((row) => `| ${row.join(" | ")} |`).join("\n")}

Soal tidak dihapus dari dokumen sumber. Soal hanya tidak dimasukkan ke paket final agar variasi TIU lebih baik.

## Identitas paket

- ID: \`${output.id}\`
- Durasi: ${output.durationMinutes} menit
- Versi: \`${output.version}\`
- Status: \`${output.status}\`
`;

fs.writeFileSync(path.join(outDir, "AUDIT-KURASI.md"), report);
console.log(`Built ${questions.length} questions: TWK=${finalTwk.length}, TIU text=${finalTiuText.length}, TIU figural=${finalTiuFigural.length}, TKP=${finalTkp.length}`);
