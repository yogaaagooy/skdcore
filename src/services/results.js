import { auth, db } from "./firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

function requireUser() {
  if (!auth.currentUser) throw new Error("Sesi login berakhir. Silakan login kembali.");
  return auth.currentUser;
}

export async function saveAttempt({ mode, packageNumber, scores, answers, answeredCount, questionCount, autoFinished }) {
  const user = requireUser();
  const total = Number(scores.TWK || 0) + Number(scores.TIU || 0) + Number(scores.TKP || 0);
  const payload = {
    userId: user.uid,
    mode,
    packageNumber: packageNumber || null,
    scores: { TWK: Number(scores.TWK || 0), TIU: Number(scores.TIU || 0), TKP: Number(scores.TKP || 0) },
    total,
    answers,
    answeredCount,
    questionCount,
    autoFinished: Boolean(autoFinished),
    completedAt: serverTimestamp(),
  };
  const attemptRef = await addDoc(collection(db, "users", user.uid, "attempts"), payload);

  if (packageNumber && mode === "all") {
    const profile = await getDoc(doc(db, "users", user.uid));
    const leaderboardRef = doc(db, "leaderboard", `simulasi_${packageNumber}`, "results", user.uid);
    await runTransaction(db, async (transaction) => {
      const previous = await transaction.get(leaderboardRef);
      if (previous.exists() && Number(previous.data().total || 0) >= total) return;
      transaction.set(leaderboardRef, {
        userId: user.uid,
        name: profile.data()?.name || user.email?.split("@")[0] || "Peserta",
        packageNumber: Number(packageNumber),
        scores: payload.scores,
        total,
        attemptId: attemptRef.id,
        updatedAt: serverTimestamp(),
      });
    });
  }
  return { id: attemptRef.id, ...payload, completedAt: new Date() };
}

export async function getMyAttempts() {
  const user = requireUser();
  const snapshot = await getDocs(query(collection(db, "users", user.uid, "attempts"), orderBy("completedAt", "desc")));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function getLatestAttempt() {
  const user = requireUser();
  const snapshot = await getDocs(query(collection(db, "users", user.uid, "attempts"), orderBy("completedAt", "desc"), limit(1)));
  if (snapshot.empty) return null;
  const item = snapshot.docs[0];
  return { id: item.id, ...item.data() };
}

export async function getAttemptCount(mode, packageNumber = null) {
  const attempts = await getMyAttempts();
  return attempts.filter((item) => item.mode === mode && Number(item.packageNumber || 0) === Number(packageNumber || 0)).length;
}

export async function getPackageLeaderboard(packageNumber) {
  const snapshot = await getDocs(query(
    collection(db, "leaderboard", `simulasi_${Number(packageNumber)}`, "results"),
    orderBy("total", "desc"),
    limit(100)
  ));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}
