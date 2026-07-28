import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const weeklySettingsRef = doc(db, "settings", "weeklyTryout");

async function waitForCurrentUser() {
  if (auth.currentUser) return auth.currentUser;
  return new Promise((resolve) => {
    let unsubscribe = () => {};
    const timeout = window.setTimeout(() => {
      unsubscribe();
      resolve(null);
    }, 5000);
    unsubscribe = onAuthStateChanged(auth, (user) => {
      window.clearTimeout(timeout);
      unsubscribe();
      resolve(user);
    });
  });
}

async function send(path, options, forceRefresh = false) {
  const user = await waitForCurrentUser();
  if (!user) throw new Error("Sesi login berakhir. Silakan login kembali.");
  const idToken = await user.getIdToken(forceRefresh);
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}`, ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function request(path, options = {}) {
  let result = await send(path, options);
  if (result.response.status === 401) result = await send(path, options, true);
  if (!result.response.ok) {
    const message = result.response.status === 401
      ? "Sesi login berakhir. Silakan login kembali."
      : result.data.message || "Pengaturan tryout gagal diproses.";
    throw new Error(message);
  }
  return result.data;
}

export function getWeeklyTryout() {
  return request("/api/weekly-tryout-settings")
    .then(async (data) => {
      try {
        const privateSnapshot = await getDoc(weeklySettingsRef);
        return privateSnapshot.exists() ? { ...data, ...privateSnapshot.data() } : data;
      } catch {
        return data;
      }
    })
    .catch(async (error) => {
      if (!error.message.toLowerCase().includes("sesi")) throw error;
      const response = await fetch("/api/weekly-tryout-settings");
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Pengaturan Tryout Nasional belum dapat dibaca.");
      try {
        const privateSnapshot = await getDoc(weeklySettingsRef);
        return privateSnapshot.exists() ? { ...data, ...privateSnapshot.data() } : data;
      } catch {
        return data;
      }
    });
}

export function saveWeeklyTryout(settings) {
  return request("/api/weekly-tryout-settings", { method: "POST", body: JSON.stringify(settings) })
    .catch(async (error) => {
      if (!error.message.toLowerCase().includes("sesi") && !error.message.toLowerCase().includes("verifikasi")) throw error;
      const payload = {
        enabled: settings.enabled === true,
        title: String(settings.title || "Tryout Nasional Mingguan").slice(0, 80),
        packageNumber: Number(settings.packageNumber || 1),
        startAt: String(settings.startAt || ""),
        endAt: String(settings.endAt || ""),
        socialUrl: String(settings.socialUrl || "").slice(0, 500),
        accessCode: String(settings.accessCode || "").trim().toUpperCase().slice(0, 30),
        eventId: `weekly-${String(settings.startAt || Date.now()).replace(/[^0-9]/g, "").slice(0, 14)}`,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.uid || "",
      };
      await setDoc(weeklySettingsRef, payload, { merge: true });
      return payload;
    });
}

export function verifyWeeklyTryoutCode(code) {
  return request("/api/verify-tryout-code", { method: "POST", body: JSON.stringify({ code }) });
}
