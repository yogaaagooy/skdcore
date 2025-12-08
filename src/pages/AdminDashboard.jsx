import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import logo from "../assets/skdcore-logo.png";
import { getCurrentUser, getUsers, logout } from "../utils/auth";

const HISTORY_KEY = "skdcore_simulasi_history_v1";
const QUESTION_BANK_KEY = "skdcore_question_bank_v1";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all"); // all | user | admin
  const [sortBy, setSortBy] = useState("recent"); // recent | simulasi | name

  const [questionStats, setQuestionStats] = useState({
    total: 0,
    twk: 0,
    tiu: 0,
    tkp: 0,
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u || u.role !== "admin") {
      navigate("/login");
      return;
    }
    setAdmin(u);
    setUsers(getUsers());

    if (typeof window === "undefined") return;
    try {
      // history simulasi
      const rawHistory = window.localStorage.getItem(HISTORY_KEY);
      if (rawHistory) {
        const parsed = JSON.parse(rawHistory);
        if (Array.isArray(parsed)) setHistory(parsed);
      }

      // question bank
      const rawQ = window.localStorage.getItem(QUESTION_BANK_KEY);
      if (rawQ) {
        const parsedQ = JSON.parse(rawQ);
        if (Array.isArray(parsedQ)) {
          updateQuestionStats(parsedQ);
        }
      }
    } catch (err) {
      console.error("Gagal load data admin:", err);
    }
  }, [navigate]);

  function updateQuestionStats(list) {
    const total = list.length;
    const twk = list.filter((q) => q.category === "TWK").length;
    const tiu = list.filter((q) => q.category === "TIU").length;
    const tkp = list.filter((q) => q.category === "TKP").length;
    setQuestionStats({ total, twk, tiu, tkp });
  }

  if (!admin) return null;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  // ----- USER STATS -----
  const userRows = users
    .map((u) => {
      const myHistory = history.filter((h) => h.userEmail === u.email);
      const totalSimulasi = myHistory.length;

      let lastActivity = null;
      let lastResult = null;
      if (totalSimulasi > 0) {
        const sorted = [...myHistory].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        lastActivity = sorted[0].date;
        lastResult = sorted[0].result || null;
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        totalSimulasi,
        lastActivity,
        lastResult,
      };
    })
    .filter((row) => {
      if (roleFilter !== "all" && row.role !== roleFilter) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name, "id");
      }
      if (sortBy === "simulasi") {
        return b.totalSimulasi - a.totalSimulasi;
      }
      const da = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
      const db = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
      return db - da;
    });

  const totalSimulasiAll = history.length;

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

  // ----- EXPORT USERS -----
  function handleExportJSON() {
    const data = {
      generatedAt: new Date().toISOString(),
      users,
      history,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "skdcore-admin-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportCSV() {
    const header = [
      "name",
      "email",
      "role",
      "totalSimulasi",
      "lastTWK",
      "lastTIU",
      "lastTKP",
      "lastActivity",
    ];
    const rows = userRows.map((u) => [
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.email.replace(/"/g, '""')}"`,
      u.role,
      u.totalSimulasi,
      u.lastResult?.TWK ?? "",
      u.lastResult?.TIU ?? "",
      u.lastResult?.TKP ?? "",
      u.lastActivity ? formatDate(u.lastActivity) : "",
    ]);

    const csv =
      header.join(",") +
      "\n" +
      rows.map((r) => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "skdcore-user-summary.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ----- IMPORT / EXPORT QUESTION BANK -----
  function handleClickImportQuestions() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }

 function handleFileChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const text = ev.target?.result;
      const data = JSON.parse(text);

      if (!Array.isArray(data) || data.length === 0) {
        alert("Format file tidak valid atau kosong.");
        return;
      }

      const cleaned = [];

      for (const q of data) {
        if (!q) continue;
        if (q.id == null || typeof q.question !== "string") continue;
        if (!["TWK", "TIU", "TKP"].includes(q.category)) continue;

        // ====== 1) FORMAT SUDAH SIAP (options ARRAY) ======
        // {
        //   id, category, question,
        //   options: [{id:"A", text:"...", score:5}, ...]
        // }
        if (Array.isArray(q.options)) {
          const optionsArray = q.options
            .filter(
              (o) =>
                o &&
                typeof o.id === "string" &&
                typeof o.text === "string" &&
                typeof o.score !== "undefined"
            )
            .map((o) => ({
              id: o.id,
              text: o.text,
              score: Number(o.score ?? 0),
            }));

          if (optionsArray.length === 0) continue;

          cleaned.push({
            id: q.id,
            category: q.category,
            question: q.question,
            options: optionsArray,
          });
          continue;
        }

        // ====== 2) FORMAT BARU: options OBJECT A–E ======

        // options: { "A": "....", "B": "....", ... }
        if (q.options && typeof q.options === "object") {
          const optionKeys = ["A", "B", "C", "D", "E"].filter(
            (k) => typeof q.options[k] === "string"
          );
          if (optionKeys.length === 0) continue;

          // --- TWK / TIU: pakai q.correct (huruf jawaban benar) ---
          if (q.category === "TWK" || q.category === "TIU") {
            const correct = (q.correct || "").toString().toUpperCase();
            if (!optionKeys.includes(correct)) {
              // kalau correct tidak valid, skip soal ini
              console.warn("Soal TWK/TIU tanpa 'correct' yang valid, di-skip:", q.id);
              continue;
            }

            const optionsArray = optionKeys.map((key) => ({
              id: key,
              text: q.options[key],
              score: key === correct ? 5 : 0,
            }));

            cleaned.push({
              id: q.id,
              category: q.category,
              question: q.question,
              options: optionsArray,
              explanation: q.explanation || ""
            });
            continue;
          }

          // --- TKP: pakai q.scores (nilai 1–5 per opsi) ---
          if (q.category === "TKP") {
            const scoresObj = q.scores && typeof q.scores === "object" ? q.scores : {};
            const optionsArray = optionKeys.map((key) => {
              let rawScore = Number(scoresObj[key] ?? 1);
              if (Number.isNaN(rawScore)) rawScore = 1;
              // clamp 1–5
              if (rawScore < 1) rawScore = 1;
              if (rawScore > 5) rawScore = 5;

              return {
                id: key,
                text: q.options[key],
                score: rawScore,
              };
            });

            cleaned.push({
            id: q.id,
            category: q.category,
            question: q.question,
            options: optionsArray,
            explanation: q.explanation || ""
          });
            continue;
          }
        }

        // kalau gak cocok format manapun → di-skip
      }

      if (cleaned.length === 0) {
        alert("Tidak ada soal yang valid di file ini.");
        return;
      }

      window.localStorage.setItem(QUESTION_BANK_KEY, JSON.stringify(cleaned));
      updateQuestionStats(cleaned);
      alert(`Import soal berhasil. Total soal tersimpan: ${cleaned.length}`);
    } catch (err) {
      console.error("Gagal import soal:", err);
      alert("Gagal membaca file. Pastikan format JSON sudah benar.");
    }
  };

  reader.readAsText(file);
}


  function handleExportQuestionBank() {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(QUESTION_BANK_KEY);
    if (!raw) {
      alert("Belum ada bank soal di penyimpanan.");
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      const blob = new Blob([JSON.stringify(parsed, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "skdcore-question-bank.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Gagal export soal:", err);
      alert("Gagal export bank soal.");
    }
  }

  function handleClearQuestionBank() {
    if (!window.confirm("Hapus semua bank soal dari perangkat ini?")) return;
    window.localStorage.removeItem(QUESTION_BANK_KEY);
    setQuestionStats({ total: 0, twk: 0, tiu: 0, tkp: 0 });
  }

  // ===== UI =====
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 dark:text-slate-50">
      {/* HEADER */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-gray-200 dark:border-slate-800 shadow-sm dark:shadow-none">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="SKDCore" className="h-7 w-auto object-contain" />
            <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
              Admin panel
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden sm:inline text-xs text-gray-500 dark:text-slate-400">
              {admin.email}
            </span>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-full border border-gray-300 text-xs font-medium hover:bg-gray-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* BODY */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Ringkasan atas */}
        <section className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-gray-200 p-5">
          <h1 className="text-xl font-bold mb-2">Ringkasan data</h1>
          <p className="text-xs text-gray-600 dark:text-slate-300 mb-4">
            Data ini disimpan lokal di browser perangkat ini (bukan server).
          </p>
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Total user</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">
                Total simulasi terekam
              </p>
              <p className="text-2xl font-bold">{totalSimulasiAll}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">
                Bank soal tersimpan
              </p>
              <p className="text-2xl font-bold">{questionStats.total}</p>
              <p className="text-[11px] text-gray-500 dark:text-slate-400">
                TWK: {questionStats.twk} • TIU: {questionStats.tiu} • TKP: {questionStats.tkp}
              </p>
            </div>
          </div>
        </section>

        {/* Kontrol filter/sort + export users */}
        <section className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-gray-500 dark:text-slate-400">Peran:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg px-2 py-1 text-xs"
              >
                <option value="all">Semua</option>
                <option value="user">User biasa</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-gray-500 dark:text-slate-400">Urutkan:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg px-2 py-1 text-xs"
              >
                <option value="recent">Aktivitas terbaru</option>
                <option value="simulasi">Terbanyak simulasi</option>
                <option value="name">Nama A–Z</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau email…"
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[180px]"
            />
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 text-xs hover:bg-gray-50 dark:hover:bg-slate-800"
            >
              Export CSV
            </button>
            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
            >
              Export JSON
            </button>
          </div>
        </section>

        {/* Bank soal */}
        <section className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold mb-2">Bank soal SKD</h2>
          <p className="text-xs text-gray-600 dark:text-slate-300 mb-3">
            Import file JSON berisi daftar soal TWK, TIU, dan TKP. Soal ini akan dipakai di
            halaman simulasi.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleClickImportQuestions}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
            >
              Import JSON soal
            </button>
            <button
              type="button"
              onClick={handleExportQuestionBank}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
            >
              Export bank soal
            </button>
            <button
              type="button"
              onClick={handleClearQuestionBank}
              className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-300 dark:hover:bg-red-950/40"
            >
              Hapus bank soal
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleFileChange}
          />
        </section>

        {/* Tabel user */}
        <section className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold mb-3">Daftar user & aktivitas simulasi</h2>
          {userRows.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Belum ada user yang cocok dengan filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-[11px] text-gray-500 dark:text-slate-400 border-b border-gray-100 dark:border-slate-800">
                    <th className="text-left py-2 pr-3">Nama</th>
                    <th className="text-left py-2 pr-3">Email</th>
                    <th className="text-left py-2 pr-3">Role</th>
                    <th className="text-right py-2 pr-3">Total simulasi</th>
                    <th className="text-right py-2 pr-3">Nilai terakhir (TWK/TIU/TKP)</th>
                    <th className="text-right py-2">Aktivitas terakhir</th>
                  </tr>
                </thead>
                <tbody>
                  {userRows.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-gray-50 dark:border-slate-800 last:border-b-0"
                    >
                      <td className="py-2 pr-3">
                        <div className="font-semibold">{u.name}</div>
                      </td>
                      <td className="py-2 pr-3 text-gray-600 dark:text-slate-300">
                        {u.email}
                      </td>
                      <td className="py-2 pr-3">
                        <span className="px-2 py-0.5 rounded-full border border-gray-300 dark:border-slate-700 text-[11px]">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-right font-semibold">
                        {u.totalSimulasi}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        {u.lastResult ? (
                          <span>
                            {u.lastResult.TWK ?? 0} / {u.lastResult.TIU ?? 0} /{" "}
                            {u.lastResult.TKP ?? 0}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-2 text-right text-gray-500 dark:text-slate-400">
                        {u.lastActivity ? formatDate(u.lastActivity) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 text-sm hover:bg-gray-50 dark:hover:bg-slate-800"
        >
          Kembali ke Dashboard
        </button>
      </main>
    </div>
  );
}
