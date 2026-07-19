import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

export async function getUserProfile(uid) {
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function createUser({ name, email, password, instansi }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const profile = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    instansi: instansi.trim(),
    role: "user",
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, "users", credential.user.uid), profile);
  return { id: credential.user.uid, ...profile };
}

export async function signIn(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const profile = await getUserProfile(credential.user.uid);
  if (!profile) {
    await signOut(auth);
    throw new Error("Profil akun belum tersedia di database. Hubungi admin.");
  }
  return profile;
}

export async function updateProfile(uid, values) {
  await updateDoc(doc(db, "users", uid), {
    name: values.name.trim(),
    instansi: values.instansi.trim(),
    updatedAt: serverTimestamp(),
  });
  return getUserProfile(uid);
}

export function observeAuth(callback) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) return callback(null);
    try {
      const profile = await getUserProfile(firebaseUser.uid);
      if (profile?.status === "disabled") {
        await signOut(auth);
        callback(null);
        return;
      }
      callback(profile);
    } catch {
      callback(null);
    }
  });
}

export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email.trim());
}

export function logout() {
  return signOut(auth);
}
