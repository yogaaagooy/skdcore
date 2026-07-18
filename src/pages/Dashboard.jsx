import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../utils/auth";
import "./Dashboard.css";

const HISTORY_KEY = "skdcore_simulasi_history_v1";
const MAX_ATTEMPTS = 3;

const modes = [
  { id: "twk", label: "TWK", title: "Tes Wawasan Kebangsaan", questions: 28, minutes: 28, icon: "◆", tone: "green" },
  { id: "tiu", label: "TIU", title: "Tes Intelegensia Umum", questions: 32, minutes: 32, icon: "✦", tone: "purple" },
  { id: "tkp", label: "TKP", title: "Tes Karakteristik Pribadi", questions: 41, minutes: 41, icon: "●", tone: "orange" },
];

const navItems = [
  { label: "Dashboard", icon: "⌂", path: "/dashboard" },
  { label: "Simulasi", icon: "▣", path: "/simulasi" },
  { label: "Riwayat", icon: "◷", path: "/hasil-simulasi" },
  { label: "Peringkat", icon: "♛", path: "/leaderboard" },
];

function readHistory(user) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return user.role === "admin" ? parsed : parsed.filter((item) => !item.userEmail || item.userEmail === user.email);
  } catch {
    return [];
  }
}

function initials(user) {
  const source = user?.name || user?.email || "SK";
  return source.split(/[\s@]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user] = useState(() => getCurrentUser());
  const [history, setHistory] = useState([]);
  const [dark, setDark] = useState(() => window.localStorage.getItem("skdcore_theme") === "dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedMode, setSelectedMode] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    setHistory(readHistory(user));
  }, [navigate, user]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    window.localStorage.setItem("skdcore_theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const averages = useMemo(() => {
    if (!history.length) return { TWK: 0, TIU: 0, TKP: 0 };
    const sums = history.reduce((acc, item) => ({
      TWK: acc.TWK + (item.result?.TWK || 0),
      TIU: acc.TIU + (item.result?.TIU || 0),
      TKP: acc.TKP + (item.result?.TKP || 0),
    }), { TWK: 0, TIU: 0, TKP: 0 });
    return Object.fromEntries(Object.entries(sums).map(([key, value]) => [key, Math.round(value / history.length)]));
  }, [history]);

  const lastResult = history[0];
  const fullAttempts = history.filter((item) => (item.mode || "all") === "all" && !item.simulasi_num).length;
  const attemptsLeft = user?.role === "admin" ? "∞" : Math.max(0, MAX_ATTEMPTS - fullAttempts);
  const totalScore = lastResult ? (lastResult.result?.TWK || 0) + (lastResult.result?.TIU || 0) + (lastResult.result?.TKP || 0) : 0;

  const searchResults = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];
    return [
      ...navItems,
      ...modes.map((mode) => ({ label: `Simulasi ${mode.label}`, mode })),
      { label: "Simulasi SKD Lengkap", mode: { id: "all", label: "SKD Lengkap", title: "Simulasi SKD Lengkap", questions: 110, minutes: 100 } },
      ...(user?.role === "admin" ? [{ label: "Bank Soal & Admin", path: "/admin" }] : []),
    ].filter((item) => item.label.toLowerCase().includes(value)).slice(0, 6);
  }, [query, user]);

  if (!user) return null;

  const fullMode = { id: "all", label: "SKD Lengkap", title: "Simulasi SKD Lengkap", questions: 110, minutes: 100 };

  function openResult(item) {
    setQuery("");
    if (item.mode) setSelectedMode(item.mode);
    else navigate(item.path);
  }

  function startSimulation() {
    if (!selectedMode) return;
    const used = history.filter((item) => (item.mode || "all") === selectedMode.id && !item.simulasi_num).length;
    if (user.role !== "admin" && used >= MAX_ATTEMPTS) {
      setSelectedMode(null);
      setToast(`Kesempatan mode ${selectedMode.label} sudah habis.`);
      return;
    }
    navigate(selectedMode.id === "all" ? "/simulasi" : `/simulasi/${selectedMode.id}`);
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="skd-dashboard">
      <aside className={`skd-sidebar ${sidebarOpen ? "open" : ""}`}>
        <button className="skd-brand" onClick={() => navigate("/dashboard")}>
          <span className="skd-brand-mark">S</span><strong>SKD<span>Core</span></strong>
        </button>
        <nav>
          {navItems.map((item, index) => (
            <button key={item.label} className={index === 0 ? "active" : ""} onClick={() => { setSidebarOpen(false); navigate(item.path); }}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
          {user.role === "admin" && <button onClick={() => navigate("/admin")}><span>⚙</span>Bank Soal</button>}
        </nav>
        <div className="skd-help">
          <span>?</span><strong>Butuh bantuan?</strong>
          <p>Pelajari aturan nilai dan cara mengerjakan simulasi.</p>
          <button onClick={() => setToast("Panduan SKDCore akan segera tersedia.")}>Buka panduan →</button>
        </div>
      </aside>

      {sidebarOpen && <button className="skd-overlay" aria-label="Tutup menu" onClick={() => setSidebarOpen(false)} />}

      <main className="skd-main">
        <header className="skd-topbar">
          <button className="skd-menu" aria-label="Buka menu" onClick={() => setSidebarOpen(true)}>☰</button>
          <div className="skd-search">
            <span>⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari simulasi, riwayat, atau fitur" />
            {query && <div className="skd-search-results">
              {searchResults.length ? searchResults.map((item) => <button key={item.label} onClick={() => openResult(item)}>{item.label}<span>→</span></button>) : <p>Tidak ada hasil ditemukan.</p>}
            </div>}
          </div>
          <div className="skd-top-actions">
            <button className="skd-icon-button" aria-label="Ganti tema" onClick={() => setDark((value) => !value)}>{dark ? "☀" : "☾"}</button>
            <div className="skd-profile-wrap">
              <button className="skd-profile" onClick={() => setProfileOpen((value) => !value)}>
                <span>{initials(user)}</span><div><strong>{user.name || "Peserta SKD"}</strong><small>{user.role === "admin" ? "Administrator" : "Peserta"}</small></div><b>⌄</b>
              </button>
              {profileOpen && <div className="skd-profile-menu">
                <button onClick={() => navigate("/profile")}>Edit profil</button>
                {user.role === "admin" && <button onClick={() => navigate("/admin")}>Admin panel</button>}
                <button className="danger" onClick={handleLogout}>Keluar</button>
              </div>}
            </div>
          </div>
        </header>

        <div className="skd-content">
          <section className="skd-welcome">
            <div><p className="skd-eyebrow">DASHBOARD PESERTA</p><h1>Halo, {user.name?.split(" ")[0] || "Pejuang CPNS"}! <span>👋</span></h1><p>Siapkan hasil terbaikmu lewat latihan yang konsisten dan terukur.</p></div>
            <div className="skd-date">● Data tersimpan otomatis di perangkat ini</div>
          </section>

          <section className="skd-hero">
            <div className="skd-hero-copy">
              <span className="skd-hero-badge">SIMULASI UTAMA</span>
              <h2>Simulasi SKD Lengkap</h2>
              <p>Kerjakan TWK, TIU, dan TKP dalam satu sesi dengan waktu dan penilaian menyerupai CAT BKN.</p>
              <div className="skd-hero-meta"><span>▤ <b>110</b> soal</span><span>◷ <b>100</b> menit</span><span>◎ Passing grade</span></div>
              <button className="skd-primary" onClick={() => setSelectedMode(fullMode)}>Mulai simulasi <span>→</span></button>
            </div>
            <div className="skd-hero-visual"><div className="skd-ring"><span>{attemptsLeft}</span><small>kesempatan</small></div><i className="orb-one" /><i className="orb-two" /></div>
          </section>

          <section className="skd-stats">
            <article><span className="blue">◉</span><div><small>Total simulasi</small><strong>{history.length}<em> sesi</em></strong></div></article>
            <article><span className="green">✓</span><div><small>Nilai terakhir</small><strong>{totalScore || "—"}<em>{lastResult ? " poin" : " belum ada"}</em></strong></div></article>
            <article><span className="orange">⚡</span><div><small>Kesempatan penuh</small><strong>{attemptsLeft}<em>{user.role === "admin" ? " tanpa batas" : ` dari ${MAX_ATTEMPTS}`}</em></strong></div></article>
          </section>

          <section className="skd-section-head"><div><h2>Latihan per bidang</h2><p>Fokuskan latihan pada materi yang perlu ditingkatkan.</p></div><button onClick={() => navigate("/simulasi")}>Lihat semua →</button></section>
          <section className="skd-mode-grid">
            {modes.map((mode) => (
              <article key={mode.id} className={`skd-mode-card ${mode.tone}`}>
                <div className="skd-mode-icon">{mode.icon}</div><span className="skd-mode-tag">{mode.label}</span>
                <h3>{mode.title}</h3><p>{mode.questions} soal · {mode.minutes} menit</p>
                <div className="skd-mode-score"><small>Rata-rata nilai</small><strong>{averages[mode.label] || 0}</strong></div>
                <button onClick={() => setSelectedMode(mode)}>Mulai latihan <span>→</span></button>
              </article>
            ))}
          </section>

          <section className="skd-bottom-grid">
            <article className="skd-history-card">
              <div className="skd-card-head"><div><h2>Riwayat terbaru</h2><p>Hasil simulasi terakhir kamu.</p></div><button onClick={() => navigate("/hasil-simulasi")}>Lihat detail</button></div>
              {history.length ? history.slice(0, 3).map((item) => <div className="skd-history-row" key={item.id || item.date}>
                <span className="skd-history-icon">▣</span><div><strong>{item.mode === "all" || !item.mode ? "Simulasi SKD Lengkap" : `Latihan ${String(item.mode).toUpperCase()}`}</strong><small>{new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</small></div>
                <div className="skd-history-score"><strong>{(item.result?.TWK || 0) + (item.result?.TIU || 0) + (item.result?.TKP || 0)}</strong><small>poin</small></div>
              </div>) : <div className="skd-empty"><span>◎</span><p>Belum ada riwayat. Mulai simulasi pertamamu.</p></div>}
            </article>
            <article className="skd-progress-card"><h2>Ringkasan kemampuan</h2><p>Rata-rata berdasarkan seluruh latihan.</p>{modes.map((mode) => <div className="skd-progress" key={mode.id}><div><span>{mode.label}</span><strong>{averages[mode.label] || 0}</strong></div><i><b className={mode.tone} style={{ width: `${Math.min(100, ((averages[mode.label] || 0) / (mode.id === "tkp" ? 225 : 175)) * 100)}%` }} /></i></div>)}</article>
          </section>
        </div>
      </main>

      {selectedMode && <div className="skd-modal-backdrop" role="presentation" onClick={() => setSelectedMode(null)}>
        <div className="skd-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
          <button className="skd-modal-close" aria-label="Tutup" onClick={() => setSelectedMode(null)}>×</button><span className="skd-modal-icon">▶</span>
          <h2>Mulai {selectedMode.label}?</h2><p>Timer berjalan setelah halaman soal dibuka. Jawaban dan sisa waktu akan tersimpan otomatis.</p>
          <div><span>{selectedMode.questions} soal</span><span>{selectedMode.minutes} menit</span></div>
          <button className="skd-primary" onClick={startSimulation}>Ya, mulai sekarang</button><button className="skd-cancel" onClick={() => setSelectedMode(null)}>Nanti dulu</button>
        </div>
      </div>}
      {toast && <div className="skd-toast">{toast}</div>}
    </div>
  );
}
