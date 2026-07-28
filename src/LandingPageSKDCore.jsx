import { Link } from "react-router-dom";
import ThemeToggle from "./components/ThemeToggle";
import logo from "./assets/logo.png";

const features = [
  ["01", "Latihan per bidang", "Fokus pada TWK, TIU, atau TKP dengan pilihan mode belajar dan mode ujian."],
  ["02", "Buku kesalahan", "Soal yang belum tepat dikumpulkan agar dapat dipelajari kembali tanpa mencari dari awal."],
  ["03", "Hasil yang terbaca", "Lihat nilai setiap bidang, jawaban, dan pembahasan untuk menentukan latihan berikutnya."],
  ["04", "Tryout & peringkat", "Ukur kemampuan melalui paket tryout dan bandingkan hasil pada sesi yang sama."],
];

const faqs = [
  ["Apakah NalarASN aplikasi resmi pemerintah?", "Bukan. NalarASN adalah sarana belajar mandiri yang independen dan tidak berafiliasi dengan BKN maupun instansi pemerintah."],
  ["Apakah soal sama dengan ujian resmi?", "Tidak. Soal disusun sebagai bahan latihan berdasarkan kompetensi yang relevan, bukan salinan atau bocoran soal resmi."],
  ["Apa perbedaan Mode Belajar dan Mode Ujian?", "Mode Belajar menampilkan jawaban terbaik dan pembahasan setelah menjawab. Mode Ujian menggunakan timer dan pembahasan ditampilkan setelah sesi selesai."],
  ["Berapa jumlah soal dalam satu tryout?", "Paket tryout lengkap berisi 110 soal: 30 TWK, 35 TIU, dan 45 TKP dengan waktu 100 menit."],
  ["Apakah tersedia latihan gratis?", "Ya. Latihan dasar, Tryout 1, dan agenda Tryout Nasional tertentu tersedia gratis sesuai jadwal serta ketentuan yang ditampilkan."],
  ["Bagaimana jika menemukan kesalahan soal?", "Gunakan fitur laporan soal pada halaman pembahasan. Tim pengelola dapat meninjau pertanyaan, pilihan jawaban, dan pembahasannya."],
  ["Bagaimana menyampaikan kritik atau saran?", "Setelah login, buka menu profil lalu pilih Kritik & Saran. Kamu dapat memantau status dan melihat balasan admin."],
  ["Apakah nilai menjamin kelulusan?", "Tidak. Nilai, passing grade, dan peringkat di NalarASN hanya alat evaluasi belajar dan bukan hasil seleksi resmi."],
];

export default function LandingPageSKDCore() {
  return <div className="min-h-screen bg-[#f7f9fc] text-slate-900 dark:bg-[#07152f] dark:text-slate-50">
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-[#0b2a5b]/95">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="rounded-lg bg-white p-1.5"><img src={logo} alt="NalarASN" className="h-9 w-auto max-w-[155px] object-contain" /></Link>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 dark:text-slate-200 md:flex">
          <a href="#fitur" className="hover:text-[#2468d8]">Fitur</a>
          <a href="#alur" className="hover:text-[#2468d8]">Cara belajar</a>
          <a href="#tryout" className="hover:text-[#2468d8]">Tryout Gratis</a>
          <a href="#faq" className="hover:text-[#2468d8]">FAQ</a>
        </nav>
        <div className="flex items-center gap-2"><ThemeToggle/><Link to="/login" className="border border-[#2468d8]/30 px-4 py-2 text-sm font-semibold text-[#2468d8] dark:text-blue-200">Masuk</Link><Link to="/register" className="hidden bg-[#2468d8] px-4 py-2 text-sm font-bold text-white sm:block">Daftar gratis</Link></div>
      </div>
    </header>

    <main>
      <section className="relative overflow-hidden border-b border-slate-200 bg-white dark:border-white/10 dark:bg-[#07152f]">
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#0b2a5b_0_33%,#2468d8_33%_66%,#e5a21a_66%)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-[1.1fr_.9fr] md:py-24">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2468d8]">Latihan SKD berbasis pemahaman</p>
            <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.12] md:text-6xl">Latihan bukan untuk menghafal jawaban.</h1>
            <p className="mt-5 max-w-xl text-lg font-semibold text-[#0b2a5b] dark:text-blue-100">Bangun cara berpikir, evaluasi kesalahan, lalu berlatih kembali dengan arah yang jelas.</p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">NalarASN membantu calon peserta SKD belajar mandiri melalui latihan per bidang, tryout, pembahasan, buku kesalahan, dan catatan perkembangan.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link to="/register" className="bg-[#2468d8] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/15">Mulai belajar gratis</Link><a href="#fitur" className="border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-[#0b2a5b] dark:border-white/20 dark:bg-transparent dark:text-white">Pelajari fiturnya</a></div>
            <p className="mt-5 text-xs text-slate-500">Independen · Bukan layanan resmi pemerintah · Tidak menjanjikan kelulusan</p>
          </div>

          <div className="border border-[#0b2a5b]/15 bg-[#f8fafc] shadow-xl shadow-[#0b2a5b]/10 dark:border-white/10 dark:bg-[#0b2a5b]">
            <div className="flex items-center justify-between border-b border-slate-200 bg-[#0b2a5b] px-5 py-4 text-white dark:border-white/10"><div><p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Simulasi lengkap</p><h2 className="mt-1 text-lg font-bold">Tryout SKD</h2></div><span className="bg-[#e5a21a] px-3 py-1 text-xs font-black text-[#0b2a5b]">100 MENIT</span></div>
            <div className="grid grid-cols-3 gap-px bg-slate-200 dark:bg-white/10">
              {[["TWK","30","Wawasan Kebangsaan"],["TIU","35","Intelegensia Umum"],["TKP","45","Karakteristik Pribadi"]].map(([label,total,name])=><div key={label} className="bg-white p-4 dark:bg-[#102f63]"><span className="text-xs font-bold text-[#2468d8]">{label}</span><strong className="mt-2 block text-3xl text-[#0b2a5b] dark:text-white">{total}</strong><small className="mt-1 block leading-4 text-slate-500 dark:text-slate-300">{name}</small></div>)}
            </div>
            <div className="p-5"><div className="flex items-center justify-between text-sm"><span className="font-semibold">Total soal</span><strong className="text-xl text-[#0b2a5b] dark:text-white">110</strong></div><div className="mt-4 h-2 overflow-hidden bg-slate-200 dark:bg-white/10"><div className="h-full w-full bg-[linear-gradient(90deg,#0b2a5b_0_27%,#2468d8_27%_59%,#e5a21a_59%)]" /></div><p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-300">Gunakan hasil untuk melihat bidang yang perlu diperkuat, bukan sekadar mengejar angka.</p></div>
          </div>
        </div>
      </section>

      <section id="fitur" className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-xs font-bold uppercase tracking-wider text-[#2468d8]">Fitur utama</p><h2 className="mt-2 max-w-xl text-3xl font-bold text-[#0b2a5b] dark:text-white">Satu alur belajar yang saling terhubung</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{features.map(([number,title,description], index)=><article key={title} className="border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0b2a5b]"><span className={`text-sm font-black ${index === 3 ? "text-[#e5a21a]" : "text-[#2468d8]"}`}>{number}</span><h3 className="mt-8 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{description}</p></article>)}</div>
      </section>

      <section id="alur" className="border-y border-slate-200 bg-white py-16 dark:border-white/10 dark:bg-[#0b2a5b]"><div className="mx-auto max-w-6xl px-4"><p className="text-xs font-bold uppercase tracking-wider text-[#e5a21a]">Cara belajar</p><h2 className="mt-2 text-3xl font-bold">Mulai, evaluasi, ulangi</h2><div className="mt-8 grid gap-8 md:grid-cols-3">{[["1","Pilih tujuan","Gunakan Mode Belajar untuk memahami soal atau Mode Ujian untuk melatih waktu."],["2","Periksa hasil","Baca pembahasan dan simpan soal yang belum dikuasai ke dalam pola belajar kamu."],["3","Perbaiki kelemahan","Ulangi bidang yang lemah, lalu ukur kembali melalui tryout berikutnya."]].map(([number,title,body])=><article key={number} className="border-l-4 border-[#2468d8] pl-5"><span className="text-xs font-black text-[#e5a21a]">LANGKAH {number}</span><h3 className="mt-2 text-xl font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{body}</p></article>)}</div></div></section>

      <section id="tryout" className="mx-auto max-w-6xl px-4 py-16"><div className="grid overflow-hidden border border-[#0b2a5b]/15 bg-[#0b2a5b] text-white md:grid-cols-[1fr_auto]"><div className="p-7 sm:p-10"><p className="text-xs font-bold uppercase tracking-wider text-[#e5a21a]">Agenda mingguan</p><h2 className="mt-2 text-3xl font-bold">Tryout Nasional Gratis</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">Sesi bersama untuk berlatih secara terukur dan membandingkan hasil secara sehat. Jadwal, kode akses, serta ketentuan ditampilkan langsung di aplikasi.</p><ul className="mt-5 grid gap-2 text-sm text-blue-50 sm:grid-cols-3"><li>✓ Satu kesempatan</li><li>✓ Peringkat per sesi</li><li>✓ Pembahasan setelah agenda</li></ul></div><div className="grid min-w-56 place-items-center bg-[#e5a21a] p-8 text-center text-[#0b2a5b]"><strong className="text-5xl">0</strong><span className="mt-1 text-xs font-black uppercase tracking-wider">Biaya peserta</span><Link to="/register" className="mt-5 border-2 border-[#0b2a5b] px-4 py-2 text-xs font-black">Buat akun</Link></div></div></section>

      <section id="faq" className="border-t border-slate-200 bg-white py-16 dark:border-white/10 dark:bg-[#07152f]"><div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-[.7fr_1.3fr]"><div><p className="text-xs font-bold uppercase tracking-wider text-[#2468d8]">FAQ</p><h2 className="mt-2 text-3xl font-bold text-[#0b2a5b] dark:text-white">Sebelum mulai belajar</h2><p className="mt-3 text-sm leading-6 text-slate-500">Informasi penting tentang materi, hasil, akses, dan kedudukan NalarASN.</p></div><div className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-white/10 dark:border-white/10">{faqs.map(([question,answer])=><details key={question} className="group py-5"><summary className="cursor-pointer list-none font-bold text-[#0b2a5b] dark:text-white">{question}<span className="float-right ml-4 text-xl text-[#e5a21a] group-open:rotate-45">+</span></summary><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">{answer}</p></details>)}</div></div></section>

      <section className="bg-[#2468d8] py-12 text-white"><div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-5 px-4 sm:flex-row sm:items-center"><div><h2 className="text-2xl font-bold">Siap memulai latihan?</h2><p className="mt-1 text-sm text-blue-100">Buat akun gratis dan mulai dari bidang yang paling ingin kamu perkuat.</p></div><Link to="/register" className="bg-white px-6 py-3 text-sm font-black text-[#0b2a5b]">Daftar sekarang</Link></div></section>
    </main>

    <footer className="border-t border-slate-200 bg-white dark:border-white/10 dark:bg-[#07152f]"><div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm sm:grid-cols-[1fr_auto]"><div><div className="inline-block rounded-lg bg-white p-1.5"><img src={logo} alt="NalarASN" className="h-8 w-auto object-contain" /></div><p className="mt-2 max-w-md text-xs leading-5 text-slate-500">Platform latihan mandiri. Soal, nilai, dan peringkat bukan hasil resmi serta tidak menjamin kelulusan.</p></div><div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300"><Link to="/panduan">Panduan</Link><Link to="/privasi">Privasi</Link><Link to="/ketentuan">Ketentuan</Link><Link to="/login">Kritik & Saran</Link></div><p className="text-xs text-slate-500 sm:col-span-2">© {new Date().getFullYear()} NalarASN. Dikembangkan sebagai sarana belajar mandiri.</p></div></footer>
  </div>;
}
