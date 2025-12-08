// src/services/auth.js
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

// REGISTER USER BARU
export async function createUser(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // simpan profil user ke Firestore
  await setDoc(doc(db, "users", cred.user.uid), {
    email,
    createdAt: new Date(),
  });

  return cred.user;
}

// LOGIN
export async function signIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

// LOGOUT
export async function logout() {
  await signOut(auth);
}
