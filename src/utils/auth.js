// src/utils/auth.js
export const USERS_KEY = "skdcore_users";
export const CURRENT_USER_KEY = "skdcore_current_user";

export function getUsers() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveUsers(users) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function logout() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CURRENT_USER_KEY);
}

// Register user biasa
export function registerUser({ name, email, password, role = "user" }) {
  const users = getUsers();
  const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    throw new Error("Email sudah terdaftar.");
  }
  const user = {
    id: Date.now(),
    name,
    email,
    password,
    role,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  setCurrentUser({ id: user.id, name: user.name, email: user.email, role: user.role });
  return user;
}

// Login (user biasa + admin default)
export function loginUser({ email, password }) {
  const emailTrim = email.trim();
  const passTrim = password.trim();

  // 1) Admin default – SELALU BISA
  if (emailTrim === "admin@skdcore.local" && passTrim === "admin123") {
    const adminUser = {
      id: 1,
      name: "Admin SKDCore",
      email: emailTrim,
      role: "admin",
    };

    // Pastikan admin juga ikut tercatat di list users
    const users = getUsers();
    const exists = users.find((u) => u.email.toLowerCase() === emailTrim.toLowerCase());
    if (!exists) {
      users.push({
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        password: passTrim,
        role: "admin",
        createdAt: new Date().toISOString(),
      });
      saveUsers(users);
    }

    setCurrentUser(adminUser);
    return adminUser;
  }

  // 2) User biasa dari localStorage
  const users = getUsers();
  const found = users.find(
    (u) =>
      u.email.toLowerCase() === emailTrim.toLowerCase() &&
      u.password === passTrim
  );

  if (!found) {
    throw new Error("Email atau password salah.");
  }

  const current = {
    id: found.id,
    name: found.name,
    email: found.email,
    role: found.role,
  };
  setCurrentUser(current);
  return current;
}
