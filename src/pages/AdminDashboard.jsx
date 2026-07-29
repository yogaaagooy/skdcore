
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
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

  const [showImportModal, setShowImportModal] = useState(false);
  const [newQuestions, setNewQuestions] = useState(
    Array(10).fill(null).map(() => ({
      id: Date.now() + Math.random(),
      category: "TWK",
      question: "",
      options: [
        { id: "A", text: "", score: 0 },
        { id: "B", text: "", score: 0 },
        { id: "C", text: "", score: 0 },
        { id: "D", text: "", score: 0 },
        { id: "E", text: "", score: 0 }
      ]
    }))
  );

  const [showImportJsonModal, setShowImportJsonModal] = useState(false);
  const [importJsonMode, setImportJsonMode] = useState("all"); // all, twk, tiu, tkp
  const [importJsonFile, setImportJsonFile] = useState(null);

  const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [newRole, setNewRole] = useState("user");

  const fileInputRef = useRef(null);
  const jsonFileInputRef = useRef(null);

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

  function handleOpenChangeRoleModal(user) {
    setSelectedUserForRole(user);
    setNewRole(user.role);
    setShowChangeRoleModal(true);
  }

  function handleSaveChangeRole() {
    if (!selectedUserForRole || !newRole) return;
    
    try {
      // Update user di localStorage
      const updatedUsers = users.map((u) =>
        u.id === selectedUserForRole.id ? { ...u, role: newRole } : u
      );
      window.localStorage.setItem("skdcore_users", JSON.stringify(updatedUsers));
      
      // Update state
      setUsers(updatedUsers);
      setShowChangeRoleModal(false);
      alert(`✔ Role ${selectedUserForRole.name} berhasil diubah menjadi ${newRole}`);
    } catch (err) {
      console.error("Gagal ubah role:", err);
      alert("❌ Gagal mengubah role");
    }
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

  // ===== IMPORT 10 SOAL MANUAL =====
  function handleUpdateQuestion(index, field, value) {
    const updated = [...newQuestions];
    if (field === "category") {
      updated[index].category = value;
    } else if (field === "question") {
      updated[index].question = value;
    } else if (field.startsWith("option_")) {
      const parts = field.split("_");
      const optionIdx = parseInt(parts[1]);
      const optionField = parts[2]; // "text" or "score"
      if (updated[index].options[optionIdx]) {
        updated[index].options[optionIdx][optionField] = optionField === "score" ? Number(value) : value;
      }
    }
    setNewQuestions(updated);
  }

  function handleSaveManualQuestions() {
    // Validasi minimal
    const valid = newQuestions.filter(q => {
      if (!q.question.trim()) return false;
      const hasText = q.options.some(o => o.text.trim());
      const hasScore = q.options.some(o => o.score > 0);
      return hasText && hasScore;
    });

    if (valid.length === 0) {
      alert("Minimal 1 soal harus diisi dengan benar (ada pertanyaan, pilihan, dan skor).");
      return;
    }

    // Ambil soal yang sudah ada
    const existing = JSON.parse(window.localStorage.getItem(QUESTION_BANK_KEY) || "[]");
    const combined = [...existing, ...valid];
    
    window.localStorage.setItem(QUESTION_BANK_KEY, JSON.stringify(combined));
    updateQuestionStats(combined);
    
    alert(`Berhasil tambah ${valid.length} soal baru. Total soal sekarang: ${combined.length}`);
    setShowImportModal(false);
    
    // Reset form
    setNewQuestions(
      Array(10).fill(null).map(() => ({
        id: Date.now() + Math.random(),
        category: "TWK",
        question: "",
        options: [
          { id: "A", text: "", score: 0 },
          { id: "B", text: "", score: 0 },
          { id: "C", text: "", score: 0 },
          { id: "D", text: "", score: 0 },
          { id: "E", text: "", score: 0 }
        ]
      }))
    );
  }

  // ===== IMPORT JSON PER MODE =====
  function handleOpenImportJsonModal() {
    setImportJsonMode("all");
    setImportJsonFile(null);
    setShowImportJsonModal(true);
  }

  function handleClickJsonFileInput() {
    if (jsonFileInputRef.current) {
      jsonFileInputRef.current.value = "";
      jsonFileInputRef.current.click();
    }
  }

  function handleJsonFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result;
        const data = JSON.parse(text);

        if (!Array.isArray(data) || data.length === 0) {
          alert("Format file JSON tidak valid atau kosong.");
          return;
        }

        // Filter by mode
        let filtered = data;
        
        // Hanya filter kategori jika bukan simulasi spesifik
        if (importJsonMode !== "all" && !importJsonMode.startsWith("simulasi-")) {
          const modeCategory = importJsonMode.toUpperCase();
          filtered = data.filter(q => q.category === modeCategory);
          
          if (filtered.length === 0) {
            alert(`Tidak ada soal dengan kategori ${importJsonMode.toUpperCase()} di file ini.`);
            return;
          }
        }

        // Validasi format
        const cleaned = [];
        for (const q of filtered) {
          if (!q.id || typeof q.question !== "string") continue;
          if (!["TWK", "TIU", "TKP"].includes(q.category)) continue;

          // ====== FORMAT 1: options ARRAY (sudah siap pakai) ======
          if (Array.isArray(q.options)) {
            const optionsArray = q.options
              .filter(o => o && typeof o.id === "string" && typeof o.text === "string")
              .map(o => ({
                id: o.id,
                text: o.text,
                score: Number(o.score ?? 0)
              }));

            if (optionsArray.length === 0) continue;

            cleaned.push({
              id: q.id,
              category: q.category,
              question: q.question,
              options: optionsArray,
              explanation: q.explanation || ""
            });
            continue;
          }

          // ====== FORMAT 2: options OBJECT (A-E) ======
          if (q.options && typeof q.options === "object" && !Array.isArray(q.options)) {
            const optionKeys = ["A", "B", "C", "D", "E"].filter(
              (k) => typeof q.options[k] === "string"
            );
            if (optionKeys.length === 0) continue;

            // --- TWK / TIU: gunakan q.correct ---
            if (q.category === "TWK" || q.category === "TIU") {
              const correct = (q.correct || "").toString().toUpperCase();
              if (!optionKeys.includes(correct)) {
                console.warn("Soal TWK/TIU tanpa 'correct' yang valid, di-skip:", q.id);
                continue;
              }

              const optionsArray = optionKeys.map((key) => ({
                id: key,
                text: q.options[key],
                score: key === correct ? 5 : 0
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

            // --- TKP: gunakan q.scores ---
            if (q.category === "TKP") {
              const scoresObj = q.scores && typeof q.scores === "object" ? q.scores : {};
              const optionsArray = optionKeys.map((key) => {
                let rawScore = Number(scoresObj[key] ?? 1);
                if (Number.isNaN(rawScore)) rawScore = 1;
                if (rawScore < 1) rawScore = 1;
                if (rawScore > 5) rawScore = 5;

                return {
                  id: key,
                  text: q.options[key],
                  score: rawScore
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
        }

        if (cleaned.length === 0) {
          alert("Tidak ada soal yang valid di file ini.");
          return;
        }

        // Tentukan localStorage key berdasarkan mode
        let storageKey = QUESTION_BANK_KEY;
        if (importJsonMode.startsWith("simulasi-")) {
          const simulasiNum = importJsonMode.replace("simulasi-", "");
          storageKey = `skdcore_simulasi_${simulasiNum}_questions_v1`;
        }

        // Ambil soal yang sudah ada
        const existing = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
        const combined = [...existing, ...cleaned];

        window.localStorage.setItem(storageKey, JSON.stringify(combined));
        
        // Update question stats jika import ke bank soal utama
        if (importJsonMode === "all" || importJsonMode === "twk" || importJsonMode === "tiu" || importJsonMode === "tkp") {
          const allQuestions = JSON.parse(window.localStorage.getItem(QUESTION_BANK_KEY) || "[]");
          updateQuestionStats(allQuestions);
        }

        const simulasiLabel = importJsonMode.startsWith("simulasi-") 
          ? importJsonMode.replace("simulasi-", "Simulasi ") 
          : "Bank soal utama";
        alert(`Berhasil import ${cleaned.length} soal ke ${simulasiLabel}. Total: ${combined.length}`);
        setShowImportJsonModal(false);
      } catch (err) {
        console.error("Gagal import JSON:", err);
        alert("Gagal membaca file JSON. Pastikan format sudah benar.");
      }
    };
    reader.readAsText(file);
  }

  // ===== UI =====
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 dark:text-slate-50">
      <Navbar />

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
              onClick={handleOpenImportJsonModal}
              className="px-3 py-1.5 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700"
            >
              📁 Import JSON per mode
            </button>
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="px-3 py-1.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700"
            >
              + Input 10 soal manual
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

        {/* Import soal per simulasi */}
        <section className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold mb-3">Import soal per simulasi</h2>
          <p className="text-xs text-gray-600 dark:text-slate-300 mb-4">
            Upload file JSON untuk masing-masing simulasi. Setiap simulasi dapat memiliki soal yang berbeda.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  setImportJsonMode(`simulasi-${num}`);
                  setShowImportJsonModal(true);
                }}
                className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
              >
                Simulasi {num}
              </button>
            ))}
          </div>
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
                    <th className="text-left py-2 pr-3">WhatsApp</th>
                    <th className="text-left py-2 pr-3">Role</th>
                    <th className="text-right py-2 pr-3">Total simulasi</th>
                    <th className="text-right py-2 pr-3">Nilai terakhir (TWK/TIU/TKP)</th>
                    <th className="text-right py-2 pr-3">Aktivitas terakhir</th>
                    <th className="text-center py-2">Aksi</th>
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
                      <td className="py-2 pr-3 text-gray-600 dark:text-slate-300">
                        <a
                          href={`https://wa.me/${u.whatsapp?.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline text-[11px]"
                        >
                          {u.whatsapp || "-"}
                        </a>
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
                      <td className="py-2 text-center">
                        <button
                          onClick={() => handleOpenChangeRoleModal(u)}
                          className="px-2 py-1 rounded text-[11px] font-semibold bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Ubah Role
                        </button>
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

        {/* MODAL INPUT 10 SOAL */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">Input 10 Soal Manual</h2>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-2xl text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 space-y-4">
                {newQuestions.map((q, qIdx) => (
                  <div key={qIdx} className="border border-gray-300 dark:border-slate-700 rounded-lg p-3 bg-gray-50 dark:bg-slate-800">
                    <div className="text-xs font-semibold text-gray-600 dark:text-slate-300 mb-2">
                      Soal {qIdx + 1}
                    </div>

                    {/* Category & Question */}
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-slate-300">
                          Pertanyaan
                        </label>
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => handleUpdateQuestion(qIdx, "question", e.target.value)}
                          placeholder="Ketik pertanyaan di sini..."
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-slate-300">
                          Kategori
                        </label>
                        <select
                          value={q.category}
                          onChange={(e) => handleUpdateQuestion(qIdx, "category", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-700"
                        >
                          <option value="TWK">TWK</option>
                          <option value="TIU">TIU</option>
                          <option value="TKP">TKP</option>
                        </select>
                      </div>
                    </div>

                    {/* Options A-E */}
                    <div className="grid grid-cols-5 gap-1">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx}>
                          <label className="block text-[10px] font-medium mb-0.5 text-gray-600 dark:text-slate-400">
                            {opt.id}
                          </label>
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => handleUpdateQuestion(qIdx, `option_${oIdx}_text`, e.target.value)}
                            placeholder="Opsi"
                            className="w-full px-1.5 py-1 text-[11px] border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-700 mb-1"
                          />
                          <input
                            type="number"
                            value={opt.score}
                            onChange={(e) => handleUpdateQuestion(qIdx, `option_${oIdx}_score`, e.target.value)}
                            placeholder="Skor"
                            min="0"
                            max="5"
                            className="w-full px-1.5 py-1 text-[11px] border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-700"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 p-4 flex items-center justify-between">
                <p className="text-xs text-gray-600 dark:text-slate-400">
                  Isi minimal 1 soal dengan pertanyaan, pilihan, dan skor valid
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 text-xs font-medium hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveManualQuestions}
                    className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700"
                  >
                    Simpan soal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL IMPORT JSON PER MODE */}
        {showImportJsonModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full">
              <div className="border-b border-gray-200 dark:border-slate-800 p-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">Import JSON per Mode Simulasi</h2>
                <button
                  onClick={() => setShowImportJsonModal(false)}
                  className="text-2xl text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600 dark:text-slate-300">
                  Pilih mode simulasi dan upload file JSON berisi soal sesuai kategori yang dipilih.
                </p>

                {/* Mode Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-300">
                    Pilih Mode Simulasi:
                  </label>
                  <div className="max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {[
                        { value: "all", label: "Semua (TWK, TIU, TKP)" },
                        { value: "twk", label: "TWK" },
                        { value: "tiu", label: "TIU" },
                        { value: "tkp", label: "TKP" }
                      ].map(mode => (
                        <button
                          key={mode.value}
                          onClick={() => setImportJsonMode(mode.value)}
                          className={`px-4 py-2 rounded-lg border font-medium text-sm transition ${
                            importJsonMode === mode.value
                              ? "bg-blue-600 text-white border-blue-600"
                              : "border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-slate-700 pt-3">
                      <p className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-2">Simulasi Individual:</p>
                      <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                          <button
                            key={`simulasi-${num}`}
                            onClick={() => setImportJsonMode(`simulasi-${num}`)}
                            className={`px-3 py-2 rounded-lg border font-medium text-xs transition ${
                              importJsonMode === `simulasi-${num}`
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                            }`}
                          >
                            S{num}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-xs text-blue-900 dark:text-blue-200">
                    💡 Pilih mode untuk menentukan di mana soal akan disimpan:
                    <br/>
                    • Semua/TWK/TIU/TKP: Disimpan ke Bank Soal Utama (dipakai semua simulasi)
                    <br/>
                    • Tryout 1-10: Disimpan ke penyimpanan khusus tryout tersebut
                  </p>
                </div>

                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-6 text-center">
                  <input
                    ref={jsonFileInputRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={handleJsonFileChange}
                  />
                  <button
                    onClick={handleClickJsonFileInput}
                    className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 text-sm"
                  >
                    📁 Pilih File JSON
                  </button>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                    atau drag & drop file JSON di sini
                  </p>
                </div>

                {/* Format Info */}
                <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-700 dark:text-slate-300 mb-2">Format JSON yang diharapkan:</p>
                  <pre className="text-[10px] bg-white dark:bg-slate-900 p-2 rounded overflow-auto max-h-40">
{`[
  {
    "id": 1,
    "category": "TWK",
    "question": "Pertanyaan di sini?",
    "options": [
      {"id": "A", "text": "Opsi A", "score": 5},
      {"id": "B", "text": "Opsi B", "score": 0},
      ...
    ]
  },
  ...
]`}
                  </pre>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-slate-800 p-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowImportJsonModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL UBAH ROLE */}
        {showChangeRoleModal && selectedUserForRole && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-lg font-bold mb-4">Ubah Role User</h2>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-slate-300 mb-2">
                  <strong>User:</strong> {selectedUserForRole.name} ({selectedUserForRole.email})
                </p>
                <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
                  <strong>Role saat ini:</strong> {selectedUserForRole.role}
                </p>

                <label className="block text-sm font-semibold mb-2">Role baru:</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                >
                  <option value="user">User (Peserta)</option>
                  <option value="admin">Admin (Pengelola)</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowChangeRoleModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 text-sm hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveChangeRole}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
