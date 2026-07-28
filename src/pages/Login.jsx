import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/logo.png";
import { getCurrentUser, setCurrentUser } from "../utils/auth";
import { signIn } from "../services/auth";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Kalau sudah login, langsung lempar ke dashboard sekali via useEffect
  useEffect(() => {
    const current = getCurrentUser();
    if (current) {
      if (current.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email")?.toString().trim() || "";
    const password = formData.get("password")?.toString().trim() || "";

    try {
      setLoading(true);
      const user = await signIn(email, password);
      setCurrentUser(user);

      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      alert(err.code === "auth/invalid-credential" ? "Email atau password salah." : (err.message || "Login gagal."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6">
        <div className="flex flex-col items-center mb-6">
          <Link to="/" aria-label="Kembali ke halaman utama" className="mb-3 rounded-xl bg-white p-2"><img src={logo} alt="NalarASN" className="h-12 w-auto max-w-[210px] object-contain" /></Link>
          <p className="text-sm text-gray-600 dark:text-slate-300 text-center">
            Masuk untuk melanjutkan latihan SKD kamu.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="email kamu"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
              Password
            </label>
            <div className="relative"><input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 pr-12 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
            /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 px-3 text-lg text-gray-500 hover:text-blue-600" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}>{showPassword ? "◉" : "◎"}</button></div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-xs text-gray-600 dark:text-slate-300 text-center">
          Belum punya akun?{" "}
          <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:underline">
            Daftar dulu
          </Link>
        </p>

        <p className="mt-2 text-xs text-gray-600 dark:text-slate-300 text-center">
          Lupa password?{" "}
          <Link to="/forgot-password" className="text-blue-600 dark:text-blue-400 hover:underline">
            Reset di sini
          </Link>
        </p>

      </div>
    </div>
  );
}
