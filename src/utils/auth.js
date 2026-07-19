export const CURRENT_USER_KEY = "skdcore_current_user";

// Cache ini hanya menyimpan profil publik untuk kebutuhan UI. Password tidak pernah disimpan.
export function getCurrentUser() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.sessionStorage.getItem(CURRENT_USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (typeof window === "undefined") return;
  if (user) window.sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  else window.sessionStorage.removeItem(CURRENT_USER_KEY);
  window.dispatchEvent(new Event("skdcore-auth-change"));
}

export function clearLegacyAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("skdcore_current_user");
  window.localStorage.removeItem("skdcore_users");
}

// Kompatibilitas sementara sampai data pengguna/leaderboard dimigrasikan pada tahap berikutnya.
export function getUsers() {
  const current = getCurrentUser();
  return current ? [current] : [];
}

export function saveUsers() {}
