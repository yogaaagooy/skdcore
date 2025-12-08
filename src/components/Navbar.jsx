// src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth } from "../services/firebase";
import useRole from "../hooks/useRole";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, loading } = useRole();
  const user = auth.currentUser;

  const [openKelas, setOpenKelas] = useState(false);
  const [openAkun, setOpenAkun] = useState(false);

  // Tutup dropdown tiap ganti halaman
  useEffect(() => {
    setOpenKelas(false);
    setOpenAkun(false);
  }, [location.pathname]);

  async function handleLogout() {
    await auth.signOut();
    navigate("/login", { replace: true });
  }

  if (loading) return null;

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
    <header className="w-full bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Brand kiri */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
            S
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-gray-900">
              SKDku
            </span>
            <span className="text-[11px] text-gray-400">
              Simulasi SKD CPNS
            </span>
          </div>
        </Link>

        {/* Menu tengah */}
        <nav className="flex items-center gap-6 text-sm">
          {/* USER MENU */}
          {!isAdmin && (
            <>
              <Link
                to="/dashboard"
                className={
                  (isActive("/dashboard")
                    ? "text-blue-600 font-semibold"
                    : "text-gray-800") + " hover:text-blue-600"
                }
              >
                Dashboard
              </Link>

              <Link
                to="/leaderboard/skd-110"
                className={
                  (location.pathname.startsWith("/leaderboard")
                    ? "text-blue-600 font-semibold"
                    : "text-gray-800") + " hover:text-blue-600"
                }
              >
                Leaderboard
              </Link>

              {/* Dropdown Kelas */}
              <div className="relative">
                <button
                  onClick={() => setOpenKelas(!openKelas)}
                  className={
                    (isActive("/exams")
                      ? "text-blue-600 font-semibold"
                      : "text-gray-800") + " hover:text-blue-600 flex items-center gap-1"
                  }
                >
                  Kelas
                  <span className="text-[10px]">
                    {openKelas ? "▲" : "▼"}
                  </span>
                </button>

                {openKelas && (
                  <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-md border border-gray-200 py-1 z-50">
                    <Link
                      to="/exams"
                      className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-100"
                    >
                      Simulasi SKD
                    </Link>
                    <div className="block px-4 py-2 text-sm text-gray-500">
                      Bank Soal (coming soon)
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ADMIN MENU */}
          {isAdmin && (
            <>
              <Link
                to="/admin"
                className={
                  (location.pathname.startsWith("/admin")
                    ? "text-blue-600 font-semibold"
                    : "text-gray-800") + " hover:text-blue-600"
                }
              >
                Admin Dashboard
              </Link>

              <Link
                to="/admin/questions"
                className={
                  (location.pathname.startsWith("/admin/questions")
                    ? "text-blue-600 font-semibold"
                    : "text-gray-800") + " hover:text-blue-600"
                }
              >
                Bank Soal
              </Link>

              <Link
                to="/admin/import"
                className={
                  (location.pathname.startsWith("/admin/import")
                    ? "text-blue-600 font-semibold"
                    : "text-gray-800") + " hover:text-blue-600"
                }
              >
                Import Soal
              </Link>
            </>
          )}
        </nav>

        {/* Akun / avatar */}
        <div className="relative">
          <button
            onClick={() => setOpenAkun(!openAkun)}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
              {initial}
            </div>
            <span className="hidden sm:inline text-sm text-gray-800 max-w-[180px] truncate">
              {email}
            </span>
            <span className="text-[10px] text-gray-500">
              {openAkun ? "▲" : "▼"}
            </span>
          </button>

          {openAkun && (
            <div className="absolute right-0 mt-2 w-60 bg-white shadow-lg rounded-md border border-gray-200 py-1 z-50">
              <div className="px-4 py-2 text-xs text-gray-500">
                Masuk sebagai
              </div>
              <div className="px-4 pb-2 text-sm text-gray-900 border-b border-gray-100">
                {email}
              </div>

              <button
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
