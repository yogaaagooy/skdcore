// src/components/Navbar.jsx
import logo from "../assets/logo.png";
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser, logout } from "../utils/auth";
import ThemeToggle from "./ThemeToggle";


export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const role = user?.role || "user";

  <div className="flex items-center gap-2">
      <img src ={logo.png} alt="SKDCore" className="h-8 w-auto" />
  </div>

  const [openAkun, setOpenAkun] = useState(false);

  // Tutup dropdown tiap ganti halaman
  useEffect(() => {
    setOpenAkun(false);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  if (!user) return null;

  const isAdmin = role === "admin";

  const email = user?.email || "-";
  const initial = email.charAt(0).toUpperCase();

  function isActive(path) {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  }

  return (
    <header className="w-full bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-40 border-b border-gray-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Brand kiri */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
            S
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-gray-900 dark:text-slate-50">
              SKDku
            </span>
            <span className="text-[11px] text-gray-500 dark:text-slate-400">
              Simulasi SKD CPNS
            </span>
          </div>
        </Link>

        {/* Menu tengah */}
        <nav className="flex items-center gap-6 text-sm">
          {/* DASHBOARD */}
          <Link
            to="/dashboard"
            className={
              (isActive("/dashboard")
                ? "text-blue-600 dark:text-blue-400 font-semibold"
                : "text-gray-800 dark:text-slate-200") + " hover:text-blue-600 dark:hover:text-blue-400"
            }
          >
            Dashboard
          </Link>

          {/* LEADERBOARD - UNTUK SEMUA USER */}
          <Link
            to="/leaderboard"
            className={
              (location.pathname.startsWith("/leaderboard")
                ? "text-blue-600 dark:text-blue-400 font-semibold"
                : "text-gray-800 dark:text-slate-200") + " hover:text-blue-600 dark:hover:text-blue-400"
            }
          >
            Leaderboard
          </Link>

          {/* ADMIN PANEL - HANYA UNTUK ADMIN */}
          {isAdmin && (
            <Link
              to="/admin"
              className={
                (location.pathname.startsWith("/admin")
                  ? "text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-gray-800 dark:text-slate-200") + " hover:text-blue-600 dark:hover:text-blue-400"
              }
            >
              Admin Panel
            </Link>
          )}
        </nav>

        {/* Akun / avatar */}
        <div className="relative">
          <button
            onClick={() => setOpenAkun(!openAkun)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
              {initial}
            </div>
            <span className="hidden sm:inline text-sm text-gray-800 dark:text-slate-200 max-w-[180px] truncate">
              {email}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-slate-400">
              {openAkun ? "▲" : "▼"}
            </span>
          </button>

          {openAkun && (
            <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 shadow-lg rounded-md border border-gray-200 dark:border-slate-700 py-1 z-50">
              <div className="px-4 py-2 text-xs text-gray-500 dark:text-slate-400">
                Masuk sebagai
              </div>
              <div className="px-4 pb-2 text-sm text-gray-900 dark:text-slate-50 border-b border-gray-100 dark:border-slate-800">
                {email}
              </div>

              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800"
                onClick={() => {
                  setOpenAkun(false);
                  navigate("/profile");
                }}
              >
                Edit Profil
              </button>

              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800"
                onClick={() => {
                  setOpenAkun(false);
                  navigate("/forgot-password");
                }}
              >
                Ubah Password
              </button>

              <div className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer">
                <span className="text-sm text-gray-800 dark:text-slate-200">Mode Tampilan</span>
                <ThemeToggle />
              </div>

              <button
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
