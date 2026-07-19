const EXPECTED_COUNTS = { TWK: 30, TIU: 35, TKP: 45 };

function normalizedText(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

export function validateQuestionPackage(questions, target = "main") {
  const errors = [];
  const warnings = [];
  const counts = { TWK: 0, TIU: 0, TKP: 0 };
  const ids = new Set();
  const texts = new Set();

  questions.forEach((question, index) => {
    const label = `Soal ${index + 1}`;
    counts[question.category] = (counts[question.category] || 0) + 1;
    if (ids.has(String(question.id))) errors.push(`${label}: ID duplikat (${question.id}).`);
    ids.add(String(question.id));
    const text = normalizedText(question.question);
    if (texts.has(text)) errors.push(`${label}: pertanyaan duplikat.`);
    texts.add(text);
    if (!question.explanation || normalizedText(question.explanation).length < 30) errors.push(`${label}: pembahasan wajib dan minimal 30 karakter.`);
    if (!Array.isArray(question.options) || question.options.some((option) => !normalizedText(option.text))) errors.push(`${label}: semua pilihan A–E wajib berisi teks.`);

    const scores = (question.options || []).map((option) => Number(option.score));
    if (["TWK", "TIU"].includes(question.category)) {
      if (scores.filter((score) => score === 5).length !== 1 || scores.some((score) => ![0, 5].includes(score))) errors.push(`${label}: ${question.category} harus memiliki tepat satu jawaban skor 5 dan lainnya 0.`);
    }
    if (question.category === "TKP") {
      const sorted = [...scores].sort((a, b) => a - b);
      if (sorted.join(",") !== "1,2,3,4,5") errors.push(`${label}: skor TKP harus menggunakan 1, 2, 3, 4, dan 5 masing-masing sekali.`);
    }
  });

  if (target !== "main") {
    Object.entries(EXPECTED_COUNTS).forEach(([category, expected]) => {
      if (counts[category] !== expected) errors.push(`Paket lengkap wajib berisi ${expected} soal ${category}; ditemukan ${counts[category]}.`);
    });
    if (questions.length !== 110) errors.push(`Paket lengkap wajib tepat 110 soal; ditemukan ${questions.length}.`);
  } else if (questions.length < 3) {
    warnings.push("Bank utama sebaiknya memiliki soal dari ketiga bidang.");
  }

  return { valid: errors.length === 0, errors, warnings, counts };
}
