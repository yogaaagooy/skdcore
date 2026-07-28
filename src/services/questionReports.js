import { auth } from "./firebase";

async function request(options = {}) {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Sesi login tidak ditemukan.");
  const response = await fetch("/api/question-reports", {
    ...options,
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}`, ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Laporan soal gagal diproses.");
  return data;
}

export function reportQuestion(question, reason) {
  return request({ method: "POST", body: JSON.stringify({ questionId: question.id, category: question.category, question: question.question, reason }) });
}

export async function listQuestionReports() {
  const data = await request();
  return data.reports || [];
}
