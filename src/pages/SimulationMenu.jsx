import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const modes = [
  { id: "all", label: "SKD Lengkap", detail: "110 soal · 100 menit", description: "TWK, TIU, dan TKP dalam satu sesi.", color: "blue" },
  { id: "twk", label: "TWK", detail: "30 soal · latihan 27 menit", description: "Tes Wawasan Kebangsaan.", color: "emerald" },
  { id: "tiu", label: "TIU", detail: "35 soal · latihan 32 menit", description: "Tes Intelegensia Umum.", color: "violet" },
  { id: "tkp", label: "TKP", detail: "45 soal · latihan 41 menit", description: "Tes Karakteristik Pribadi.", color: "amber" },
];

export default function SimulationMenu() {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
    <Navbar />
    <main className="mx-auto max-w-5xl px-4 py-7 sm:py-10">
      <div className="mb-6"><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Pilih simulasi</p><h1 className="mt-1 text-2xl font-bold">Mau latihan apa hari ini?</h1><p className="mt-1 text-sm text-slate-500">Format BKN: 30 TWK, 35 TIU, dan 45 TKP dalam 100 menit. Waktu mode per bidang merupakan pembagian waktu latihan.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        {modes.map((mode) => <article key={mode.id} className={`rounded-2xl border bg-white p-5 dark:bg-slate-900 ${mode.id === "all" ? "border-blue-400 shadow-md shadow-blue-100 dark:shadow-none" : "border-slate-200 dark:border-slate-800"}`}>
          <div className="flex items-start justify-between"><div><span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${mode.id === "all" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{mode.id === "all" ? "Direkomendasikan" : "Latihan bidang"}</span><h2 className="mt-3 text-xl font-bold">{mode.label}</h2><p className="mt-1 text-sm text-slate-500">{mode.description}</p></div><span className="text-2xl text-blue-600">▣</span></div>
          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800"><span className="text-xs font-semibold text-slate-500">{mode.detail}</span><button onClick={() => navigate(`/simulasi/${mode.id}`)} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">Pilih & mulai →</button></div>
        </article>)}
      </div>
      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="text-sm font-bold">Paket soal 1–10</h2><p className="mt-1 text-xs text-slate-500">Gunakan jika admin sudah mengisi paket soal khusus.</p><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">{Array.from({length:10},(_,i)=>i+1).map(number=><button key={number} onClick={()=>navigate(`/simulasi/sim/${number}`)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold hover:border-blue-500 hover:text-blue-600 dark:border-slate-700">Paket {number}</button>)}</div></section>
    </main>
  </div>;
}
