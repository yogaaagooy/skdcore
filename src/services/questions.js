import { auth, db } from "./firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

export function getExamDocumentId(target = "main") {
  return target === "main" ? "bank_utama" : `simulasi_${Number(target)}`;
}

export async function getQuestionBank(target = "main") {
  const snapshot = await getDoc(doc(db, "exams", getExamDocumentId(target)));
  if (!snapshot.exists()) return [];
  const questions = snapshot.data().questions;
  return Array.isArray(questions) ? questions : [];
}

export async function saveQuestionBank(target, questions) {
  if (!auth.currentUser) throw new Error("Sesi admin sudah berakhir. Silakan login kembali.");
  const jsonSize = new Blob([JSON.stringify(questions)]).size;
  if (jsonSize > 900_000) throw new Error("Ukuran paket terlalu besar. Maksimal sekitar 900 KB per paket.");

  const id = getExamDocumentId(target);
  await setDoc(doc(db, "exams", id), {
    id,
    title: target === "main" ? "Bank Soal Utama" : `Paket Simulasi ${Number(target)}`,
    type: target === "main" ? "practice" : "simulation",
    packageNumber: target === "main" ? null : Number(target),
    durationMinutes: 100,
    questionCount: questions.length,
    questions,
    updatedAt: serverTimestamp(),
    updatedBy: auth.currentUser.uid,
  }, { merge: true });
  return questions.length;
}
