import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import logo from "../assets/logo.png";

const pages = {
  panduan: {
    title: "Panduan & Bantuan",
    intro: "Cara menggunakan NalarASN dengan aman dan efektif.",
    sections: [
      ["Memulai", "Daftar menggunakan email aktif, lengkapi profil, lalu pilih menu Latihan untuk belajar bertahap atau Tryout untuk mengukur kemampuan."],
      ["Mode Belajar", "Pembahasan dapat dilihat setelah memilih jawaban. Gunakan mode ini untuk memahami pola dan alasan jawaban terbaik."],
      ["Mode Ujian", "Timer berjalan dan pembahasan ditampilkan setelah sesi selesai. Pastikan waktu dan koneksi internet cukup sebelum memulai."],
      ["Bantuan", "Jika menemukan soal bermasalah atau kendala akun, gunakan tombol laporan yang tersedia atau hubungi dukungan NalarASN."],
    ],
  },
  privasi: {
    title: "Kebijakan Privasi",
    intro: "Ringkasan cara NalarASN mengelola data pengguna.",
    sections: [
      ["Data yang diproses", "NalarASN dapat memproses nama, email, instansi, hasil latihan, jawaban, serta informasi teknis yang diperlukan untuk menyediakan layanan."],
      ["Tujuan penggunaan", "Data digunakan untuk autentikasi, penyimpanan hasil, analisis perkembangan, keamanan, dukungan pengguna, dan peningkatan kualitas layanan."],
      ["Pembayaran", "Informasi pembayaran diproses oleh penyedia pembayaran. NalarASN tidak menyimpan nomor kartu atau PIN pengguna."],
      ["Hak pengguna", "Pengguna dapat meminta koreksi atau penghapusan data sesuai ketentuan yang berlaku dengan menghubungi kanal dukungan."],
      ["Keamanan", "Kami menerapkan pembatasan akses dan pengamanan teknis yang wajar, tetapi tidak ada sistem internet yang sepenuhnya bebas risiko."],
    ],
  },
  ketentuan: {
    title: "Syarat dan Ketentuan",
    intro: "Ketentuan dasar penggunaan platform latihan NalarASN.",
    sections: [
      ["Sifat layanan", "NalarASN adalah platform latihan mandiri yang independen, bukan penyelenggara seleksi dan tidak berafiliasi dengan BKN atau instansi pemerintah."],
      ["Hasil latihan", "Nilai, peringkat, passing grade, dan indikator kesiapan bukan hasil resmi serta tidak menjamin kelulusan seleksi."],
      ["Penggunaan akun", "Pengguna bertanggung jawab menjaga keamanan akun dan tidak menyalahgunakan layanan, membagikan akses berbayar, atau mengambil konten secara tidak sah."],
      ["Konten", "Soal dan pembahasan disusun untuk tujuan pendidikan. Pengguna dapat melaporkan kekeliruan agar materi dapat ditinjau."],
      ["Perubahan layanan", "Fitur, jadwal tryout, harga, dan ketentuan dapat diperbarui. Perubahan penting akan diinformasikan melalui aplikasi."],
    ],
  },
};

export default function PublicInfo({ page = "panduan" }) {
  const content = pages[page] || pages.panduan;
  return <div className="min-h-screen bg-[#f7f9fc] dark:bg-[#07152f] dark:text-slate-50"><header className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-[#0b2a5b]"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4"><Link to="/" className="rounded-lg bg-white p-1.5"><img src={logo} alt="NalarASN" className="h-9 w-auto object-contain" /></Link><div className="flex items-center gap-2"><ThemeToggle/><Link to="/login" className="border border-[#2468d8]/40 px-4 py-2 text-sm font-semibold text-[#2468d8] dark:text-blue-200">Masuk</Link></div></div></header><main className="mx-auto max-w-3xl px-4 py-10 sm:py-16"><Link to="/" className="text-sm font-semibold text-[#2468d8]">← Kembali ke beranda</Link><p className="mt-8 text-xs font-bold uppercase tracking-wider text-[#e5a21a]">Informasi NalarASN</p><h1 className="mt-2 text-3xl font-black text-[#0b2a5b] dark:text-white sm:text-4xl">{content.title}</h1><p className="mt-3 text-base leading-7 text-slate-500">{content.intro}</p><div className="mt-8 divide-y divide-slate-200 border-y border-slate-200 dark:divide-white/10 dark:border-white/10">{content.sections.map(([title,body])=><section key={title} className="py-6"><h2 className="border-l-4 border-[#2468d8] pl-3 font-bold text-[#0b2a5b] dark:text-white">{title}</h2><p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{body}</p></section>)}</div><p className="mt-8 border-l-4 border-[#e5a21a] bg-amber-50 p-4 text-xs leading-5 text-slate-600 dark:bg-amber-950/20 dark:text-slate-300">NalarASN adalah sarana belajar mandiri dan bukan layanan resmi pemerintah. Informasi penting terkait layanan akan diperbarui pada halaman ini.</p></main></div>;
}
