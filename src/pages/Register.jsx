import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/logo.png";
import { registerUser, getCurrentUser } from "../utils/auth";

export default function Register() {
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const password = formData.get("password")?.toString().trim();
    const whatsapp = formData.get("whatsapp")?.toString().trim();

    try {
      registerUser({ name, email, password, whatsapp, role: "user" });
      navigate("/dashboard");
    } catch (err) {
      alert(err.message || "Gagal daftar.");
    }
  }

  const current = getCurrentUser();
  if (current) {
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6">
        <div className="flex flex-col items-center mb-6">
          <Link to="/" aria-label="Kembali ke halaman utama"><img src={logo} alt="SKDCore" className="h-12 w-auto max-w-[180px] mb-3 object-contain" /></Link>
          <p className="text-sm text-gray-600 dark:text-slate-300 text-center">
            Buat akun baru untuk mulai latihan SKD.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
              Nama lengkap
            </label>
            <input
              name="name"
              type="text"
              required
              className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nama kamu"
            />
          </div>

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
            <input
              name="password"
              type="password"
              required
              minLength="4"
              className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Password minimal 4 karakter"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
              Nomor WhatsApp
            </label>
            <input
              name="whatsapp"
              type="tel"
              required
              className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contoh: 081234567890"
            />
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Untuk verifikasi jika lupa password
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-blue-700"
          >
            Daftar
          </button>
        </form>

        <p className="mt-4 text-xs text-gray-600 dark:text-slate-300 text-center">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
