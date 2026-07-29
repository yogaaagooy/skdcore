import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import QuestionMedia from "../components/QuestionMedia";
import { clearWrongAnswers, getWrongAnswers } from "../services/wrongAnswers";

export default function WrongAnswers() {
  const [items, setItems] = useState(() => getWrongAnswers());
  const [filter, setFilter] = useState("all");
  const visible = useMemo(
    () => filter === "all" ? items : items.filter((item) => item.category === filter),
    [items, filter]
  );

  function clearAll() {
    if (!window.confirm("Hapus seluruh catatan kesalahan?")) return;
    clearWrongAnswers();
    setItems([]);
  }

  return (
    <div className="app-page min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Buku Kesalahan</p>
            <h1 className="mt-1 text-2xl font-bold">Pelajari kembali jawaban yang belum tepat</h1>
            <p className="mt-1 text-sm text-slate-500">{items.length} soal tersimpan pada perangkat ini.</p>
          </div>
          {items.length > 0 && <button onClick={clearAll} className="text-sm font-semibold text-red-600">Hapus semua</button>}
        </div>

        <div className="my-5 flex gap-2 overflow-x-auto">
          {["all", "TWK", "TIU", "TKP"].map((value) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-2 text-xs font-bold ${filter === value ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"}`}
            >
              {value === "all" ? "Semua" : value}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {visible.length ? visible.map((item, index) => {
            const best = Math.max(0, ...item.options.map((option) => Number(option.score || 0)));
            return (
              <article key={`${item.category}-${item.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">{item.category}</span>
                  <span className="text-xs text-slate-400">Catatan {index + 1}</span>
                </div>
                <h2 className="mt-3 whitespace-pre-line text-sm font-semibold leading-6">{item.question}</h2>
                <QuestionMedia image={item.image || item.imageUrl} alt={`Gambar catatan soal ${index + 1}`} compact className="mt-3" />
                {item.figure && (
                  <pre className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-center font-mono text-xs dark:border-slate-700 dark:bg-slate-950">
                    {item.figure}
                  </pre>
                )}
                <div className="mt-3 space-y-2">
                  {item.options.map((option) => {
                    const isBest = Number(option.score || 0) === best;
                    const isSelected = option.id === item.selectedId;
                    return (
                      <div
                        key={option.id}
                        className={`rounded-xl border px-3 py-2 text-sm ${isBest ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20" : isSelected ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20" : "border-slate-200 dark:border-slate-700"}`}
                      >
                        <strong>{option.id}.</strong> {option.text}
                        <QuestionMedia image={option.image || option.imageUrl} alt={`Pilihan ${option.id}`} compact className="mt-2" />
                        {isBest && <small className="ml-2 font-bold text-emerald-700">Jawaban terbaik</small>}
                      </div>
                    );
                  })}
                </div>
                {item.explanation && (
                  <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                    <strong>Pembahasan:</strong> {item.explanation}
                  </p>
                )}
              </article>
            );
          }) : (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center dark:border-slate-800 dark:bg-slate-900">
              <span className="text-4xl">◎</span>
              <h2 className="mt-3 font-bold">Belum ada soal tersimpan</h2>
              <p className="mt-1 text-sm text-slate-500">Soal yang belum tepat akan otomatis muncul di sini setelah latihan.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
