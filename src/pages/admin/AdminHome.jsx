// src/pages/admin/AdminHome.jsx
import React from "react";
import { Link } from "react-router-dom";
import { auth } from "../../services/firebase";
import useRole from "../../hooks/useRole";

export default function AdminHome() {
  const user = auth.currentUser;
  const { role } = useRole();

  const email = user?.email || "-";

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              Admin Panel
            </h1>
            <p className="text-sm text-slate-300">
              Selamat datang di halaman admin. Kelola ujian dan pantau hasil simulasi SKD.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Login sebagai: <span className="font-semibold">{email}</span>{" "}
              {role && <span>({role})</span>}
            </p>
          </div>

          <Link
            to="/dashboard"
            className="px-4 py-2 bg-slate-700 rounded-lg text-xs sm:text-sm hover:bg-slate-600"
          >
            ← Kembali ke Dashboard Peserta
          </Link>
        </div>

        {/* Menu cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Dashboard Admin */}
          <Link
            to="/admin/dashboard"
            className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 shadow hover:border-slate-600 hover:bg-slate-900/80 transition"
          >
            <h2 className="font-semibold text-lg mb-1">
              Dashboard Admin
            </h2>
            <p className="text-sm text-slate-300 mb-2">
              Lihat statistik peserta, ujian, dan performa simulasi SKD secara keseluruhan.
            </p>
            <p className="text-[11px] text-slate-400">
              Termasuk jumlah peserta, total ujian, total percobaan, dan ringkasan per ujian.
            </p>
          </Link>

          {/* Kelola Soal / Bank Soal */}
          <Link
            to="/admin/questions"
            className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 shadow hover:border-slate-600 hover:bg-slate-900/80 transition"
          >
            <h2 className="font-semibold text-lg mb-1">
              Kelola Soal
            </h2>
            <p className="text-sm text-slate-300 mb-2">
              Tambah, edit, atau hapus soal ujian (TIU, TWK, TKP) untuk setiap paket.
            </p>
            <p className="text-[11px] text-slate-400">
              Cocok untuk maintenance bank soal dan percobaan baru.
            </p>
          </Link>

          {/* Import Soal JSON */}
          <Link
            to="/admin/import"
            className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 shadow hover:border-slate-600 hover:bg-slate-900/80 transition"
          >
            <h2 className="font-semibold text-lg mb-1">
              Import Soal (JSON)
            </h2>
            <p className="text-sm text-slate-300 mb-2">
              Import paket ujian dalam bentuk file JSON sekaligus (misalnya 110 soal SKD).
            </p>
            <p className="text-[11px] text-slate-400">
              Mempercepat setup ujian dalam jumlah besar.
            </p>
          </Link>

          {/* Placeholder Data Peserta / Fitur Lanjut */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 shadow">
            <h2 className="font-semibold text-lg mb-1">
              Data Peserta (coming soon)
            </h2>
            <p className="text-sm text-slate-300 mb-2">
              Rencana fitur: melihat daftar peserta, jumlah percobaan, skor terbaik, dan detail performa.
            </p>
            <p className="text-[11px] text-slate-500">
              Kalau mau, nanti kita bikin halaman ini terpisah.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
