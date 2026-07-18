import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getCurrentUser, getUsers } from "../utils/auth";

const HISTORY_KEY = "skdcore_simulasi_history_v1";

export default function Leaderboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [simulation, setSimulation] = useState("1");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { navigate("/login", { replace: true }); return; }
    setCurrentUser(user);
    setUsers(getUsers());
    try {
      const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      setHistory(Array.isArray(stored) ? stored : []);
    } catch { setHistory([]); }
  }, [navigate]);

  const rankedRows = useMemo(() => {
    const accounts = Object.fromEntries(users.map((user) => [user.email, user]));
    const bestByUser = {};
    history.filter((item) => Number(item.simulasi_num) === Number(simulation)).forEach((item) => {
      if (!item.userEmail || !item.result) return;
      const twk = item.result.TWK || 0;
      const tiu = item.result.TIU || 0;
      const tkp = item.result.TKP || 0;
      const total = twk + tiu + tkp;
      if (!bestByUser[item.userEmail] || total > bestByUser[item.userEmail].total) {
        const account = accounts[item.userEmail] || {};
        bestByUser[item.userEmail] = {
          email: item.userEmail,
          name: account.name || item.userEmail.split("@")[0],
          tiu, twk, tkp, total,
        };
      }
    });
    return Object.values(bestByUser).sort((a, b) => b.total - a.total || b.tkp - a.tkp || b.tiu - a.tiu);
  }, [history, users, simulation]);

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return !query ? rankedRows : rankedRows.filter((item) => item.name.toLowerCase().includes(query));
  }, [rankedRows, search]);

  if (!currentUser) return null;
  const rankLabel = (rank) => rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank;

  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"><Navbar />
    <main className="mx-auto max-w-6xl px-4 py-7 sm:py-10">
      <div className="mb-6"><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Peringkat</p><h1 className="mt-1 text-2xl font-bold">Peringkat per simulasi</h1><p className="mt-1 text-sm text-slate-500">Pilih paket untuk melihat nilai terbaik peserta pada simulasi tersebut.</p></div>

      <section className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[220px_1fr]">
        <div><label className="mb-2 block text-xs font-semibold text-slate-500">Pilih simulasi</label><select value={simulation} onChange={(event) => setSimulation(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold dark:border-slate-700 dark:bg-slate-800">{Array.from({ length: 10 }, (_, index) => index + 1).map((number) => <option value={number} key={number}>Simulasi {number}</option>)}</select></div>
        <div><label className="mb-2 block text-xs font-semibold text-slate-500">Cari peserta</label><div className="relative"><span className="absolute left-3 top-2.5 text-slate-400">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama peserta" className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:focus:ring-blue-950" /></div></div>
      </section>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800"><h2 className="font-bold">Simulasi {simulation}</h2><p className="mt-1 text-xs text-slate-500">{rankedRows.length} peserta memiliki hasil pada paket ini.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800"><tr><th className="px-4 py-4 text-center">Rank</th><th className="px-4 py-4 text-left">Nama</th><th className="px-4 py-4 text-center">TIU</th><th className="px-4 py-4 text-center">TWK</th><th className="px-4 py-4 text-center">TKP</th><th className="px-4 py-4 text-center">Total</th></tr></thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{visibleRows.length ? visibleRows.map((item) => {
            const rank = rankedRows.findIndex((row) => row.email === item.email) + 1;
            const isCurrent = item.email === currentUser.email;
            return <tr key={item.email} className={isCurrent ? "bg-blue-50/70 dark:bg-blue-950/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/60"}><td className="px-4 py-4 text-center text-lg font-bold">{rankLabel(rank)}</td><td className="px-4 py-4"><strong className="block text-slate-900 dark:text-white">{item.name}</strong>{isCurrent && <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">Anda</span>}</td><td className="px-4 py-4 text-center font-semibold">{item.tiu}</td><td className="px-4 py-4 text-center font-semibold">{item.twk}</td><td className="px-4 py-4 text-center font-semibold">{item.tkp}</td><td className="px-4 py-4 text-center text-lg font-extrabold text-blue-600">{item.total}</td></tr>;
          }) : <tr><td colSpan="6" className="px-6 py-14 text-center text-slate-500">{rankedRows.length ? "Peserta tidak ditemukan." : `Belum ada peserta yang menyelesaikan Simulasi ${simulation}.`}</td></tr>}</tbody></table></div>
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">Jika peserta mengerjakan paket yang sama lebih dari sekali, peringkat menggunakan total nilai terbaiknya.</p>
    </main>
  </div>;
}
