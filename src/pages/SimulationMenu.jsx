import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { auth } from "../services/firebase";
import { getCurrentUser } from "../utils/auth";

const modes = [
  { id: "all", label: "SKD Lengkap", detail: "110 soal · 100 menit", description: "TWK, TIU, dan TKP dalam satu sesi.", color: "blue" },
  { id: "twk", label: "TWK", detail: "30 soal · latihan 25 menit", description: "Tes Wawasan Kebangsaan.", color: "emerald" },
  { id: "tiu", label: "TIU", detail: "35 soal · latihan 30 menit", description: "Tes Intelegensia Umum.", color: "violet" },
  { id: "tkp", label: "TKP", detail: "45 soal · latihan 35 menit", description: "Tes Karakteristik Pribadi.", color: "amber" },
];

export default function SimulationMenu() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [premiumPackage, setPremiumPackage] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const user = getCurrentUser();

  useEffect(() => {
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
    if (!clientKey || document.getElementById("midtrans-snap")) return;
    const script = document.createElement("script");
    script.id = "midtrans-snap";
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.dataset.clientKey = clientKey;
    document.body.appendChild(script);
    return () => script.remove();
  }, []);

  function confirmStart() {
    if (!selected) return;
    navigate(selected.path);
  }

  function choosePackage(number) {
    if (number === 1 || user?.role === "admin") {
      setSelected({ label: `Paket Simulasi ${number}`, detail: "110 soal · 100 menit", path: `/simulasi/sim/${number}` });
      return;
    }
    setPaymentMessage("");
    setPremiumPackage(number);
  }

  async function startPayment() {
    if (!premiumPackage || paymentLoading) return;
    setPaymentLoading(true);
    setPaymentMessage("");
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
      const response = await fetch("/api/create-midtrans-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify({ packageNumber: premiumPackage }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Pembayaran gagal disiapkan.");
      if (!window.snap) throw new Error("Layanan pembayaran belum selesai dimuat. Coba lagi sebentar.");
      window.snap.pay(data.token, {
        onSuccess: () => setPaymentMessage("Pembayaran Sandbox berhasil. Aktivasi akses premium akan disambungkan pada tahap berikutnya."),
        onPending: () => setPaymentMessage("Pembayaran masih menunggu penyelesaian."),
        onError: () => setPaymentMessage("Pembayaran gagal. Silakan coba kembali."),
        onClose: () => setPaymentLoading(false),
      });
    } catch (error) {
      setPaymentMessage(error.message);
    } finally {
      setPaymentLoading(false);
    }
  }

  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
    <Navbar />
    <main className="mx-auto max-w-5xl px-4 py-7 sm:py-10">
      <div className="mb-6"><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Pilih simulasi</p><h1 className="mt-1 text-2xl font-bold">Mau latihan apa hari ini?</h1><p className="mt-1 text-sm text-slate-500">Format BKN: 30 TWK, 35 TIU, dan 45 TKP dalam 100 menit. Waktu mode per bidang merupakan pembagian waktu latihan.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        {modes.map((mode) => <article key={mode.id} className={`rounded-2xl border bg-white p-5 dark:bg-slate-900 ${mode.id === "all" ? "border-blue-400 shadow-md shadow-blue-100 dark:shadow-none" : "border-slate-200 dark:border-slate-800"}`}>
          <div className="flex items-start justify-between"><div><span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${mode.id === "all" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{mode.id === "all" ? "Direkomendasikan" : "Latihan bidang"}</span><h2 className="mt-3 text-xl font-bold">{mode.label}</h2><p className="mt-1 text-sm text-slate-500">{mode.description}</p></div><span className="text-2xl text-blue-600">▣</span></div>
          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800"><span className="text-xs font-semibold text-slate-500">{mode.detail}</span><button onClick={() => setSelected({ label: mode.label, detail: mode.detail, path: `/simulasi/${mode.id}` })} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">Pilih simulasi →</button></div>
        </article>)}
      </div>
      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-sm font-bold">Paket soal 1–10</h2><p className="mt-1 text-xs text-slate-500">Paket 1 gratis. Paket 2–10 tersedia untuk pengguna premium.</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800">Premium Rp29.000</span></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">{Array.from({length:10},(_,i)=>i+1).map(number=><button key={number} onClick={()=>choosePackage(number)} className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 ${number === 1 ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20" : "border-slate-200"}`}><span className="block">Paket {number}</span><small className="mt-0.5 block text-[10px] font-medium opacity-70">{number === 1 || user?.role === "admin" ? "Gratis" : "🔒 Premium"}</small></button>)}</div></section>
    </main>
    {selected && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
      <section role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl dark:bg-slate-900 sm:p-8">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-2xl text-blue-600 dark:bg-blue-950/40">▶</div>
        <h2 id="confirm-title" className="mt-4 text-xl font-bold">Mulai {selected.label}?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Timer akan langsung berjalan setelah halaman soal dibuka. Pastikan kamu sudah siap dan memiliki waktu yang cukup.</p>
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{selected.detail}</div>
        <div className="mt-6 grid gap-2 sm:grid-cols-2"><button onClick={() => setSelected(null)} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Batal</button><button onClick={confirmStart} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700">Mulai simulasi</button></div>
      </section>
    </div>}
    {premiumPackage && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm" onClick={() => setPremiumPackage(null)}>
      <section role="dialog" aria-modal="true" aria-labelledby="premium-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 sm:p-8">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-2xl">★</div>
        <div className="mt-4 text-center"><p className="text-xs font-bold uppercase tracking-wider text-amber-600">NalarASN Premium</p><h2 id="premium-title" className="mt-1 text-xl font-bold">Buka Paket Simulasi {premiumPackage}</h2><p className="mt-2 text-sm leading-6 text-slate-500">Akses paket latihan premium dan pembahasan tambahan untuk membantu latihan lebih terarah.</p></div>
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-900 dark:bg-amber-950/20"><strong className="text-2xl text-slate-900 dark:text-white">Rp29.000</strong><span className="text-sm text-slate-500"> / 30 hari</span><p className="mt-1 text-xs text-slate-500">Pembayaran saat ini menggunakan Midtrans Sandbox.</p></div>
        {paymentMessage && <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">{paymentMessage}</p>}
        <div className="mt-6 grid gap-2 sm:grid-cols-2"><button onClick={() => setPremiumPackage(null)} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold dark:border-slate-700">Nanti saja</button><button onClick={startPayment} disabled={paymentLoading} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{paymentLoading ? "Menyiapkan..." : "Bayar dengan Midtrans"}</button></div>
      </section>
    </div>}
  </div>;
}
