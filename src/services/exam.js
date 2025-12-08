// src/services/exam.js
import { auth, db } from "./firebase";
import {
  doc,
  setDoc,
  collection,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

// ====== SIMPAN HASIL UJIAN USER + LEADERBOARD ======
export async function saveExamResult(examId, score, answers) {
  const user = auth.currentUser;
  if (!user) {
    console.error("saveExamResult dipanggil tanpa user login");
    return false;
  }

  const uid = user.uid;
  const displayName = user.displayName || user.email || "User";

  const now = new Date();

  // score bisa number (lama) atau object (baru)
  const totalScore =
    score && typeof score === "object" ? score.total ?? 0 : score ?? 0;

  // 1) Simpan di riwayat user
  const ref = doc(db, "users", uid, "examResults", examId);

  await setDoc(ref, {
    examId,
    score, // bisa number / object
    answers,
    totalScore,
    createdAt: now,
  });

  // 2) Simpan di leaderboard
  const lbRef = doc(db, "leaderboard", examId, "results", uid);

  await setDoc(lbRef, {
    userId: uid,
    displayName,
    examId,
    score,
    totalScore,
    createdAt: now,
  });

  return true;
}

// ====== AMBIL RIWAYAT UJIAN USER (UNTUK DASHBOARD) ======
export async function getExamResults() {
  const user = auth.currentUser;
  if (!user) {
    console.error("getExamResults dipanggil tanpa user login");
    return [];
  }

  const uid = user.uid;

  const q = query(
    collection(db, "users", uid, "examResults"),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  return snap.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      examId: data.examId,
      score: data.score,
      totalScore: data.totalScore,
      createdAt: data.createdAt
        ? data.createdAt.toDate
          ? data.createdAt.toDate()
          : new Date(data.createdAt)
        : null,
    };
  });
}

// ====== AMBIL LIST UJIAN (HALAMAN /exams) ======
export async function getExams() {
  const snap = await getDocs(collection(db, "exams"));

  return snap.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      title: data.title,
      description: data.description,
      durationMinutes: data.durationMinutes,
    };
  });
}

// ====== AMBIL SATU UJIAN BERDASARKAN ID (HALAMAN /exam/:id) ======
export async function getExamById(examId) {
  if (!examId) {
    console.error("getExamById dipanggil tanpa examId");
    return null;
  }

  const ref = doc(db, "exams", examId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    id: snap.id,
    title: data.title,
    description: data.description,
    durationMinutes: data.durationMinutes,
    questions: data.questions || [],
  };
}

// ====== AMBIL LEADERBOARD UNTUK SATU UJIAN ======
export async function getLeaderboard(examId) {
  if (!examId) return [];

  const q = query(
    collection(db, "leaderboard", examId, "results"),
    orderBy("totalScore", "desc"),
    limit(100)
  );

  const snap = await getDocs(q);

  return snap.docs.map((docSnap, index) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      rank: index + 1,
      userId: data.userId,
      displayName: data.displayName,
      examId: data.examId,
      score: data.score,
      totalScore: data.totalScore,
      createdAt: data.createdAt
        ? data.createdAt.toDate
          ? data.createdAt.toDate()
          : new Date(data.createdAt)
        : null,
    };
  });
}
