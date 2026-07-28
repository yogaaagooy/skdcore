import { auth } from "./firebase";

async function requestSettings(options = {}) {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Sesi login tidak ditemukan.");

  const response = await fetch("/api/premium-settings", {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${idToken}`,
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Pengaturan premium gagal diproses.");
  return data;
}

export async function getPremiumSettings() {
  return requestSettings();
}

export async function setPremiumEnabled(enabled) {
  return requestSettings({
    method: "POST",
    body: JSON.stringify({ enabled: enabled === true }),
  });
}
