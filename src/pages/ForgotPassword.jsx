import { useState } from "react";
import { Link } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import { resetPassword } from "../services/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await resetPassword(email);
      setMessage("Tautan reset password sudah dikirim. Periksa inbox atau folder spam.");
    } catch (error) {
      setMessage(error.code === "auth/invalid-email" ? "Format email tidak valid." : "Tautan belum dapat dikirim. Periksa email lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-slate-950">
    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6 flex flex-col items-center"><Link to="/" className="mb-3"><BrandLogo size="lg" /></Link><h1 className="text-lg font-bold">Reset Password</h1><p className="mt-2 text-center text-sm text-gray-600 dark:text-slate-300">Firebase akan mengirim tautan reset ke email akun kamu.</p></div>
      <form onSubmit={handleSubmit} className="space-y-4"><div><label className="mb-1 block text-sm font-medium">Email</label><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email kamu" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" /></div>{message && <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">{message}</p>}<button disabled={loading} className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Mengirim..." : "Kirim tautan reset"}</button></form>
      <p className="mt-4 text-center text-xs text-gray-600 dark:text-slate-300">Ingat password? <Link to="/login" className="text-blue-600 hover:underline">Login</Link></p>
    </div>
  </div>;
}
