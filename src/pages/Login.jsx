import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/skdcore-logo.png";
import { loginUser, getCurrentUser } from "../utils/auth";

export default function Login() {
  const navigate = useNavigate();

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

  function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email")?.toString().trim() || "";
    const password = formData.get("password")?.toString().trim() || "";

    try {
      const user = loginUser({ email, password });

      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      alert(err.message || "Login gagal.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="SKDCore" className="h-14 w-auto mb-3 object-contain" />
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
              placeholder="email kamu / admin@skdcore.local"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-blue-700"
          >
            Login
          </button>
        </form>

        <p className="mt-4 text-xs text-gray-600 dark:text-slate-300 text-center">
          Belum punya akun?{" "}
          <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:underline">
            Daftar dulu
          </Link>
        </p>

        <p className="mt-3 text-[11px] text-gray-400 dark:text-slate-500 text-center">
          Admin default: <code>admin@skdcore.local</code> / <code>admin123</code>
        </p>
      </div>
    </div>
  );
}
