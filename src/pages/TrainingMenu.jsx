import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const modes = [
  { id: "twk", label: "Latihan TWK", description: "Pahami penerapan wawasan kebangsaan melalui soal berbasis konteks.", detail: "30 soal · 25 menit", icon: "🇮🇩" },
  { id: "tiu", label: "Latihan TIU", description: "Asah kemampuan verbal, numerik, dan penalaran secara bertahap.", detail: "35 soal · 30 menit", icon: "∑" },
  { id: "tkp", label: "Latihan TKP", description: "Latih cara menilai respons paling efektif dalam situasi kerja.", detail: "45 soal · 35 menit", icon: "◎" },
  { id: "all", label: "Latihan Campuran", description: "Gabungkan TWK, TIU, dan TKP dalam satu sesi latihan.", detail: "110 soal · 100 menit", icon: "▤" },
];

export default function TrainingMenu() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [studyMode, setStudyMode] = useState("learn");

  function begin() {
    if (!selected) return;
    navigate(`/simulasi/${selected.id}?type=${studyMode}`);
  }

  return <div className="app-page min-h-screen bg-slate-50 dark:bg-slate-950"><Navbar />
    <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
      <div className="mb-6"><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Latihan</p><h1 className="mt-1 text-2xl font-bold">Bangun kemampuan secara bertahap</h1><p className="mt-1 text-sm text-slate-500">Pilih bidang dan gunakan mode belajar untuk melihat penjelasan langsung.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        {modes.map((mode) => <button key={mode.id} onClick={() => setSelected(mode)} className="group rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-xl font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">{mode.icon}</span><span><strong className="text-lg">{mode.label}</strong><span className="mt-1 block text-sm leading-6 text-slate-500">{mode.description}</span><small className="mt-3 block font-semibold text-blue-600">{mode.detail} →</small></span></div>
        </button>)}
      </div>
      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="font-bold">Belajar dari kesalahan</h2><p className="mt-1 text-sm text-slate-500">Jawaban yang belum tepat otomatis disimpan agar bisa dipelajari kembali.</p><button onClick={() => navigate("/buku-kesalahan")} className="mt-4 rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950/30">Buka buku kesalahan</button></section>
    </main>
    {selected && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}><section className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900" onClick={(event) => event.stopPropagation()}><h2 className="text-xl font-bold">{selected.label}</h2><p className="mt-1 text-sm text-slate-500">{selected.detail}</p><div className="mt-5 grid gap-2"><button onClick={() => setStudyMode("learn")} className={`rounded-xl border p-4 text-left ${studyMode === "learn" ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-slate-200 dark:border-slate-700"}`}><strong className="text-sm">Mode Belajar</strong><span className="mt-1 block text-xs text-slate-500">Lihat jawaban terbaik dan pembahasan setelah menjawab.</span></button><button onClick={() => setStudyMode("exam")} className={`rounded-xl border p-4 text-left ${studyMode === "exam" ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-slate-200 dark:border-slate-700"}`}><strong className="text-sm">Mode Ujian</strong><span className="mt-1 block text-xs text-slate-500">Timer aktif dan pembahasan tampil setelah sesi selesai.</span></button></div><div className="mt-6 grid grid-cols-2 gap-2"><button onClick={() => setSelected(null)} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold dark:border-slate-700">Batal</button><button onClick={begin} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">Mulai latihan</button></div></section></div>}
  </div>;
}
