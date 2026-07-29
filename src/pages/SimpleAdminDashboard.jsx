import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getCurrentUser } from "../utils/auth";
import { getAllQuestionBanks, getQuestionBank, saveQuestionBank } from "../services/questions";
import { listUsers, setUserRole, setUserStatus } from "../services/users";
import { validateQuestionPackage } from "../utils/questionValidation";
import { listPayments } from "../services/payments";
import { getPremiumSettings, setPremiumEnabled } from "../services/settings";
import { getWeeklyTryout, saveWeeklyTryout } from "../services/weeklyTryout";
import { listQuestionReports } from "../services/questionReports";
import { listAllFeedback, updateFeedback } from "../services/feedback";


function normalizeQuestion(question, index) {
  const category = String(question.category || question.tipe || "").toUpperCase();
  const letters = ["A", "B", "C", "D", "E"];
  let options = question.options;
  if (options && !Array.isArray(options)) options = letters.map((id) => ({ id, text: options[id] || "", score: 0 }));
  if (!Array.isArray(options) || options.length !== 5) throw new Error(`Soal ${index + 1}: pilihan jawaban harus A–E.`);
  options = options.map((option, optionIndex) => ({
    ...option,
    id: option.id || letters[optionIndex],
    text: typeof option === "string" ? option : String(option.text || ""),
    image: option?.image || (option?.imageUrl ? { url: option.imageUrl, alt: `Pilihan ${option.id || letters[optionIndex]}` } : undefined),
    score: Number(option.score || 0),
  }));
  if (["TWK", "TIU"].includes(category) && question.correct) options = options.map((option) => ({ ...option, score: option.id === String(question.correct).toUpperCase() ? 5 : 0 }));
  if (category === "TKP" && question.scores) options = options.map((option) => ({ ...option, score: Number(question.scores[option.id] || option.score || 1) }));
  if (!["TWK", "TIU", "TKP"].includes(category)) throw new Error(`Soal ${index + 1}: kategori harus TWK, TIU, atau TKP.`);
  if (!question.question?.trim()) throw new Error(`Soal ${index + 1}: pertanyaan masih kosong.`);
  return {
    ...question,
    id: question.id || Date.now() + index,
    category,
    question: question.question.trim(),
    image: question.image || (question.imageUrl ? { url: question.imageUrl, alt: `Gambar soal ${index + 1}` } : undefined),
    options,
  };
}

export default function SimpleAdminDashboard() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const currentAdmin = getCurrentUser();
  const [tab, setTab] = useState("questions");
  const [target, setTarget] = useState("main");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [payments, setPayments] = useState([]);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [premiumEnabled, setPremiumState] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState("");
  const [weeklySettings, setWeeklySettings] = useState({ enabled: false, title: "Tryout Nasional Mingguan", packageNumber: 1, startAt: "", endAt: "", socialUrl: "", accessCode: "" });
  const [reports, setReports] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [feedbackFilter, setFeedbackFilter] = useState("all");
  const [feedbackDrafts, setFeedbackDrafts] = useState({});
  const [validation, setValidation] = useState(null);

  const [existing, setExisting] = useState([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getQuestionBank(target)
      .then((questions) => { if (active) setExisting(questions); })
      .catch(() => { if (active) setMessage("✕ Bank soal gagal dibaca dari Firebase."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [target]);

  useEffect(() => {
    if (tab !== "users") return;
    setLoading(true);
    listUsers()
      .then(setUsers)
      .catch(() => setMessage("✕ Data pengguna gagal dibaca dari Firebase."))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    if (tab !== "reports") return;
    setLoading(true);
    listQuestionReports().then(setReports).catch((error) => setMessage(`✕ ${error.message}`)).finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    if (tab !== "feedback") return;
    setLoading(true);
    setMessage("");
    listAllFeedback()
      .then(setFeedback)
      .catch((error) => setMessage(`✕ ${error.message || "Kritik dan saran gagal dibaca."}`))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    if (tab !== "payments") return;
    setLoading(true);
    setMessage("");
    listPayments()
      .then(setPayments)
      .catch((error) => setMessage(`✕ ${error.message}`))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    if (tab !== "settings") return;
    setLoading(true);
    setSettingsSaved("");
    setMessage("");
    Promise.allSettled([getPremiumSettings(), getWeeklyTryout()])
      .then(([premiumResult, weeklyResult]) => {
        const errors = [];
        if (premiumResult.status === "fulfilled") {
          setPremiumState(premiumResult.value.enabled);
        } else {
          errors.push("Status premium belum dapat dibaca.");
        }
        if (weeklyResult.status === "fulfilled") {
          const weekly = weeklyResult.value;
          setWeeklySettings((current) => ({ ...current, ...weekly, startAt: weekly.startAt?.slice(0, 16) || "", endAt: weekly.endAt?.slice(0, 16) || "" }));
        } else {
          errors.push(weeklyResult.reason?.message || "Pengaturan Tryout Nasional belum dapat dibaca.");
        }
        if (errors.length) setMessage(`✕ ${errors.join(" ")}`);
      })
      .finally(() => setLoading(false));
  }, [tab]);

  const userRows = useMemo(() => users.filter((user) => {
    if (roleFilter !== "all" && user.role !== roleFilter) return false;
    const query = search.trim().toLowerCase();
    return !query || `${user.name} ${user.email}`.toLowerCase().includes(query);
  }), [users, search, roleFilter]);

  const paymentRows = useMemo(() => payments.filter((payment) => {
    if (paymentFilter !== "all" && payment.status !== paymentFilter) return false;
    const query = paymentSearch.trim().toLowerCase();
    return !query || `${payment.name} ${payment.email} ${payment.orderId}`.toLowerCase().includes(query);
  }), [payments, paymentFilter, paymentSearch]);

  const paidPayments = payments.filter((payment) => payment.status === "paid");

  function premiumUntil(user) {
    if (typeof user?.premiumUntil === "string") return new Date(user.premiumUntil);
    if (user?.premiumUntil?.seconds) return new Date(user.premiumUntil.seconds * 1000);
    return null;
  }

  async function saveWeeklySettings() {
    setLoading(true);
    setSettingsSaved("");
    try {
      await saveWeeklyTryout({
        ...weeklySettings,
        startAt: weeklySettings.startAt ? new Date(weeklySettings.startAt).toISOString() : "",
        endAt: weeklySettings.endAt ? new Date(weeklySettings.endAt).toISOString() : "",
      });
      setSettingsSaved("✓ Pengaturan Tryout Nasional berhasil disimpan.");
    } catch (error) {
      setSettingsSaved(`✕ ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
  }

  function formatRupiah(value) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);
  }

  async function chooseFile(event) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setFile(selected); setMessage(""); setLoading(true);
    try {
      const raw = JSON.parse(await selected.text());
      const list = Array.isArray(raw) ? raw : (raw.questions || raw.soal || raw.data);
      if (!Array.isArray(list) || !list.length) throw new Error("File tidak berisi daftar soal.");
      const cleaned = list.map(normalizeQuestion);
      const report = validateQuestionPackage(cleaned, target);
      setValidation(report);
      if (!report.valid) throw new Error(`File belum lolos validasi (${report.errors.length} masalah).`);
      setPreview(cleaned); setMessage(`✓ ${cleaned.length} soal lolos validasi dan siap diimpor.`);
    } catch (error) {
      setPreview([]); setMessage(`✕ ${error.message}`);
    } finally { setLoading(false); }
  }

  async function importQuestions() {
    if (!preview.length) return;
    setLoading(true);
    try {
      await saveQuestionBank(target, preview);
      setExisting(preview);
      setMessage(`✓ Berhasil. ${preview.length} soal tersimpan di Firebase untuk ${target === "main" ? "bank utama" : `Tryout ${target}`}.`);
      setPreview([]); setFile(null); if (inputRef.current) inputRef.current.value = "";
    } catch (error) {
      setMessage(`✕ ${error.message || "Soal gagal disimpan."}`);
    } finally { setLoading(false); }
  }

  function exportQuestions() {
    const blob = new Blob([JSON.stringify(existing, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url;
    link.download = target === "main" ? "bank-soal-utama.json" : `paket-${target}.json`; link.click(); URL.revokeObjectURL(url);
  }

  async function exportFullBackup() {
    setLoading(true);
    try {
      const exams = await getAllQuestionBanks();
      const payload = { version: 1, exportedAt: new Date().toISOString(), exams };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url;
      link.download = `nalarasn-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url);
      setMessage("✓ Backup seluruh bank soal berhasil diunduh.");
    } catch { setMessage("✕ Backup gagal dibuat."); }
    finally { setLoading(false); }
  }

  async function changeRole(user, role) {
    if (user.id === currentAdmin?.id) return;
    try {
      await setUserRole(user.id, role);
      setUsers((items) => items.map((item) => item.id === user.id ? { ...item, role } : item));
    } catch { window.alert("Role gagal diperbarui."); }
  }

  async function toggleUserStatus(user) {
    if (user.id === currentAdmin?.id) return;
    const next = user.status === "disabled" ? "active" : "disabled";
    if (!window.confirm(`${next === "disabled" ? "Nonaktifkan" : "Aktifkan kembali"} akun ${user.name}?`)) return;
    try {
      await setUserStatus(user.id, next);
      setUsers((items) => items.map((item) => item.id === user.id ? { ...item, status: next } : item));
    } catch { window.alert("Status akun gagal diperbarui."); }
  }

  async function togglePremium() {
    const next = !premiumEnabled;
    setLoading(true);
    setSettingsSaved("");
    try {
      await setPremiumEnabled(next);
      setPremiumState(next);
      setSettingsSaved(next
        ? "✓ Paket premium aktif. Pengguna dapat melakukan pembayaran."
        : "✓ Paket premium nonaktif. Pembelian baru telah dihentikan.");
    } catch {
      setSettingsSaved("✕ Pengaturan premium gagal disimpan.");
    } finally {
      setLoading(false);
    }
  }

  async function saveFeedback(item, status, reply) {
    setLoading(true);
    try {
      await updateFeedback(item.id, { status, reply });
      setFeedback((rows) => rows.map((row) => row.id === item.id ? { ...row, status, reply } : row));
      setMessage("✓ Masukan berhasil diperbarui.");
    } catch (error) {
      setMessage(`✕ ${error.message || "Masukan gagal diperbarui."}`);
    } finally {
      setLoading(false);
    }
  }

  return <div className="app-page min-h-screen bg-slate-50 dark:bg-slate-950"><Navbar />
    <main className="mx-auto max-w-5xl px-4 py-7 sm:py-10">
      <div className="mb-6"><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Panel admin</p><h1 className="mt-1 text-2xl font-bold">Pengelolaan NalarASN</h1><p className="mt-1 text-sm text-slate-500">Kelola bank soal dan pengguna dari satu tempat.</p></div>

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-900">
        <button onClick={() => setTab("questions")} className={`min-w-36 flex-1 rounded-xl px-4 py-3 text-sm font-bold ${tab === "questions" ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>▤ Bank Soal</button>
        <button onClick={() => setTab("users")} className={`min-w-40 flex-1 rounded-xl px-4 py-3 text-sm font-bold ${tab === "users" ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>♙ Data Pengguna <span className="ml-1 rounded-full bg-black/10 px-2 py-0.5 text-[10px]">{users.length}</span></button>
        <button onClick={() => setTab("reports")} className={`min-w-36 flex-1 rounded-xl px-4 py-3 text-sm font-bold ${tab === "reports" ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>⚑ Laporan Soal</button>
        <button onClick={() => setTab("feedback")} className={`min-w-36 flex-1 rounded-xl px-4 py-3 text-sm font-bold ${tab === "feedback" ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>✎ Kritik & Saran <span className="ml-1 rounded-full bg-black/10 px-2 py-0.5 text-[10px]">{feedback.filter((item) => item.status === "new").length}</span></button>
        <button onClick={() => setTab("payments")} className={`min-w-36 flex-1 rounded-xl px-4 py-3 text-sm font-bold ${tab === "payments" ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>◈ Transaksi <span className="ml-1 rounded-full bg-black/10 px-2 py-0.5 text-[10px]">{payments.length}</span></button>
        <button onClick={() => setTab("settings")} className={`min-w-36 flex-1 rounded-xl px-4 py-3 text-sm font-bold ${tab === "settings" ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>⚙ Pengaturan</button>
      </div>

      {tab === "questions" && <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="mb-6 grid gap-4 sm:grid-cols-3"><div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-950/30"><strong className="text-sm text-blue-700 dark:text-blue-300">1. Pilih tujuan</strong><p className="mt-1 text-xs text-slate-500">Bank utama atau paket.</p></div><div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><strong className="text-sm">2. Pilih JSON</strong><p className="mt-1 text-xs text-slate-500">File diperiksa otomatis.</p></div><div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><strong className="text-sm">3. Simpan</strong><p className="mt-1 text-xs text-slate-500">Soal lama akan diganti.</p></div></div>
        <label className="block text-sm font-semibold">Tujuan soal</label><select value={target} onChange={(event) => { setTarget(event.target.value); setPreview([]); setFile(null); setMessage(""); setValidation(null); }} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm dark:border-slate-700 dark:bg-slate-800"><option value="main">Bank latihan utama</option>{Array.from({ length: 10 }, (_, i) => i + 1).map((number) => <option key={number} value={number}>Tryout {number}</option>)}</select>
        <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-300 p-7 text-center dark:border-slate-700"><span className="text-3xl">⇧</span><p className="mt-2 text-sm font-semibold">{file?.name || "Pilih file soal JSON"}</p><p className="mt-1 text-xs text-slate-500">Format array soal atau objek dengan field questions.</p><input ref={inputRef} type="file" accept=".json,application/json" onChange={chooseFile} className="hidden" /><button onClick={() => inputRef.current?.click()} className="mt-4 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:border-blue-500 hover:text-blue-600 dark:border-slate-700">{loading ? "Memeriksa..." : "Pilih file"}</button></div>
        {message && <div className={`mt-4 rounded-xl p-3 text-sm ${message.startsWith("✓") ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"}`}>{message}</div>}
        {validation && !validation.valid && <div className="mt-3 max-h-48 overflow-y-auto rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"><strong>Perbaiki sebelum impor:</strong><ul className="mt-2 list-disc space-y-1 pl-5">{validation.errors.slice(0, 25).map((error) => <li key={error}>{error}</li>)}</ul>{validation.errors.length > 25 && <p className="mt-2 font-semibold">+ {validation.errors.length - 25} masalah lainnya.</p>}</div>}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center"><button disabled={!preview.length || loading} onClick={importQuestions} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{loading ? "Memproses..." : `Simpan ${preview.length || ""} soal`}</button><span className="text-xs text-slate-500">Di Firebase: <strong>{existing.length} soal</strong></span>{existing.length > 0 && <button onClick={exportQuestions} className="text-xs font-semibold text-blue-600 sm:ml-auto">Download paket ini</button>}<button disabled={loading} onClick={exportFullBackup} className="text-xs font-semibold text-blue-600">Backup semua paket</button></div>
      </section>}

      {tab === "users" && <section>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs text-slate-500">Total pengguna</p><strong className="mt-1 block text-2xl">{users.length}</strong></div><div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs text-slate-500">Akun aktif</p><strong className="mt-1 block text-2xl">{users.filter((user) => user.status !== "disabled").length}</strong></div><div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:col-span-1"><p className="text-xs text-slate-500">Administrator</p><strong className="mt-1 block text-2xl">{users.filter((user) => user.role === "admin").length}</strong></div></div>
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau email" className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" /><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"><option value="all">Semua peran</option><option value="user">Pengguna</option><option value="admin">Admin</option></select></div>
        <div className="space-y-3">{userRows.length ? userRows.map((user) => {
          const isSelf = user.id === currentAdmin?.id;
          const expiry = premiumUntil(user);
          const premium = user.role === "admin" || (user.premiumActive && expiry?.getTime() > Date.now());
          return <article key={user.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">{(user.name || user.email).slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-sm font-bold">{user.name || "Tanpa nama"}</h2>{isSelf && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-950/40">Akun Anda</span>}{user.status === "disabled" && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">Nonaktif</span>}<span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${premium ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>{user.role === "admin" ? "Admin" : premium ? "Premium" : "Gratis"}</span></div><p className="truncate text-xs text-slate-500">{user.email}</p><p className="mt-2 text-[11px] text-slate-500">{user.instansi || "Instansi belum diisi"}{expiry && user.role !== "admin" ? ` · Premium sampai ${expiry.toLocaleDateString("id-ID")}` : ""}</p></div></div><div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center"><label className="text-xs text-slate-500">Peran</label><select disabled={isSelf || user.status === "disabled"} value={user.role} onChange={(event) => changeRole(user, event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800"><option value="user">Pengguna</option><option value="admin">Admin</option></select><button disabled={isSelf} onClick={() => toggleUserStatus(user)} className={`rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-30 sm:ml-auto ${user.status === "disabled" ? "border-emerald-200 text-emerald-600" : "border-red-200 text-red-600"}`}>{user.status === "disabled" ? "Aktifkan" : "Nonaktifkan"}</button></div></article>;
        }) : <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">Pengguna tidak ditemukan.</div>}</div>
        <p className="mt-4 text-xs leading-5 text-slate-500">Data ini dibaca langsung dari Firestore. Menonaktifkan profil memblokir akses aplikasi, tetapi penghapusan permanen akun Firebase Auth memerlukan backend admin.</p>
      </section>}
      {tab === "reports" && <section><div className="mb-4"><h2 className="text-lg font-bold">Laporan kualitas soal</h2><p className="mt-1 text-sm text-slate-500">Masukan pengguna untuk membantu proses peninjauan bank soal.</p></div><div className="space-y-3">{loading ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">Memuat laporan...</div> : reports.length ? reports.map((report) => <article key={report.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">{report.category || "SOAL"}</span><span className="text-xs text-slate-400">{report.createdAt ? new Date(report.createdAt).toLocaleString("id-ID") : "-"}</span></div><p className="mt-3 text-sm font-semibold leading-6">{report.question}</p><p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/20 dark:text-red-300">{report.reason}</p><p className="mt-2 text-xs text-slate-400">Pelapor: {report.email || "Pengguna"}</p></article>) : <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">Belum ada laporan soal.</div>}</div></section>}
      {tab === "feedback" && <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-lg font-bold">Kritik & Saran pengguna</h2><p className="mt-1 text-sm text-slate-500">Baca, balas, dan tandai tindak lanjut masukan.</p></div><label className="text-xs font-semibold text-slate-500">Status<select value={feedbackFilter} onChange={(event) => setFeedbackFilter(event.target.value)} className="mt-1 block border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"><option value="all">Semua</option><option value="new">Baru</option><option value="read">Dibaca</option><option value="process">Diproses</option><option value="done">Selesai</option></select></label></div>
        {message && <p className={`mb-4 p-3 text-sm ${message.startsWith("✓") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message}</p>}
        <div className="space-y-3">{loading && !feedback.length ? <div className="border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">Memuat masukan...</div> : feedback.filter((item) => feedbackFilter === "all" || item.status === feedbackFilter).map((item) => <article key={item.id} className="border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">{item.type || "Masukan"}</span><h3 className="font-bold">{item.title}</h3><p className="mt-1 text-xs text-slate-400">{item.anonymous ? "Anonim" : `${item.name || "Pengguna"} · ${item.email || "-"}`} · {item.createdAt ? new Date(item.createdAt).toLocaleString("id-ID") : "-"}</p></div><select value={item.status} onChange={(event) => saveFeedback(item, event.target.value, feedbackDrafts[item.id] ?? item.reply)} className="border border-slate-300 bg-white px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"><option value="new">Baru</option><option value="read">Dibaca</option><option value="process">Diproses</option><option value="done">Selesai</option></select></div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{item.message}</p>
          <textarea rows={3} value={feedbackDrafts[item.id] ?? item.reply ?? ""} onChange={(event) => setFeedbackDrafts({ ...feedbackDrafts, [item.id]: event.target.value })} placeholder="Tulis balasan untuk pengguna..." className="mt-4 w-full border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
          <button disabled={loading} onClick={() => saveFeedback(item, item.status === "new" ? "read" : item.status, feedbackDrafts[item.id] ?? item.reply)} className="mt-2 bg-blue-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Simpan balasan</button>
        </article>)}
        {!loading && !feedback.filter((item) => feedbackFilter === "all" || item.status === feedbackFilter).length && <div className="border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">Belum ada masukan pada status ini.</div>}</div>
      </section>}
      {tab === "payments" && <section>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs text-slate-500">Transaksi berhasil</p><strong className="mt-1 block text-2xl">{paidPayments.length}</strong></div><div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs text-slate-500">Menunggu</p><strong className="mt-1 block text-2xl">{payments.filter((payment) => payment.status === "pending").length}</strong></div><div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:col-span-1"><p className="text-xs text-slate-500">Pendapatan Sandbox</p><strong className="mt-1 block text-xl">{formatRupiah(paidPayments.reduce((total, payment) => total + payment.amount, 0))}</strong></div></div>
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row"><input value={paymentSearch} onChange={(event) => setPaymentSearch(event.target.value)} placeholder="Cari nama, email, atau order ID" className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"/><select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"><option value="all">Semua status</option><option value="paid">Berhasil</option><option value="pending">Menunggu</option></select></div>
        {message && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{message}</div>}
        <div className="space-y-3">{loading ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">Memuat transaksi...</div> : paymentRows.length ? paymentRows.map((payment) => <article key={payment.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{payment.name}</h2><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${payment.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{payment.status === "paid" ? "Berhasil" : "Menunggu"}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800">{payment.environment}</span></div><p className="mt-1 text-xs text-slate-500">{payment.email}</p><p className="mt-2 break-all font-mono text-[10px] text-slate-400">{payment.orderId}</p></div><strong className="text-lg">{formatRupiah(payment.amount)}</strong></div><div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 sm:grid-cols-3"><p>Paket: <strong className="text-slate-700 dark:text-slate-200">{payment.packageNumber || "-"}</strong></p><p>Metode: <strong className="text-slate-700 dark:text-slate-200">{payment.paymentType || "-"}</strong></p><p>Dibuat: <strong className="text-slate-700 dark:text-slate-200">{formatDate(payment.createdAt)}</strong></p>{payment.premiumUntil && <p className="sm:col-span-3">Premium sampai: <strong className="text-emerald-600">{formatDate(payment.premiumUntil)}</strong></p>}</div></article>) : <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">Transaksi tidak ditemukan.</div>}</div>
        <p className="mt-4 text-xs text-slate-500">Nominal Sandbox hanya untuk pengujian dan bukan pendapatan nyata.</p>
      </section>}
      {tab === "settings" && <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Monetisasi</p>
            <h2 className="mt-1 text-xl font-bold">Paket premium</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Aktifkan hanya setelah akun pembayaran siap digunakan. Saat nonaktif, pengguna melihat status “Segera hadir” dan tidak dapat membuat transaksi baru. Masa akses pengguna premium yang sudah aktif tidak dihapus.</p>
          </div>
          <button type="button" role="switch" aria-checked={premiumEnabled} disabled={loading} onClick={togglePremium} className={`relative h-12 w-24 shrink-0 rounded-full p-1 transition disabled:opacity-50 ${premiumEnabled ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"}`}>
            <span className={`grid h-10 w-10 place-items-center rounded-full bg-white text-[10px] font-bold shadow transition ${premiumEnabled ? "translate-x-12 text-emerald-700" : "translate-x-0 text-slate-500"}`}>{premiumEnabled ? "ON" : "OFF"}</span>
          </button>
        </div>
        <div className={`mt-6 rounded-xl border p-4 text-sm ${premiumEnabled ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300" : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300"}`}>
          Status saat ini: <strong>{loading ? "Memuat..." : premiumEnabled ? "Premium aktif" : "Premium nonaktif"}</strong>
        </div>
        {settingsSaved && <p className={`mt-4 rounded-xl p-3 text-sm ${settingsSaved.startsWith("✓") ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"}`}>{settingsSaved}</p>}
        <div className="mt-8 border-t border-slate-200 pt-7 dark:border-slate-800"><p className="text-xs font-bold uppercase tracking-wider text-cyan-600">Agenda Mingguan</p><h2 className="mt-1 text-xl font-bold">Tryout Nasional Gratis</h2><p className="mt-2 text-sm text-slate-500">Atur jadwal, bank soal, kode akses, dan tautan media sosial tanpa mengubah kode aplikasi.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Nama agenda<input value={weeklySettings.title} onChange={(event) => setWeeklySettings({...weeklySettings, title:event.target.value})} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal dark:border-slate-700 dark:bg-slate-800"/></label><label className="text-sm font-semibold">Gunakan bank Tryout<select value={weeklySettings.packageNumber} onChange={(event) => setWeeklySettings({...weeklySettings, packageNumber:Number(event.target.value)})} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal dark:border-slate-700 dark:bg-slate-800">{Array.from({length:10},(_,i)=>i+1).map(number=><option key={number} value={number}>Tryout {number}</option>)}</select></label><label className="text-sm font-semibold">Mulai<input type="datetime-local" value={weeklySettings.startAt} onChange={(event) => setWeeklySettings({...weeklySettings, startAt:event.target.value})} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal dark:border-slate-700 dark:bg-slate-800"/></label><label className="text-sm font-semibold">Berakhir<input type="datetime-local" value={weeklySettings.endAt} onChange={(event) => setWeeklySettings({...weeklySettings, endAt:event.target.value})} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal dark:border-slate-700 dark:bg-slate-800"/></label><label className="text-sm font-semibold">Kode akses<input value={weeklySettings.accessCode || ""} onChange={(event) => setWeeklySettings({...weeklySettings, accessCode:event.target.value.toUpperCase()})} placeholder="Contoh: NALAR-MINGGU" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal uppercase dark:border-slate-700 dark:bg-slate-800"/></label><label className="text-sm font-semibold">Tautan media sosial<input type="url" value={weeklySettings.socialUrl || ""} onChange={(event) => setWeeklySettings({...weeklySettings, socialUrl:event.target.value})} placeholder="https://instagram.com/..." className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal dark:border-slate-700 dark:bg-slate-800"/></label></div><label className="mt-5 flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={weeklySettings.enabled} onChange={(event) => setWeeklySettings({...weeklySettings, enabled:event.target.checked})} className="h-5 w-5 rounded"/>Tampilkan Tryout Nasional kepada pengguna</label><button disabled={loading} onClick={saveWeeklySettings} className="mt-5 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">Simpan Tryout Nasional</button></div>
      </section>}
      <button onClick={() => navigate("/dashboard")} className="mt-5 text-sm font-semibold text-slate-500 hover:text-blue-600">← Beranda</button>
    </main>
  </div>;
}
