import { auth } from "./firebase";

async function request(path, options = {}) {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Sesi login tidak ditemukan.");
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}`, ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Pengaturan tryout gagal diproses.");
  return data;
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
