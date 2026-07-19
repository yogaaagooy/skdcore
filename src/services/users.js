import { db } from "./firebase";
import { collection, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";

export async function listUsers() {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function setUserRole(userId, role) {
  if (!['user', 'admin'].includes(role)) throw new Error("Role tidak valid.");
  await updateDoc(doc(db, "users", userId), { role, updatedAt: serverTimestamp() });
}

export async function setUserStatus(userId, status) {
  if (!['active', 'disabled'].includes(status)) throw new Error("Status tidak valid.");
  await updateDoc(doc(db, "users", userId), { status, updatedAt: serverTimestamp() });
}
