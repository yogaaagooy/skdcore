import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getCurrentUser } from "../utils/auth";
import { getAllQuestionBanks, getQuestionBank, saveQuestionBank } from "../services/questions";
import { listUsers, setUserRole, setUserStatus } from "../services/users";
import { validateQuestionPackage } from "../utils/questionValidation";


function normalizeQuestion(question, index) {
  const category = String(question.category || question.tipe || "").toUpperCase();
  const letters = ["A", "B", "C", "D", "E"];
  let options = question.options;
  if (options && !Array.isArray(options)) options = letters.map((id) => ({ id, text: options[id] || "", score: 0 }));
  if (!Array.isArray(options) || options.length !== 5) throw new Error(`Soal ${index + 1}: pilihan jawaban harus A–E.`);
  options = options.map((option, optionIndex) => ({ id: option.id || letters[optionIndex], text: option.text || String(option), score: Number(option.score || 0) }));
  if (["TWK", "TIU"].includes(category) && question.correct) options = options.map((option) => ({ ...option, score: option.id === String(question.correct).toUpperCase() ? 5 : 0 }));
  if (category === "TKP" && question.scores) options = options.map((option) => ({ ...option, score: Number(question.scores[option.id] || option.score || 1) }));
  if (!["TWK", "TIU", "TKP"].includes(category)) throw new Error(`Soal ${index + 1}: kategori harus TWK, TIU, atau TKP.`);
  if (!question.question?.trim()) throw new Error(`Soal ${index + 1}: pertanyaan masih kosong.`);
  return { ...question, id: question.id || Date.now() + index, category, question: question.question.trim(), options };
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

  const userRows = useMemo(() => users.filter((user) => {
    if (roleFilter !== "all" && user.role !== roleFilter) return false;
    const query = search.trim().toLowerCase();
    return !query || `${user.name} ${user.email}`.toLowerCase().includes(query);
  }), [users, history, search, roleFilter]);

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
      setMessage(`✓ Berhasil. ${preview.length} soal tersimpan di Firebase untuk ${target === "main" ? "bank utama" : `Paket ${target}`}.`);
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
      link.download = `skdcore-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url);
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

  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"><Navbar />
    <main className="mx-auto max-w-5xl px-4 py-7 sm:py-10">
      <div className="mb-6"><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Panel admin</p><h1 className="mt-1 text-2xl font-bold">Pengelolaan SKDCore</h1><p className="mt-1 text-sm text-slate-500">Kelola bank soal dan pengguna dari satu tempat.</p></div>

      <div className="mb-6 flex gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-900">
        <button onClick={() => setTab("questions")} className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold ${tab === "questions" ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>▤ Bank Soal</button>
        <button onClick={() => setTab("users")} className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold ${tab === "users" ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>♙ Data Pengguna <span className="ml-1 rounded-full bg-black/10 px-2 py-0.5 text-[10px]">{users.length}</span></button>
      </div>

      {tab === "questions" && <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="mb-6 grid gap-4 sm:grid-cols-3"><div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-950/30"><strong className="text-sm text-blue-700 dark:text-blue-300">1. Pilih tujuan</strong><p className="mt-1 text-xs text-slate-500">Bank utama atau paket.</p></div><div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><strong className="text-sm">2. Pilih JSON</strong><p className="mt-1 text-xs text-slate-500">File diperiksa otomatis.</p></div><div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><strong className="text-sm">3. Simpan</strong><p className="mt-1 text-xs text-slate-500">Soal lama akan diganti.</p></div></div>
        <label className="block text-sm font-semibold">Tujuan soal</label><select value={target} onChange={(event) => { setTarget(event.target.value); setPreview([]); setFile(null); setMessage(""); setValidation(null); }} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm dark:border-slate-700 dark:bg-slate-800"><option value="main">Bank soal utama</option>{Array.from({ length: 10 }, (_, i) => i + 1).map((number) => <option key={number} value={number}>Paket Simulasi {number}</option>)}</select>
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
          return <article key={user.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">{(user.name || user.email).slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-sm font-bold">{user.name || "Tanpa nama"}</h2>{isSelf && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-950/40">Akun Anda</span>}{user.status === "disabled" && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">Nonaktif</span>}</div><p className="truncate text-xs text-slate-500">{user.email}</p><p className="mt-2 text-[11px] text-slate-500">{user.instansi || "Instansi belum diisi"}</p></div></div><div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center"><label className="text-xs text-slate-500">Peran</label><select disabled={isSelf || user.status === "disabled"} value={user.role} onChange={(event) => changeRole(user, event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800"><option value="user">Pengguna</option><option value="admin">Admin</option></select><button disabled={isSelf} onClick={() => toggleUserStatus(user)} className={`rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-30 sm:ml-auto ${user.status === "disabled" ? "border-emerald-200 text-emerald-600" : "border-red-200 text-red-600"}`}>{user.status === "disabled" ? "Aktifkan" : "Nonaktifkan"}</button></div></article>;
        }) : <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">Pengguna tidak ditemukan.</div>}</div>
        <p className="mt-4 text-xs leading-5 text-slate-500">Data ini dibaca langsung dari Firestore. Menonaktifkan profil memblokir akses aplikasi, tetapi penghapusan permanen akun Firebase Auth memerlukan backend admin.</p>
      </section>}
      <button onClick={() => navigate("/dashboard")} className="mt-5 text-sm font-semibold text-slate-500 hover:text-blue-600">← Beranda</button>
    </main>
  </div>;
}
