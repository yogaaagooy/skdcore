import { getImageData, isAllowedImageUrl } from "../components/QuestionMedia";

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
    const imageIdentity = getImageData(question.image || question.imageUrl)?.url || normalizedText(question.figure);
    const contentIdentity = `${text}|${imageIdentity}`;
    if (texts.has(contentIdentity)) errors.push(`${label}: pertanyaan dan media duplikat.`);
    texts.add(contentIdentity);
    if (!question.explanation || normalizedText(question.explanation).length < 30) errors.push(`${label}: pembahasan wajib dan minimal 30 karakter.`);
    const questionImage = question.image || question.imageUrl;
    if (questionImage && !isAllowedImageUrl(questionImage)) errors.push(`${label}: URL gambar pertanyaan tidak valid. Gunakan HTTPS, path /public, atau data image.`);
    if (questionImage && typeof questionImage === "object" && !normalizedText(questionImage.alt)) warnings.push(`${label}: gambar pertanyaan sebaiknya memiliki teks alternatif.`);
    if (!Array.isArray(question.options) || question.options.some((option) => !normalizedText(option.text) && !getImageData(option.image || option.imageUrl))) {
      errors.push(`${label}: setiap pilihan A–E wajib memiliki teks atau gambar.`);
    }
    (question.options || []).forEach((option) => {
      const optionImage = option.image || option.imageUrl;
      if (optionImage && !isAllowedImageUrl(optionImage)) errors.push(`${label} opsi ${option.id}: URL gambar tidak valid.`);
      if (optionImage && typeof optionImage === "object" && !normalizedText(optionImage.alt)) warnings.push(`${label} opsi ${option.id}: gambar sebaiknya memiliki teks alternatif.`);
    });

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
