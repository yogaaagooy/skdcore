import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/logo.png";
import { findUserByEmail, updateUserPassword } from "../utils/auth";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: cari email, 2: verifikasi wa, 3: reset password
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleFindEmail(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Email wajib diisi");
      return;
    }

    const user = findUserByEmail(email);
    if (!user) {
      setError("Email tidak terdaftar");
      return;
    }

    setFoundUser(user);
    setStep(2);
  }

  function handleVerifyWhatsApp(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!whatsapp.trim()) {
      setError("Nomor WhatsApp wajib diisi");
      return;
    }

    if (whatsapp !== foundUser.whatsapp) {
      setError("Nomor WhatsApp tidak cocok");
      return;
    }

    setStep(3);
  }

  function handleResetPassword(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newPassword.trim() || newPassword.length < 4) {
      setError("Password minimal 4 karakter");
      return;
    }

    try {
      updateUserPassword(foundUser.email, newPassword);
      setSuccess("✔ Password berhasil direset! Silakan login dengan password baru.");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.message || "Gagal reset password");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="SKDCore" className="h-14 w-auto mb-3 object-contain" />
          <h1 className="text-lg font-bold">Lupa Password</h1>
          <p className="text-sm text-gray-600 dark:text-slate-300 text-center mt-2">
            {step === 1 && "Masukkan email akun kamu"}
            {step === 2 && "Verifikasi dengan nomor WhatsApp"}
            {step === 3 && "Buat password baru"}
          </p>
        </div>

        {/* STEP 1: Cari Email */}
        {step === 1 && (
          <form onSubmit={handleFindEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email kamu"
              />
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-blue-700"
            >
              Lanjut
            </button>
          </form>
        )}

        {/* STEP 2: Verifikasi WhatsApp */}
        {step === 2 && (
          <form onSubmit={handleVerifyWhatsApp} className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-slate-300">
                Email ditemukan: <strong>{foundUser?.email}</strong>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                Nomor WhatsApp terdaftar
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contoh: 081234567890"
              />
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Masukkan nomor WhatsApp yang didaftar saat registrasi
              </p>
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setFoundUser(null);
                  setWhatsapp("");
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 text-sm hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                Kembali
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-blue-700"
              >
                Verifikasi
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Reset Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-slate-300">
                ✔ Verifikasi WhatsApp berhasil!
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                Password baru
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Minimal 4 karakter"
                minLength={4}
              />
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-blue-700"
            >
              Reset Password
            </button>
          </form>
        )}

        <p className="mt-4 text-xs text-gray-600 dark:text-slate-300 text-center">
          Ingat password?{" "}
          <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
