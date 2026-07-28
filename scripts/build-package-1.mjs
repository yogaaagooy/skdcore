import { writeFile } from "node:fs/promises";
import twk from "../content/paket-1/twk.mjs";
import tiu from "../content/paket-1/tiu.mjs";
import tkp from "../content/paket-1/tkp.mjs";
import { validateQuestionPackage } from "../src/utils/questionValidation.js";

const questions = [...twk, ...tiu, ...tkp];
const report = validateQuestionPackage(questions, "1");
if (!report.valid) throw new Error(report.errors.join("\n"));

await writeFile(new URL("../content/paket-1/paket-simulasi-1.json", import.meta.url), JSON.stringify({
  id: "simulasi_1",
  title: "Tryout 1",
  description: "Tryout NalarASN V2: 30 TWK, 35 TIU, dan 45 TKP.",
  version: 2,
  durationMinutes: 100,
  questions,
}, null, 2));

console.log(JSON.stringify({ total: questions.length, counts: report.counts, valid: report.valid }));
