import twk from "../content/paket-1/twk.mjs";
import tiu from "../content/paket-1/tiu.mjs";
import tkp from "../content/paket-1/tkp.mjs";

const questions = [...twk, ...tiu, ...tkp];
const errors = [];
const normalize = (value) => String(value || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const questionTexts = new Map();

for (const question of questions) {
  const text = normalize(question.question);
  if (questionTexts.has(text)) errors.push(`${question.id}: sama dengan ${questionTexts.get(text)}`);
  questionTexts.set(text, question.id);
  if (new Set(question.options.map((option) => normalize(option.text))).size !== 5) {
    errors.push(`${question.id}: memiliki pilihan jawaban duplikat.`);
  }
  if (!["mudah", "sedang", "sulit"].includes(question.difficulty)) {
    errors.push(`${question.id}: tingkat kesulitan belum valid.`);
  }
  if (question.category === "TWK" && !question.source) errors.push(`${question.id}: sumber TWK kosong.`);
}

const summary = Object.fromEntries(["TWK", "TIU", "TKP"].map((category) => {
  const group = questions.filter((question) => question.category === category);
  return [category, {
    total: group.length,
    difficulty: Object.fromEntries(["mudah", "sedang", "sulit"].map((level) => [
      level,
      group.filter((question) => question.difficulty === level).length,
    ])),
    bestPositions: Object.fromEntries("ABCDE".split("").map((letter, index) => [
      letter,
      group.filter((question) => question.options[index]?.score === 5).length,
    ])),
  }];
}));

console.log(JSON.stringify({ valid: errors.length === 0, errors, summary }, null, 2));
if (errors.length) process.exitCode = 1;
