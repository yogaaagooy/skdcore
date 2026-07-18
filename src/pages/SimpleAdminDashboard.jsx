import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const MAIN_KEY = "skdcore_question_bank_v1";

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
  const [target, setTarget] = useState("main");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const storageKey = target === "main" ? MAIN_KEY : `skdcore_simulasi_${target}_questions_v1`;
  const existing = useMemo(() => { try { const value=JSON.parse(localStorage.getItem(storageKey)||"[]"); return Array.isArray(value)?value:[]; } catch { return []; } }, [storageKey, message]);

  async function chooseFile(event) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setFile(selected); setMessage(""); setLoading(true);
    try { const raw=JSON.parse(await selected.text()); const list=Array.isArray(raw)?raw:(raw.questions||raw.soal||raw.data); if(!Array.isArray(list)||!list.length) throw new Error("File tidak berisi daftar soal."); const cleaned=list.map(normalizeQuestion); setPreview(cleaned); setMessage(`✓ ${cleaned.length} soal siap diimpor.`); }
    catch(error){ setFile(null);setPreview([]);setMessage(`✕ ${error.message}`); }
    finally{setLoading(false);}
  }

  function importQuestions() { if(!preview.length)return; localStorage.setItem(storageKey,JSON.stringify(preview)); setMessage(`✓ Berhasil. ${preview.length} soal menggantikan isi ${target === "main" ? "bank utama" : `Paket ${target}`}.`); setPreview([]);setFile(null);if(inputRef.current)inputRef.current.value=""; }
  function exportQuestions(){ const blob=new Blob([JSON.stringify(existing,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=target==="main"?"bank-soal-utama.json":`paket-${target}.json`;link.click();URL.revokeObjectURL(url); }

  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"><Navbar/><main className="mx-auto max-w-3xl px-4 py-7 sm:py-10">
    <div className="mb-6"><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Panel admin</p><h1 className="mt-1 text-2xl font-bold">Import soal</h1><p className="mt-1 text-sm text-slate-500">Tiga langkah: pilih tujuan, pilih file JSON, lalu simpan.</p></div>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <div className="mb-6 grid gap-4 sm:grid-cols-3"><div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-950/30"><strong className="text-sm text-blue-700 dark:text-blue-300">1. Pilih tujuan</strong><p className="mt-1 text-xs text-slate-500">Bank utama atau paket.</p></div><div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><strong className="text-sm">2. Pilih JSON</strong><p className="mt-1 text-xs text-slate-500">File diperiksa otomatis.</p></div><div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><strong className="text-sm">3. Simpan</strong><p className="mt-1 text-xs text-slate-500">Soal lama akan diganti.</p></div></div>
      <label className="block text-sm font-semibold">Tujuan soal</label><select value={target} onChange={event=>{setTarget(event.target.value);setPreview([]);setFile(null);setMessage("");}} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm dark:border-slate-700 dark:bg-slate-800"><option value="main">Bank soal utama</option>{Array.from({length:10},(_,i)=>i+1).map(number=><option key={number} value={number}>Paket Simulasi {number}</option>)}</select>
      <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-300 p-7 text-center dark:border-slate-700"><span className="text-3xl">⇧</span><p className="mt-2 text-sm font-semibold">{file?.name || "Pilih file soal JSON"}</p><p className="mt-1 text-xs text-slate-500">Format array soal atau objek dengan field questions.</p><input ref={inputRef} type="file" accept=".json,application/json" onChange={chooseFile} className="hidden"/><button onClick={()=>inputRef.current?.click()} className="mt-4 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:border-blue-500 hover:text-blue-600 dark:border-slate-700">{loading?"Memeriksa...":"Pilih file"}</button></div>
      {message&&<div className={`mt-4 rounded-xl p-3 text-sm ${message.startsWith("✓")?"bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300":"bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"}`}>{message}</div>}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center"><button disabled={!preview.length} onClick={importQuestions} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Simpan {preview.length||""} soal</button><span className="text-xs text-slate-500">Saat ini: <strong>{existing.length} soal</strong></span>{existing.length>0&&<button onClick={exportQuestions} className="text-xs font-semibold text-blue-600 sm:ml-auto">Download cadangan</button>}</div>
    </section>
    <button onClick={()=>navigate("/dashboard")} className="mt-5 text-sm font-semibold text-slate-500 hover:text-blue-600">← Kembali ke beranda</button>
  </main></div>;
}
