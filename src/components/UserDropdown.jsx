import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

export default function UserDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const name = user?.name || "User";
  const email = user?.email || "";

  return (
    <div className="relative" ref={ref}>
      {/* tombol utama dropdown */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        <span className="font-semibold">{name}</span>
        {email && (
          <span className="hidden sm:inline text-[11px] text-slate-500 dark:text-slate-400 max-w-[120px] truncate">
            {email}
          </span>
        )}
        <span className="text-[10px]">▾</span>
      </button>

      {/* isi dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-50 text-xs">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <div className="font-semibold text-slate-900 dark:text-slate-50">
              {name}
            </div>
            {email && (
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {email}
              </div>
            )}
          </div>

          <div className="py-1">
            <button
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
              onClick={() => {
                setOpen(false);
                navigate("/profile");
              }}
            >
              Edit Profil
            </button>

            <button
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
              onClick={() => {
                setOpen(false);
                navigate("/forgot-password");
              }}
            >
              Ubah Password
            </button>

            <button
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
              onClick={() => {
                setOpen(false);
                navigate("/kritik-saran");
              }}
            >
              Kritik & Saran
            </button>

            <button
              className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800"
              onClick={() => setOpen(false)}
            >
              <span>Mode tampilan</span>
              <ThemeToggle />
            </button>

            <button
              className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
