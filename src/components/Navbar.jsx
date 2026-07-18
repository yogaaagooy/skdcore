import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { getCurrentUser, logout } from "../utils/auth";

const mainMenus = [
  { label: "Beranda", shortLabel: "Beranda", icon: "⌂", path: "/dashboard" },
  { label: "Simulasi", shortLabel: "Simulasi", icon: "▣", path: "/simulasi" },
  { label: "Hasil Saya", shortLabel: "Hasil", icon: "◷", path: "/hasil-simulasi" },
  { label: "Peringkat", shortLabel: "Peringkat", icon: "♛", path: "/leaderboard" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const user = getCurrentUser();
  const [profileOpen, setProfileOpen] = useState(false);
  const [dark, setDark] = useState(() => window.localStorage.getItem("skdcore_theme") === "dark");

  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    window.localStorage.setItem("skdcore_theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    function closeMenu(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  if (!user) return null;

  const isAdmin = user.role === "admin";
  const userName = user.name || user.email?.split("@")[0] || "Peserta";
  const initials = userName.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  function isActive(path) {
    if (path === "/dashboard") return location.pathname === path;
    if (path === "/simulasi") return location.pathname.startsWith("/simulasi");
    return location.pathname.startsWith(path);
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6">
          <Link to="/dashboard" className="flex shrink-0 items-center gap-2.5" aria-label="SKDCore Beranda">
            <img src={logo} alt="" className="h-9 w-9 rounded-xl object-contain" />
            <div className="leading-tight">
              <strong className="block text-base text-slate-900 dark:text-white">SKD<span className="text-blue-600">Core</span></strong>
              <small className="hidden text-[10px] text-slate-500 sm:block">Simulasi SKD CPNS</small>
            </div>
          </Link>

          <nav className="mx-auto hidden h-full items-center gap-1 md:flex" aria-label="Menu utama">
            {mainMenus.map((menu) => (
              <Link key={menu.path} to={menu.path} className={`relative flex h-full items-center gap-2 px-4 text-sm font-semibold transition ${isActive(menu.path) ? "text-blue-600 dark:text-blue-400" : "text-slate-600 hover:text-blue-600 dark:text-slate-300"}`}>
                <span className="text-base" aria-hidden="true">{menu.icon}</span>{menu.label}
                {isActive(menu.path) && <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-blue-600" />}
              </Link>
            ))}
            {isAdmin && <Link to="/admin" className={`relative flex h-full items-center gap-2 px-4 text-sm font-semibold ${isActive("/admin") ? "text-blue-600" : "text-slate-600 hover:text-blue-600 dark:text-slate-300"}`}><span>⚙</span>Admin{isActive("/admin") && <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-blue-600" />}</Link>}
          </nav>

          <div ref={menuRef} className="relative ml-auto">
            <button onClick={() => setProfileOpen((value) => !value)} className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800" aria-expanded={profileOpen} aria-label="Buka menu akun">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">{initials}</span>
              <span className="hidden max-w-32 text-left sm:block"><strong className="block truncate text-xs text-slate-800 dark:text-white">{userName}</strong><small className="block text-[10px] text-slate-500">{isAdmin ? "Administrator" : "Peserta"}</small></span>
              <span className="hidden text-xs text-slate-400 sm:block">⌄</span>
            </button>

            {profileOpen && <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800"><strong className="block truncate text-sm">{userName}</strong><small className="block truncate text-xs text-slate-500">{user.email}</small></div>
              <div className="p-1.5">
                <button onClick={() => navigate("/profile")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"><span>♙</span>Profil saya</button>
                <button onClick={() => navigate("/forgot-password")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"><span>⌑</span>Ubah kata sandi</button>
                {isAdmin && <button onClick={() => navigate("/admin")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 md:hidden"><span>⚙</span>Panel admin</button>}
                <button onClick={() => setDark((value) => !value)} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"><span className="flex items-center gap-3"><span>{dark ? "☀" : "☾"}</span>Mode tampilan</span><small className="text-slate-500">{dark ? "Terang" : "Gelap"}</small></button>
              </div>
              <div className="border-t border-slate-100 p-1.5 dark:border-slate-800"><button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"><span>↪</span>Keluar</button></div>
            </div>}
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-white/95 px-1 pb-[max(5px,env(safe-area-inset-bottom))] pt-1 shadow-[0_-8px_25px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 md:hidden" aria-label="Menu utama seluler">
        {mainMenus.map((menu) => <Link key={menu.path} to={menu.path} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold ${isActive(menu.path) ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`}><span className={`text-xl ${isActive(menu.path) ? "scale-110" : ""}`}>{menu.icon}</span>{menu.shortLabel}</Link>)}
      </nav>
      <div className="h-16 md:hidden" aria-hidden="true" />
    </>
  );
}
