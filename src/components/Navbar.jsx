import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { getCurrentUser, setCurrentUser } from "../utils/auth";
import { logout } from "../services/auth";

const mainMenus = [
  { label: "Beranda", shortLabel: "Beranda", icon: "⌂", path: "/dashboard" },
  { label: "Latihan", shortLabel: "Latihan", icon: "▤", path: "/latihan" },
  { label: "Tryout", shortLabel: "Tryout", icon: "▣", path: "/tryout" },
  { label: "Hasil", shortLabel: "Hasil", icon: "◷", path: "/hasil-simulasi" },
  { label: "Peringkat", shortLabel: "Rank", icon: "♛", path: "/leaderboard" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const user = getCurrentUser();
  const [profileOpen, setProfileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => window.localStorage.getItem("nalarasn_sidebar") === "collapsed");
  const [dark, setDark] = useState(() => window.localStorage.getItem("skdcore_theme") === "dark");

  useEffect(() => setProfileOpen(false), [location.pathname]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    window.localStorage.setItem("skdcore_theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    document.documentElement.style.setProperty("--app-sidebar-width", collapsed ? "5.5rem" : "15.5rem");
    window.localStorage.setItem("nalarasn_sidebar", collapsed ? "collapsed" : "open");
  }, [collapsed]);

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
    if (path === "/latihan") return location.pathname === path || /^\/simulasi\/(twk|tiu|tkp|all)$/.test(location.pathname);
    if (path === "/tryout") return location.pathname === path || location.pathname.startsWith("/simulasi/sim/");
    return location.pathname.startsWith(path);
  }

  async function handleLogout() {
    await logout();
    setCurrentUser(null);
    navigate("/login", { replace: true });
  }

  const accountMenu = <div ref={menuRef} className="relative">
    <button onClick={() => setProfileOpen((value) => !value)} className={`flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800 ${collapsed ? "justify-center" : ""}`} aria-expanded={profileOpen}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">{initials}</span>
      {!collapsed && <span className="min-w-0 flex-1"><strong className="block truncate text-xs">{userName}</strong><small className="block text-[10px] text-slate-500">{isAdmin ? "Administrator" : "Peserta"}</small></span>}
    </button>
    {profileOpen && <div className={`absolute bottom-full z-50 mb-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 ${collapsed ? "left-0" : "inset-x-0"}`}>
      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800"><strong className="block truncate text-sm">{userName}</strong><small className="block truncate text-xs text-slate-500">{user.email}</small></div>
      <div className="p-1.5">
        <button onClick={() => navigate("/profile")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"><span>♙</span>Profil saya</button>
        <button onClick={() => navigate("/buku-kesalahan")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"><span>◎</span>Buku kesalahan</button>
        <button onClick={() => setDark((value) => !value)} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"><span>{dark ? "☀ Mode terang" : "☾ Mode gelap"}</span></button>
      </div>
      <div className="border-t border-slate-100 p-1.5 dark:border-slate-800"><button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"><span>↪</span>Keluar</button></div>
    </div>}
  </div>;

  return <>
    <aside className={`fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200 bg-white px-3 py-4 transition-[width] duration-200 dark:border-slate-800 dark:bg-slate-900 md:flex md:flex-col ${collapsed ? "w-[5.5rem]" : "w-[15.5rem]"}`}>
      <div className={`flex h-12 items-center ${collapsed ? "justify-center" : "justify-between"}`}>
        <Link to="/dashboard" className="rounded-xl bg-white p-1.5" aria-label="NalarASN Beranda"><img src={logo} alt="NalarASN" className={`${collapsed ? "h-8 w-10 object-cover object-left" : "h-9 w-auto max-w-[155px]"} object-contain`} /></Link>
        {!collapsed && <button onClick={() => setCollapsed(true)} className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Ciutkan menu">‹</button>}
      </div>
      {collapsed && <button onClick={() => setCollapsed(false)} className="mx-auto mt-2 grid h-8 w-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Buka menu">›</button>}

      <nav className="mt-5 space-y-1.5" aria-label="Menu utama">
        {mainMenus.map((menu) => <Link title={collapsed ? menu.label : undefined} key={menu.path} to={menu.path} className={`flex min-h-11 items-center rounded-xl text-sm font-semibold transition ${collapsed ? "justify-center px-2" : "gap-3 px-3"} ${isActive(menu.path) ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800"}`}><span className="text-lg">{menu.icon}</span>{!collapsed && menu.label}</Link>)}
        {isAdmin && <Link title={collapsed ? "Admin" : undefined} to="/admin" className={`flex min-h-11 items-center rounded-xl text-sm font-semibold ${collapsed ? "justify-center px-2" : "gap-3 px-3"} ${isActive("/admin") ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800"}`}><span>⚙</span>{!collapsed && "Admin"}</Link>}
      </nav>

      <div className="mt-auto space-y-2">
        {!collapsed && <Link to="/panduan" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"><span>?</span>Panduan & bantuan</Link>}
        {accountMenu}
      </div>
    </aside>

    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 md:hidden">
      <div className="flex h-12 items-center justify-between"><Link to="/dashboard" className="rounded-lg bg-white p-1"><img src={logo} alt="NalarASN" className="h-9 w-auto max-w-[145px] object-contain" /></Link><button onClick={() => navigate("/profile")} className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">{initials}</button></div>
    </header>

    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-1 pb-[max(5px,env(safe-area-inset-bottom))] pt-1 shadow-[0_-8px_25px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 md:hidden" aria-label="Menu utama seluler">
      {mainMenus.map((menu) => <Link key={menu.path} to={menu.path} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[9px] font-semibold ${isActive(menu.path) ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`}><span className="text-lg">{menu.icon}</span>{menu.shortLabel}</Link>)}
    </nav>
  </>;
}
