import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getCurrentUser, setCurrentUser } from "../utils/auth";
import { logout, updateProfile } from "../services/auth";
import logo from "../assets/logo.png";

const HISTORY_KEY = "skdcore_simulasi_history_v1";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [nameInput, setNameInput] = useState("");
  const [instansiInput, setInstansiInput] = useState("");

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      navigate("/login");
      return;
    }
    setUser(u);
    setNameInput(u.name || "");
    setInstansiInput(u.instansi || "");

    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      const myHistory = parsed.filter((h) => !h.userEmail || h.userEmail === u.email);
      setHistoryCount(myHistory.length);
      if (myHistory.length > 0) {
        setLastResult(myHistory[0].result || null);
      }
    } catch (err) {
      console.error("Gagal load history:", err);
    }
  }, [navigate]);

  if (!user) return null;

  async function handleSaveName(e) {
    e.preventDefault();
    const newName = nameInput.trim();
    if (!newName) return;

    try {
      const updatedUser = await updateProfile(user.id, { name: newName, instansi: instansiInput });
      setCurrentUser(updatedUser);
      setUser(updatedUser);
    } catch {
      window.alert("Profil gagal disimpan. Coba lagi.");
    }
  }

  async function handleLogout() {
    await logout();
    setCurrentUser(null);
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 dark:text-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <section className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:text-left">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-blue-50 p-3 ring-4 ring-blue-100 dark:bg-slate-800 dark:ring-blue-950">
            <img src={logo} alt="Logo profil NalarASN" className="w-full object-contain" />
          </div>
          <div className="mt-4 sm:ml-5 sm:mt-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Profil pengguna</p>
            <h1 className="mt-1 text-xl font-bold">{user.name || "Peserta NalarASN"}</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{user.email}</p>
          </div>
        </section>
        <section className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-gray-200 p-5">
          <h2 className="text-xl font-bold mb-3">Data akun</h2>
          <form onSubmit={handleSaveName} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Instansi</label>
              <input value={instansiInput} onChange={(e) => setInstansiInput(e.target.value)} className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Nama instansi" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                Nama
              </label>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                Email
              </label>
              <input
                value={user.email}
                disabled
                className="w-full border border-gray-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-slate-800/80 text-gray-500 dark:text-slate-400"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
              <span>Role: </span>
              <span className="px-2 py-0.5 rounded-full border border-gray-300 dark:border-slate-700">
                {user.role}
              </span>
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
            >
              Simpan perubahan
            </button>
          </form>
        </section>

        <section className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold mb-2">Statistik latihan kamu</h2>
          <p className="text-xs text-gray-600 dark:text-slate-300 mb-3">
            Data ini hanya berdasarkan simulasi yang tersimpan di perangkat ini.
          </p>
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">
                Total simulasi dikerjakan
              </p>
              <p className="text-2xl font-bold">{historyCount}</p>
            </div>
            {lastResult && (
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">
                  Nilai terakhir (TWK / TIU / TKP)
                </p>
                <p className="text-lg font-semibold">
                  {lastResult.TWK ?? 0} / {lastResult.TIU ?? 0} / {lastResult.TKP ?? 0}
                </p>
              </div>
            )}
          </div>
        </section>

        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 text-sm hover:bg-gray-50 dark:hover:bg-slate-800"
        >
          Beranda
        </button>
      </main>
    </div>
  );
}
