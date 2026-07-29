import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { createFeedback, listMyFeedback } from "../services/feedback";

const statusLabel = { new: "Baru", read: "Dibaca", process: "Diproses", done: "Selesai" };
const typeLabel = { suggestion: "Saran", criticism: "Kritik", bug: "Masalah aplikasi", other: "Lainnya" };

export default function Feedback() {
  const [form, setForm] = useState({ type: "suggestion", title: "", message: "", anonymous: false });
  const [items, setItems] = useState([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setItems(await listMyFeedback());
    } catch (error) {
      setNotice(`✕ ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function submit(event) {
    event.preventDefault();
    if (form.title.trim().length < 4 || form.message.trim().length < 10) {
      setNotice("✕ Judul minimal 4 karakter dan isi minimal 10 karakter.");
      return;
    }
    setLoading(true);
    setNotice("");
    try {
      await createFeedback(form);
      setForm({ type: "suggestion", title: "", message: "", anonymous: false });
      setNotice("✓ Terima kasih. Masukan kamu sudah diterima.");
      await load();
    } catch (error) {
      setNotice(`✕ ${error.message}`);
      setLoading(false);
    }
  }

  return <div className="app-page min-h-screen bg-slate-50 dark:bg-slate-950 dark:text-slate-50">
    <Navbar />
    <main className="mx-auto max-w-4xl px-4 py-7 sm:py-10">
      <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Bantu kami berkembang</p>
      <h1 className="mt-1 text-2xl font-bold">Kritik & Saran</h1>
      <p className="mt-2 text-sm text-slate-500">Ceritakan hal yang perlu diperbaiki atau ide yang dapat membuat NalarASN lebih bermanfaat.</p>

      <form onSubmit={submit} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">Jenis masukan
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal dark:border-slate-700 dark:bg-slate-800">
              <option value="suggestion">Saran</option><option value="criticism">Kritik</option><option value="bug">Masalah aplikasi</option><option value="other">Lainnya</option>
            </select>
          </label>
          <label className="text-sm font-semibold">Judul
            <input maxLength={80} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ringkasan masukan" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal dark:border-slate-700 dark:bg-slate-800" />
          </label>
        </div>
        <label className="mt-4 block text-sm font-semibold">Isi masukan
          <textarea maxLength={1500} rows={5} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Jelaskan masukan secara jelas..." className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal dark:border-slate-700 dark:bg-slate-800" />
        </label>
        <label className="mt-3 flex items-center gap-3 text-sm"><input type="checkbox" checked={form.anonymous} onChange={(event) => setForm({ ...form, anonymous: event.target.checked })} className="h-5 w-5" />Kirim sebagai anonim</label>
        {notice && <p className={`mt-4 rounded-xl p-3 text-sm ${notice.startsWith("✓") ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"}`}>{notice}</p>}
        <button disabled={loading} className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{loading ? "Memproses..." : "Kirim masukan"}</button>
      </form>

      <section className="mt-8">
        <h2 className="text-lg font-bold">Riwayat masukan</h2>
        <div className="mt-3 space-y-3">{loading && !items.length ? <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">Memuat masukan...</p> : items.length ? items.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">{typeLabel[item.type] || "Masukan"}</span><h3 className="font-bold">{item.title}</h3></div><span className="bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{statusLabel[item.status] || item.status}</span></div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{item.message}</p>
          {item.reply && <div className="mt-3 border-l-4 border-amber-400 bg-amber-50 p-3 text-sm text-slate-700 dark:bg-amber-950/20 dark:text-slate-200"><strong>Balasan admin</strong><p className="mt-1">{item.reply}</p></div>}
          <p className="mt-3 text-[10px] text-slate-400">{item.createdAt ? new Date(item.createdAt).toLocaleString("id-ID") : "Baru dikirim"}</p>
        </article>) : <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">Belum ada masukan yang dikirim.</p>}</div>
      </section>
    </main>
  </div>;
}
