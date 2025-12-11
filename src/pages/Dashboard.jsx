// src/pages/Dashboard.jsx
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getCurrentUser } from "../utils/auth";

const HISTORY_KEY = "skdcore_simulasi_history_v1";

export default function Dashboard() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [user, setUser] = useState(null);
  
  // Ambil user & history di awal
  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      navigate("/login", { replace: true });
      return;
    }
    setUser(u);

    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      // admin lihat semua, user lihat history dirinya saja
      const filtered =
        u.role === "admin"
          ? parsed
          : parsed.filter((h) => !h.userEmail || h.userEmail === u.email);

      setHistory(filtered);
    } catch (err) {
      console.error("Gagal load riwayat simulasi:", err);
    }
  }, [navigate]);

  if (!user) return null;

  const totalSimulasi = history.length;

  // Hitung rata-rata
  let avgTWK = 0;
  let avgTIU = 0;
  let avgTKP = 0;

  if (totalSimulasi > 0) {
    let sumTWK = 0;
    let sumTIU = 0;
    let sumTKP = 0;

    history.forEach((h) => {
      const r = h.result || {};
      sumTWK += r.TWK || 0;
      sumTIU += r.TIU || 0;
      sumTKP += r.TKP || 0;
    });

    avgTWK = Math.round(sumTWK / totalSimulasi);
    avgTIU = Math.round(sumTIU / totalSimulasi);
    avgTKP = Math.round(sumTKP / totalSimulasi);
  }

  function labelMode(mode) {
    if (!mode || mode === "all") return "Simulasi penuh";
    if (mode === "twk") return "Fokus TWK";
    if (mode === "tiu") return "Fokus TIU";
    if (mode === "tkp") return "Fokus TKP";
    return mode.toUpperCase();
  }

  function formatDate(str) {
    if (!str) return "-";
    try {
      return new Date(str).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />
      {/* MAIN CONTENT */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Greeting */}
        <section>
          <h1 className="text-2xl font-bold mb-1">
            Dashboard SKD kamu
          </h1>
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Pantau progress latihan TWK, TIU, dan TKP di sini.
          </p>
        </section>

        {/* Summary cards */}
        <section className="grid md:grid-cols-3 gap-4">
          {/* TWK */}
          <div className="bg-white dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700 p-4">
            <p className="text-xs font-semibold text-blue-600 mb-1">TWK</p>
            <p className="text-sm text-gray-500 dark:text-slate-300 mb-2">
              Tes Wawasan Kebangsaan
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-50 mb-1">
              {avgTWK || 0}
              <span className="text-sm text-gray-400"> / rata-rata</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">
              Total simulasi: {totalSimulasi || 0}x
            </p>
            <p className="text-[11px] text-gray-500 dark:text-slate-400">
              Semakin sering latihan, semakin stabil nilai TWK kamu.
            </p>
          </div>

          {/* TIU */}
          <div className="bg-white dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700 p-4">
            <p className="text-xs font-semibold text-blue-600 mb-1">TIU</p>
            <p className="text-sm text-gray-500 dark:text-slate-300 mb-2">
              Tes Intelegensi Umum
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-50 mb-1">
              {avgTIU || 0}
              <span className="text-sm text-gray-400"> / rata-rata</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">
              Total simulasi: {totalSimulasi || 0}x
            </p>
            <p className="text-[11px] text-gray-500 dark:text-slate-400">
              Cocok buat ngukur konsistensi logika dan numerik kamu.
            </p>
          </div>

          {/* TKP */}
          <div className="bg-white dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700 p-4">
            <p className="text-xs font-semibold text-blue-600 mb-1">TKP</p>
            <p className="text-sm text-gray-500 dark:text-slate-300 mb-2">
              Tes Karakteristik Pribadi
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-50 mb-1">
              {avgTKP || 0}
              <span className="text-sm text-gray-400"> / rata-rata</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">
              Total simulasi: {totalSimulasi || 0}x
            </p>
            <p className="text-[11px] text-gray-500 dark:text-slate-400">
              TKP butuh banyak latihan untuk memahami pola penilaian.
            </p>
          </div>
        </section>

        {/* Riwayat + Aksi cepat */}
        <section className="grid md:grid-cols-3 gap-4">
          {/* Riwayat simulasi */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold mb-2">Riwayat simulasi</h2>
            {history.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Belum ada riwayat simulasi. Coba mulai satu simulasi dulu.
              </p>
            ) : (
              <div className="mt-2 space-y-2 text-xs text-gray-700 dark:text-slate-200 max-h-72 overflow-y-auto">
                {history.slice(0, 10).map((h) => (
                  <div
                    key={h.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-slate-800 pb-2 last:border-b-0"
                  >
                    <div>
                      <p className="font-semibold">{formatDate(h.date)}</p>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400">
                        Mode: {labelMode(h.mode)} • Terjawab{" "}
                        {h.answeredCount}/{h.totalQuestions} soal
                      </p>
                    </div>
                    <div className="flex gap-3 text-[11px]">
                      <span>
                        TWK:{" "}
                        <span className="font-semibold">{h.result?.TWK ?? 0}</span>
                      </span>
                      <span>
                        TIU:{" "}
                        <span className="font-semibold">{h.result?.TIU ?? 0}</span>
                      </span>
                      <span>
                        TKP:{" "}
                        <span className="font-semibold">{h.result?.TKP ?? 0}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aksi cepat */}
         {/* Daftar Simulasi 1..10 */}
<div className="space-y-2 text-sm">
  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
    <button
      key={n}
      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-left"
      onClick={() => navigate(`/simulasi/sim/${n}`)}
    >
      Simulasi {n}
    </button>
  ))}
</div>

        </section>
      </div>
    </div>
  );
}
