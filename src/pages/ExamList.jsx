// src/pages/ExamList.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getExams } from "../services/exam";

export default function ExamList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getExams();
        setExams(data || []);
      } catch (err) {
        console.error("Error getExams:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              Daftar Ujian SKD
            </h1>
            <p className="text-sm opacity-70">
              Pilih paket ujian yang ingin kamu kerjakan.
            </p>
          </div>

          <Link
            to="/dashboard"
            className="px-4 py-2 bg-slate-800 rounded-lg text-sm hover:bg-slate-700"
          >
            ← Kembali ke Dashboard
          </Link>
        </div>

        {/* Konten */}
        {loading ? (
          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-4 text-sm text-slate-300">
            Memuat daftar ujian...
          </div>
        ) : exams.length === 0 ? (
          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-4 text-sm text-slate-300">
            Belum ada ujian yang tersedia.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 shadow hover:shadow-lg hover:border-slate-600 transition"
              >
                <h2 className="font-semibold text-lg mb-1">
                  {exam.title}
                </h2>
                <p className="text-xs text-slate-300 mb-3">
                  ID Ujian: <span className="font-mono">{exam.id}</span>
                </p>
                <p className="text-sm text-slate-200 mb-3">
                  {exam.description}
                </p>
                <p className="text-xs text-slate-400 mb-4">
                  Durasi:{" "}
                  <span className="font-semibold">
                    {exam.durationMinutes || 0} menit
                  </span>
                </p>

                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">
                    Skema nilai: TIU/TWK benar = 5, salah = 0; TKP berbobot
                    1–5 per opsi.
                  </span>
                  <Link
                    to={`/exam/${exam.id}`}
                    className="ml-4 px-4 py-2 bg-blue-600 rounded-lg text-xs font-semibold whitespace-nowrap hover:bg-blue-500"
                  >
                    Mulai ujian
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
