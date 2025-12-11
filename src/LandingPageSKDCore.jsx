import { Link } from "react-router-dom";
import ThemeToggle from "./components/ThemeToggle";
import logo from "./assets/logo.png";

export default function LandingPageSKDCore() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-slate-50">
      {/* Navbar */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur dark:bg-slate-900/80 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src={logo.png}
              alt="SKDCore"
              className="h-7 w-auto object-contain"
            />
            <span className="font-bold text-xl text-blue-600 dark:text-blue-400">
              SKDCore
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400">
              Fitur
            </a>
            <a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-blue-400">
              Cara Kerja
            </a>
            <a href="#for-who" className="hover:text-blue-600 dark:hover:text-blue-400">
              Untuk Siapa
            </a>
            <a href="#faq" className="hover:text-blue-600 dark:hover:text-blue-400">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/login"
              className="text-sm font-medium px-4 py-2 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-300 dark:hover:bg-slate-800"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4">
        {/* Hero */}
        <section className="py-12 md:py-20 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4">
              Siap SKD, Bukan Cuma Coba-Coba.
            </h1>
            <p className="text-gray-600 dark:text-slate-300 mb-6 max-w-xl">
              Latihan TWK, TIU, dan TKP dengan pola mirip CAT. Ada timer, passing grade,
              dan analisis nilai biar kamu tahu posisi kamu sekarang.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/simulasi"
                className="px-6 py-3 rounded-full bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700"
              >
                Mulai Simulasi Gratis
              </Link>
              <a
                href="#features"
                className="px-6 py-3 rounded-full border border-gray-300 text-sm font-semibold text-gray-800 hover:bg-gray-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Lihat Fitur SKDCore
              </a>
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-slate-400">
              Tidak resmi dari pemerintah. Dirancang sebagai latihan mandiri untuk bantu kamu siap tes SKD.
            </p>
          </div>

          <div className="flex-1">
            {/* Card simulasi mini */}
            <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between mb-4 text-xs font-medium text-gray-500 dark:text-slate-400">
                <span>Simulasi SKD – Mode CAT</span>
                <span>Timer: 100:00</span>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="flex justify-between">
                    <span>TWK</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">65 / 80</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: "80%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between">
                    <span>TIU</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">80 / 80</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: "100%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between">
                    <span>TKP</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">155 / 166</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: "93%" }} />
                  </div>
                </div>
              </div>

              <div className="mt-5 p-3 rounded-xl bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 text-xs text-blue-900 dark:text-blue-200">
                <p className="font-semibold">Analisis singkat</p>
                <p>
                  Nilai kamu sudah melewati passing grade di semua bidang. Pertahankan ritme
                  latihan dan fokus perkuat TWK.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Kenapa SKDCore */}
        <section id="features" className="py-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Kenapa pakai SKDCore?
          </h2>
          <p className="text-gray-600 dark:text-slate-300 mb-6 max-w-2xl">
            Dirancang untuk pejuang CPNS yang mau latihan serius, bukan cuma lewat-lewat.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold mb-2">Simulasi mirip ujian asli</h3>
              <p className="text-sm text-gray-600 dark:text-slate-300">
                Tampilan bersih, ada timer, jumlah soal, dan sistem nilai yang ngikutin pola SKD.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold mb-2">Analisis nilai otomatis</h3>
              <p className="text-sm text-gray-600 dark:text-slate-300">
                Langsung lihat nilai per bidang, status lolos/tidak, dan bagian mana yang perlu diperbaiki.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold mb-2">Pantau progress dari waktu ke waktu</h3>
              <p className="text-sm text-gray-600 dark:text-slate-300">
                Rekam semua simulasi kamu dan lihat grafik perkembangan nilai.
              </p>
            </div>
          </div>
        </section>

        {/* Fitur Utama */}
        <section className="py-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Fitur latihan TWK, TIU, dan TKP.
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-gray-200 p-5">
              <span className="text-xs font-semibold text-blue-600">TWK</span>
              <h3 className="font-semibold mb-2">Tes Wawasan Kebangsaan</h3>
              <p className="text-sm text-gray-600 dark:text-slate-300">
                Soal-soal tentang Pancasila, UUD 1945, NKRI, dan kebangsaan dengan pembahasan yang gampang dipahami.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-gray-200 p-5">
              <span className="text-xs font-semibold text-blue-600">TIU</span>
              <h3 className="font-semibold mb-2">Tes Intelegensi Umum</h3>
              <p className="text-sm text-gray-600 dark:text-slate-300">
                Logika, numerik, dan verbal untuk ngasah kemampuan berpikir cepat dan tepat.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-gray-200 p-5">
              <span className="text-xs font-semibold text-blue-600">TKP</span>
              <h3 className="font-semibold mb-2">Tes Karakteristik Pribadi</h3>
              <p className="text-sm text-gray-600 dark:text-slate-300">
                Studi kasus situasional biar kamu kebiasa dengan pola soal penilaian karakter.
              </p>
            </div>
          </div>
        </section>

        {/* Cara Kerja, Untuk Siapa, FAQ sama seperti versi sebelumnya (boleh tetap) */}
        {/* ...kalau mau gue bisa tulisin ulang, tapi inti UI & dark mode-nya udah keliatan */}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-slate-800 mt-10">
        <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-gray-500 dark:text-slate-400 flex flex-col md:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} SKDCore. Latihan mandiri untuk persiapan SKD.</span>
          <span>Not affiliated with any government institution.</span>
        </div>
      </footer>
    </div>
  );
}
