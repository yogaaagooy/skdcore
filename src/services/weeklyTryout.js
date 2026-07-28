import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

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
  return request("/api/weekly-tryout-settings");
}

export function saveWeeklyTryout(settings) {
  return request("/api/weekly-tryout-settings", { method: "POST", body: JSON.stringify(settings) });
}

export function verifyWeeklyTryoutCode(code) {
  return request("/api/verify-tryout-code", { method: "POST", body: JSON.stringify({ code }) });
}
