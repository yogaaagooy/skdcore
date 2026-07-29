import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { auth } from "../services/firebase";
import { getPremiumSettings } from "../services/settings";
import { getWeeklyTryout, verifyWeeklyTryoutCode } from "../services/weeklyTryout";
import { getWeeklyAttemptCount } from "../services/results";
import { getCurrentUser, setCurrentUser } from "../utils/auth";

export default function SimulationMenu() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [premiumPackage, setPremiumPackage] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentActivated, setPaymentActivated] = useState(false);
  const [premiumEnabled, setPremiumEnabled] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [weekly, setWeekly] = useState(null);
  const [weeklyCode, setWeeklyCode] = useState("");
  const [weeklyMessage, setWeeklyMessage] = useState("");
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [user, setUser] = useState(() => getCurrentUser());

  const premiumUntilMillis = typeof user?.premiumUntil === "string"
    ? Date.parse(user.premiumUntil)
    : Number(user?.premiumUntil?.seconds || 0) * 1000;
  const hasPremium = user?.role === "admin" || (user?.premiumActive && premiumUntilMillis > Date.now());
  const weeklyNow = Date.now();
  const weeklyStatus = !weekly?.enabled
    ? "hidden"
    : weekly.startAt && weeklyNow < Date.parse(weekly.startAt)
    ? "upcoming"
    : weekly.endAt && weeklyNow > Date.parse(weekly.endAt)
    ? "ended"
    : "active";

  useEffect(() => {
    let active = true;
    getPremiumSettings()
      .then((settings) => { if (active) setPremiumEnabled(settings.enabled); })
      .catch(() => { if (active) setPremiumEnabled(false); })
      .finally(() => { if (active) setSettingsLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    getWeeklyTryout().then((data) => { if (active) setWeekly(data); }).catch(() => { if (active) setWeekly(null); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!premiumEnabled) return;
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
    if (!clientKey || document.getElementById("midtrans-snap")) return;
    const script = document.createElement("script");
    script.id = "midtrans-snap";
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.dataset.clientKey = clientKey;
    document.body.appendChild(script);
    return () => script.remove();
  }, [premiumEnabled]);

  function confirmStart() {
    if (!selected) return;
    navigate(selected.path);
  }

  function choosePackage(number) {
    if (number === 1 || hasPremium) {
      setSelected({ label: `Tryout ${number}`, detail: "110 soal · 100 menit", path: `/simulasi/sim/${number}` });
      return;
    }
    if (!premiumEnabled) return;
    setPaymentMessage("");
    setPaymentActivated(false);
    setPremiumPackage(number);
  }

  async function openWeeklyTryout() {
    if (!weekly || weeklyLoading) return;
    setWeeklyLoading(true);
    setWeeklyMessage("");
    try {
      const attemptCount = await getWeeklyAttemptCount(weekly.eventId);
      if (attemptCount > 0) throw new Error("Kamu sudah menggunakan kesempatan Tryout Nasional minggu ini.");
      const verified = await verifyWeeklyTryoutCode(weeklyCode);
      window.sessionStorage.setItem("nalarasn_weekly_tryout_access", verified.eventId);
      window.sessionStorage.setItem("nalarasn_weekly_tryout_end", verified.endAt || "");
      setSelected({ label: weekly.title, detail: "110 soal · 100 menit · satu kesempatan", path: `/simulasi/sim/${verified.packageNumber}?weekly=${encodeURIComponent(verified.eventId)}` });
    } catch (error) {
      setWeeklyMessage(error.message);
    } finally {
      setWeeklyLoading(false);
    }
  }

  async function activatePaidOrder(orderId) {
    const idToken = await auth.currentUser?.getIdToken(true);
    if (!idToken) throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
    const response = await fetch("/api/verify-midtrans-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
      body: JSON.stringify({ orderId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Aktivasi premium belum berhasil.");

    const updatedUser = { ...user, premiumActive: true, premiumUntil: data.premiumUntil };
    setUser(updatedUser);
    setCurrentUser(updatedUser);
    setPaymentActivated(true);
    setPaymentMessage("Pembayaran berhasil. Premium aktif selama 30 hari dan Paket 2–10 sudah terbuka.");
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
        onSuccess: async () => {
          setPaymentLoading(true);
          setPaymentMessage("Pembayaran berhasil. Sedang mengaktifkan premium...");
          try {
            await activatePaidOrder(data.orderId);
          } catch (error) {
            setPaymentMessage(error.message);
          } finally {
            setPaymentLoading(false);
          }
        },
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

  return <div className="app-page min-h-screen bg-slate-50 dark:bg-slate-950">
    <Navbar />
    <main className="mx-auto max-w-5xl px-4 py-7 sm:py-10">
      <div className="mb-6"><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Tryout</p><h1 className="mt-1 text-2xl font-bold">Ukur kesiapanmu dalam kondisi ujian</h1><p className="mt-1 text-sm text-slate-500">Setiap tryout berisi 110 soal TWK, TIU, dan TKP dalam 100 menit.</p></div>
      {weekly?.enabled && <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-700 p-6 text-white shadow-lg shadow-blue-600/20"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">{weeklyStatus === "active" ? "Sedang Berlangsung" : weeklyStatus === "upcoming" ? "Segera Dibuka" : "Sudah Berakhir"}</span><h2 className="mt-4 text-2xl font-bold">{weekly.title}</h2><p className="mt-2 text-sm text-blue-100">{weekly.startAt ? `Dibuka ${new Date(weekly.startAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}` : "Jadwal segera diumumkan"}{weekly.endAt ? ` · berakhir ${new Date(weekly.endAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}` : ""}</p><p className="mt-2 text-xs text-blue-100">Satu kesempatan per pengguna. Pembahasan tersedia setelah periode berakhir.</p></div><div className="w-full max-w-xs rounded-2xl bg-white/10 p-4 backdrop-blur"><label className="text-xs font-bold">{weeklyStatus !== "active" ? "Pendaftaran belum tersedia" : weekly.requiresCode ? "Kode dari media sosial NalarASN" : "Tryout tanpa kode"}</label>{weeklyStatus === "active" && weekly.requiresCode && <input value={weeklyCode} onChange={(event) => setWeeklyCode(event.target.value.toUpperCase())} placeholder="Masukkan kode" className="mt-2 w-full rounded-xl border border-white/20 bg-white px-4 py-2.5 text-sm font-bold uppercase text-slate-900 outline-none" />}{weekly.socialUrl && <a href={weekly.socialUrl} target="_blank" rel="noreferrer" className="mt-2 block text-xs font-semibold text-white underline">Lihat akun media sosial →</a>}<button disabled={weeklyStatus !== "active" || weeklyLoading || (weekly.requiresCode && !weeklyCode)} onClick={openWeeklyTryout} className="mt-3 w-full rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-blue-700 disabled:opacity-50">{weeklyLoading ? "Memeriksa..." : weeklyStatus === "upcoming" ? "Belum Dimulai" : weeklyStatus === "ended" ? "Tryout Berakhir" : "Buka Tryout Nasional"}</button>{weeklyMessage && <p className="mt-2 text-xs text-white">{weeklyMessage}</p>}</div></div></section>}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-sm font-bold">Daftar Tryout 1–10</h2><p className="mt-1 text-xs text-slate-500">{premiumEnabled || hasPremium ? "Tryout 1 gratis. Tryout 2–10 tersedia untuk pengguna premium." : "Tryout 1 gratis. Tryout 2–10 akan dibuka setelah layanan premium siap."}</p></div><span className={`rounded-full px-3 py-1 text-[11px] font-bold ${hasPremium ? "bg-emerald-100 text-emerald-800" : premiumEnabled ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{hasPremium ? "Premium aktif" : settingsLoading ? "Memuat..." : premiumEnabled ? "Premium Rp29.000" : "Beta gratis"}</span></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">{Array.from({length:10},(_,i)=>i+1).map(number=><button key={number} disabled={number > 1 && !hasPremium && !premiumEnabled} onClick={()=>choosePackage(number)} className={`rounded-2xl border p-4 text-left transition dark:border-slate-700 ${number === 1 || hasPremium ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:-translate-y-0.5 hover:shadow dark:bg-emerald-950/20" : premiumEnabled ? "border-slate-200 hover:border-blue-500" : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 dark:bg-slate-950/40"}`}><span className="text-xs text-slate-400">110 soal</span><strong className="mt-1 block">Tryout {number}</strong><small className="mt-2 block text-[10px] font-bold">{number === 1 ? "GRATIS" : hasPremium ? "✓ TERBUKA" : premiumEnabled ? "🔒 PREMIUM" : "SEGERA HADIR"}</small></button>)}</div></section>
    </main>
    {selected && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
      <section role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl dark:bg-slate-900 sm:p-8">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-2xl text-blue-600 dark:bg-blue-950/40">▶</div>
        <h2 id="confirm-title" className="mt-4 text-xl font-bold">Mulai {selected.label}?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Timer akan langsung berjalan setelah halaman soal dibuka. Pastikan kamu sudah siap dan memiliki waktu yang cukup.</p>
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{selected.detail}</div>
        <div className="mt-6 grid gap-2 sm:grid-cols-2"><button onClick={() => setSelected(null)} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Batal</button><button onClick={confirmStart} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700">Mulai tryout</button></div>
      </section>
    </div>}
    {premiumPackage && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm" onClick={() => setPremiumPackage(null)}>
      <section role="dialog" aria-modal="true" aria-labelledby="premium-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 sm:p-8">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-2xl">★</div>
        <div className="mt-4 text-center"><p className="text-xs font-bold uppercase tracking-wider text-amber-600">NalarASN Premium</p><h2 id="premium-title" className="mt-1 text-xl font-bold">Buka Tryout {premiumPackage}</h2><p className="mt-2 text-sm leading-6 text-slate-500">Akses Tryout 2–10 dan pembahasan tambahan untuk membantu latihan lebih terarah.</p></div>
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-900 dark:bg-amber-950/20"><strong className="text-2xl text-slate-900 dark:text-white">Rp29.000</strong><span className="text-sm text-slate-500"> / 30 hari</span><p className="mt-1 text-xs text-slate-500">Pembayaran saat ini menggunakan Midtrans Sandbox.</p></div>
        {paymentMessage && <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">{paymentMessage}</p>}
        <div className="mt-6 grid gap-2 sm:grid-cols-2"><button onClick={() => setPremiumPackage(null)} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold dark:border-slate-700">{paymentActivated ? "Tutup" : "Nanti saja"}</button>{paymentActivated ? <button onClick={() => { const number = premiumPackage; setPremiumPackage(null); choosePackage(number); }} className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white">Mulai paket</button> : <button onClick={startPayment} disabled={paymentLoading} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{paymentLoading ? "Menyiapkan..." : "Bayar dengan Midtrans"}</button>}</div>
      </section>
    </div>}
  </div>;
}
