
// src/components/LogoutButton.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";

export default function LogoutButton({ className = "" }) {
  const navigate = useNavigate();

  async function handleLogout() {
    const ok = window.confirm("Yakin mau logout?");
    if (!ok) return;

    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
      alert("Gagal logout, coba lagi.");
    }
  }

  return (
    <button
      onClick={handleLogout}
      className={
        className ||
        "px-3 py-1.5 bg-red-600 text-white rounded text-xs sm:text-sm hover:bg-red-500"
      }
    >
      Logout
    </button>
  );
}
