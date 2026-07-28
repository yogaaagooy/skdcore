import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { getCurrentUser } from "../utils/auth";

const feedbackCollection = collection(db, "feedback");

function normalize(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || "",
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || "",
  };
}

export async function createFeedback({ type, title, message, anonymous }) {
  const user = auth.currentUser;
  if (!user) throw new Error("Silakan login kembali untuk mengirim masukan.");
  const name = getCurrentUser()?.name || "";
  await addDoc(feedbackCollection, {
    userId: user.uid,
    type,
    title: title.trim(),
    message: message.trim(),
    anonymous: Boolean(anonymous),
    name: anonymous ? "" : name,
    email: anonymous ? "" : user.email || "",
    status: "new",
    reply: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function listMyFeedback() {
  const user = auth.currentUser;
  if (!user) throw new Error("Sesi login tidak ditemukan.");
  const snapshot = await getDocs(query(feedbackCollection, where("userId", "==", user.uid)));
  return snapshot.docs.map(normalize).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAllFeedback() {
  const snapshot = await getDocs(query(feedbackCollection, orderBy("createdAt", "desc")));
  return snapshot.docs.map(normalize);
}

export async function updateFeedback(id, { status, reply }) {
  await updateDoc(doc(db, "feedback", id), {
    status,
    reply: String(reply || "").trim(),
    updatedAt: serverTimestamp(),
  });
}
