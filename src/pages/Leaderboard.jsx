import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { getCurrentUser } from "../utils/auth";
import { getPackageLeaderboard } from "../services/results";

export default function Leaderboard() {
  const currentUser = getCurrentUser();
  const [simulation, setSimulation] = useState("1");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getPackageLeaderboard(simulation)
      .then((data) => { if (active) setRows(data); })
      .catch(() => { if (active) setRows([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [simulation]);

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return !query ? rows : rows.filter((item) => (item.name || "").toLowerCase().includes(query));
  }, [rows, search]);
  const rankLabel = (rank) => rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank;

  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"><Navbar />
    <main className="mx-auto max-w-6xl px-4 py-7 sm:py-10">
      <div className="mb-6"><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Peringkat</p><h1 className="mt-1 text-2xl font-bold">Peringkat per simulasi</h1><p className="mt-1 text-sm text-slate-500">Nilai terbaik peserta yang tersimpan di Firebase.</p></div>
      <section className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[220px_1fr]"><div><label className="mb-2 block text-xs font-semibold text-slate-500">Pilih simulasi</label><select value={simulation} onChange={(event) => setSimulation(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold dark:border-slate-700 dark:bg-slate-800">{Array.from({ length: 10 }, (_, index) => index + 1).map((number) => <option value={number} key={number}>Simulasi {number}</option>)}</select></div><div><label className="mb-2 block text-xs font-semibold text-slate-500">Cari peserta</label><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama peserta" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" /></div></section>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800"><h2 className="font-bold">Simulasi {simulation}</h2><p className="mt-1 text-xs text-slate-500">{loading ? "Memuat data..." : `${rows.length} peserta memiliki hasil.`}</p></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800"><tr><th className="px-4 py-4 text-center">Rank</th><th className="px-4 py-4 text-left">Nama</th><th className="px-4 py-4 text-center">TIU</th><th className="px-4 py-4 text-center">TWK</th><th className="px-4 py-4 text-center">TKP</th><th className="px-4 py-4 text-center">Total</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{visibleRows.length ? visibleRows.map((item) => { const rank = rows.findIndex((row) => row.id === item.id) + 1; const isCurrent = item.userId === currentUser?.id; return <tr key={item.id} className={isCurrent ? "bg-blue-50/70 dark:bg-blue-950/20" : ""}><td className="px-4 py-4 text-center text-lg font-bold">{rankLabel(rank)}</td><td className="px-4 py-4"><strong>{item.name || "Peserta"}</strong>{isCurrent && <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">Anda</span>}</td><td className="px-4 py-4 text-center font-semibold">{item.scores?.TIU || 0}</td><td className="px-4 py-4 text-center font-semibold">{item.scores?.TWK || 0}</td><td className="px-4 py-4 text-center font-semibold">{item.scores?.TKP || 0}</td><td className="px-4 py-4 text-center text-lg font-extrabold text-blue-600">{item.total || 0}</td></tr>; }) : <tr><td colSpan="6" className="px-6 py-14 text-center text-slate-500">{loading ? "Memuat peringkat..." : search ? "Peserta tidak ditemukan." : `Belum ada hasil Simulasi ${simulation}.`}</td></tr>}</tbody></table></div></div>
      <p className="mt-4 text-xs text-slate-500">Peringkat memakai nilai total terbaik setiap peserta. Email dan jawaban peserta tidak ditampilkan.</p>
    </main>
  </div>;
}
