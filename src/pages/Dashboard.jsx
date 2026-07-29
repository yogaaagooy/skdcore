import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getCurrentUser } from "../utils/auth";

const HISTORY_KEY = "skdcore_simulasi_history_v1";

const modes = [
  { id: "twk", label: "TWK", description: "Wawasan Kebangsaan", detail: "30 soal · 25 menit", color: "blue" },
  { id: "tiu", label: "TIU", description: "Intelegensia Umum", detail: "35 soal · 30 menit", color: "violet" },
  { id: "tkp", label: "TKP", description: "Karakteristik Pribadi", detail: "45 soal · 40 menit", color: "amber" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [showPackages, setShowPackages] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate("/login", { replace: true });
      return;
    }
    setUser(currentUser);
    try {
      const stored = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || "[]");
      if (!Array.isArray(stored)) return;
      setHistory(currentUser.role === "admin" ? stored : stored.filter((item) => !item.userEmail || item.userEmail === currentUser.email));
    } catch {
      setHistory([]);
    }
  }, [navigate]);

  const summary = useMemo(() => {
    if (!history.length) return { TWK: 0, TIU: 0, TKP: 0, lastScore: 0 };
    const totals = history.reduce((value, item) => ({
      TWK: value.TWK + (item.result?.TWK || 0),
      TIU: value.TIU + (item.result?.TIU || 0),
      TKP: value.TKP + (item.result?.TKP || 0),
    }), { TWK: 0, TIU: 0, TKP: 0 });
    const last = history[0]?.result || {};
    return {
      TWK: Math.round(totals.TWK / history.length),
      TIU: Math.round(totals.TIU / history.length),
      TKP: Math.round(totals.TKP / history.length),
      lastScore: (last.TWK || 0) + (last.TIU || 0) + (last.TKP || 0),
    };
  }, [history]);

  if (!user) return null;

  return (
    <div className="app-page min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-9">
        <section className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Beranda</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            Halo, {user.name?.split(" ")[0] || "Pejuang CPNS"}!
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Pilih latihan dan mulai kerjakan.</p>
        </section>

        <section className="mb-6 rounded-3xl bg-gradient-to-br from-blue-700 to-blue-500 p-6 text-white shadow-lg shadow-blue-600/20 sm:flex sm:items-center sm:justify-between sm:p-8">
          <div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">Tryout Gratis</span>
            <h2 className="mt-4 text-2xl font-bold">Tryout 1</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">110 soal TWK, TIU, dan TKP dengan waktu 100 menit.</p>
          </div>
          <button onClick={() => navigate("/tryout")} className="mt-5 w-full rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50 sm:mt-0 sm:w-auto">
            Mulai sekarang →
          </button>
        </section>

        <section className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500">Total latihan</p><p className="mt-1 text-2xl font-bold">{history.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500">Nilai terakhir</p><p className="mt-1 text-2xl font-bold">{summary.lastScore || "—"}</p>
          </div>
          <button onClick={() => navigate("/hasil-simulasi")} className="col-span-2 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900 sm:col-span-1">
            <p className="text-xs text-slate-500">Riwayat hasil</p><p className="mt-2 text-sm font-bold text-blue-600">Lihat semua →</p>
          </button>
        </section>

        <section>
          <div className="mb-3"><h2 className="text-lg font-bold">Latihan per bidang</h2><p className="text-xs text-slate-500">Fokus pada materi tertentu.</p></div>
          <div className="grid gap-3 sm:grid-cols-3">
            {modes.map((mode) => (
              <button key={mode.id} onClick={() => navigate("/latihan")} className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between"><span className="text-lg font-extrabold text-blue-600">{mode.label}</span><span className="text-slate-400">→</span></div>
                <p className="mt-3 text-sm font-semibold">{mode.description}</p><p className="mt-1 text-xs text-slate-500">{mode.detail}</p>
                <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800">Rata-rata: <strong className="text-slate-900 dark:text-white">{summary[mode.label]}</strong></p>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <button onClick={() => setShowPackages((value) => !value)} className="flex w-full items-center justify-between p-5 text-left">
            <span><strong className="block text-sm">Tryout 1–10</strong><small className="mt-1 block text-xs text-slate-500">Pilih tryout reguler untuk mengukur kesiapanmu.</small></span>
            <span className="text-slate-400">{showPackages ? "▲" : "▼"}</span>
          </button>
          {showPackages && <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-4 dark:border-slate-800 sm:grid-cols-5">
            {Array.from({ length: 10 }, (_, index) => index + 1).map((number) => (
              <button key={number} onClick={() => navigate(`/simulasi/sim/${number}`)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold hover:border-blue-500 hover:text-blue-600 dark:border-slate-700">Tryout {number}</button>
            ))}
          </div>}
        </section>

        {history.length > 0 && <section className="mt-7">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Aktivitas terakhir</h2><button onClick={() => navigate("/hasil-simulasi")} className="text-xs font-semibold text-blue-600">Selengkapnya</button></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            {history.slice(0, 3).map((item) => <div key={item.id || item.date} className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0 dark:border-slate-800">
              <div><p className="text-sm font-semibold">{item.packageNumber ? `Tryout ${item.packageNumber}` : !item.mode || item.mode === "all" ? "Latihan campuran" : `Latihan ${item.mode.toUpperCase()}`}</p><p className="mt-1 text-xs text-slate-500">{new Date(item.date).toLocaleDateString("id-ID")}</p></div>
              <p className="font-bold">{(item.result?.TWK || 0) + (item.result?.TIU || 0) + (item.result?.TKP || 0)} <span className="text-xs font-normal text-slate-500">poin</span></p>
            </div>)}
          </div>
        </section>}
      </main>
    </div>
  );
}
