// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db, auth } from "../../services/firebase";
import {
  collection,
  collectionGroup,
  getDocs,
} from "firebase/firestore";

const PASSING_TIU = 80;
const PASSING_TWK = 65;
const PASSING_TKP = 166;

function normalizeScore(raw) {
  if (typeof raw === "number") {
    return {
      tiu: null,
      twk: null,
      tkp: null,
      total: raw,
      lulus: null,
    };
  }

  if (raw && typeof raw === "object") {
    const tiu = raw.tiu ?? 0;
    const twk = raw.twk ?? 0;
    const tkp = raw.tkp ?? 0;
    const total = raw.total ?? tiu + twk + tkp;
    const lulus =
      typeof raw.lulus === "boolean"
        ? raw.lulus
        : twk >= PASSING_TWK &&
          tiu >= PASSING_TIU &&
          tkp >= PASSING_TKP;

    return { tiu, twk, tkp, total, lulus };
  }

  return {
    tiu: null,
    twk: null,
    tkp: null,
    total: null,
    lulus: null,
  };
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalExams, setTotalExams] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [totalPass, setTotalPass] = useState(0);

  const [examSummary, setExamSummary] = useState([]);
  const [recentAttempts, setRecentAttempts] = useState([]);

  const currentUser = auth.currentUser;

  useEffect(() => {
    async function load() {
      try {
        // users
        const usersSnap = await getDocs(collection(db, "users"));
        setTotalUsers(usersSnap.size);

        // exams
        const examsSnap = await getDocs(collection(db, "exams"));
        setTotalExams(examsSnap.size);

        const examMeta = {};
        examsSnap.forEach((doc) => {
          const d = doc.data();
          examMeta[doc.id] = {
            id: doc.id,
            title: d.title || doc.id,
          };
        });

        // semua examResults
        const resultsSnap = await getDocs(
          collectionGroup(db, "examResults")
        );

        const attempts = [];
        const byExam = {};
        let passCount = 0;

        resultsSnap.forEach((docSnap) => {
          const d = docSnap.data();
          const score = normalizeScore(d.score);
          const examId = d.examId || "unknown";

          const userRef = docSnap.ref.parent.parent;
          const uid = userRef?.id || d.uid || null;

          const createdAt =
            d.createdAt?.toDate?.() ?? new Date(0);

          attempts.push({
            id: docSnap.id,
            uid,
            email: d.email || d.userEmail || uid || "-",
            examId,
            score,
            createdAt,
          });

          if (!byExam[examId]) {
            byExam[examId] = {
              examId,
              title: examMeta[examId]?.title || examId,
              attempts: 0,
              pass: 0,
              fail: 0,
              totalScore: 0,
            };
          }

          byExam[examId].attempts += 1;
          byExam[examId].totalScore += score.total ?? 0;

          if (score.lulus === true) {
            byExam[examId].pass += 1;
            passCount += 1;
          } else if (score.lulus === false) {
            byExam[examId].fail += 1;
          }
        });

        setTotalAttempts(attempts.length);
        setTotalPass(passCount);

        const summaryArr = Object.values(byExam).map((ex) => ({
          ...ex,
          avgScore:
            ex.attempts > 0
              ? Math.round(ex.totalScore / ex.attempts)
              : 0,
        }));

        summaryArr.sort((a, b) => b.attempts - a.attempts);
        setExamSummary(summaryArr);

        attempts.sort((a, b) => b.createdAt - a.createdAt);
        setRecentAttempts(attempts.slice(0, 10));
      } catch (err) {
        console.error("Error load admin dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const passRate =
    totalAttempts > 0
      ? Math.round((totalPass / totalAttempts) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-10">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              Admin Dashboard
            </h1>
            <p className="opacity-70 text-sm">
              Monitoring peserta, ujian, dan hasil simulasi SKD.
            </p>
            {currentUser && (
              <p className="text-[11px] text-slate-400 mt-1">
                Login sebagai:{" "}
                <span className="font-semibold">
                  {currentUser.email}
                </span>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              to="/admin"
              className="px-4 py-2 bg-slate-700 rounded-lg text-xs sm:text-sm hover:bg-slate-600"
            >
              ← Kembali ke Admin Home
            </Link>
            <Link
              to="/admin/import"
              className="px-4 py-2 bg-blue-600 rounded-lg text-xs sm:text-sm hover:bg-blue-500"
            >
              Import Soal (JSON)
            </Link>
          </div>
        </div>

        {/* METRIC CARDS */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-sm">
            <div className="text-xs text-slate-300 mb-1">
              Total Peserta
            </div>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Jumlah akun yang terdaftar.
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-sm">
            <div className="text-xs text-slate-300 mb-1">
              Total Ujian
            </div>
            <div className="text-2xl font-bold">{totalExams}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Paket ujian yang tersedia di sistem.
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-sm">
            <div className="text-xs text-slate-300 mb-1">
              Total Percobaan
            </div>
            <div className="text-2xl font-bold">{totalAttempts}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Semua simulasi yang pernah dikerjakan.
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-sm">
            <div className="text-xs text-slate-300 mb-1">
              Lulus Passing Grade
            </div>
            <div className="text-2xl font-bold">
              {totalPass}
              <span className="text-xs ml-1">
                ({passRate}%)
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Berdasarkan ketentuan TWK {PASSING_TWK}, TIU {PASSING_TIU},
              TKP {PASSING_TKP}.
            </div>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-sm text-slate-300">
            Memuat data admin dashboard...
          </div>
        )}

        {!loading && (
          <>
            {/* RINGKASAN PER UJIAN */}
            <div className="bg-slate-950/80 rounded-xl border border-slate-800 overflow-hidden shadow-lg mb-6">
              <div className="px-4 py-3 border-b border-slate-800 text-sm font-semibold flex items-center justify-between">
                <span>Ringkasan Per Ujian</span>
                <span className="text-[11px] text-slate-400">
                  Gunakan halaman Kelola Soal / Import untuk update konten ujian.
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-slate-900 text-xs uppercase tracking-wide text-slate-300">
                      <th className="px-4 py-3 text-left">ID Ujian</th>
                      <th className="px-4 py-3 text-left">Nama Ujian</th>
                      <th className="px-4 py-3 text-center">Peserta</th>
                      <th className="px-4 py-3 text-center">Lulus</th>
                      <th className="px-4 py-3 text-center">Tidak Lulus</th>
                      <th className="px-4 py-3 text-center">
                        Rata-rata SKD
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {examSummary.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-6 text-center text-slate-400"
                        >
                          Belum ada data hasil ujian.
                        </td>
                      </tr>
                    ) : (
                      examSummary.map((ex) => (
                        <tr
                          key={ex.examId}
                          className="border-t border-slate-800 text-xs md:text-sm hover:bg-slate-900/60"
                        >
                          <td className="px-4 py-2 whitespace-nowrap font-mono">
                            {ex.examId}
                          </td>
                          <td className="px-4 py-2">
                            <span className="truncate max-w-xs inline-block">
                              {ex.title}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            {ex.attempts}
                          </td>
                          <td className="px-4 py-2 text-center text-emerald-300">
                            {ex.pass}
                          </td>
                          <td className="px-4 py-2 text-center text-rose-300">
                            {ex.fail}
                          </td>
                          <td className="px-4 py-2 text-center font-semibold">
                            {ex.avgScore}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AKTIVITAS TERBARU */}
            <div className="bg-slate-950/80 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
              <div className="px-4 py-3 border-b border-slate-800 text-sm font-semibold">
                Aktivitas Terbaru (10 percobaan terakhir)
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-slate-900 text-xs uppercase tracking-wide text-slate-300">
                      <th className="px-4 py-3 text-left">Waktu</th>
                      <th className="px-4 py-3 text-left">Peserta</th>
                      <th className="px-4 py-3 text-left">Ujian</th>
                      <th className="px-4 py-3 text-center">Total SKD</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAttempts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-6 text-center text-slate-400"
                        >
                          Belum ada aktivitas.
                        </td>
                      </tr>
                    ) : (
                      recentAttempts.map((row) => (
                        <tr
                          key={row.id + row.uid}
                          className="border-t border-slate-800 text-xs md:text-sm hover:bg-slate-900/60"
                        >
                          <td className="px-4 py-2 whitespace-nowrap">
                            {row.createdAt.toLocaleString("id-ID")}
                          </td>
                          <td className="px-4 py-2">
                            <span className="truncate max-w-[220px] inline-block">
                              {row.email}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap font-mono">
                            {row.examId}
                          </td>
                          <td className="px-4 py-2 text-center font-semibold">
                            {row.score.total ?? "-"}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {row.score.lulus === null ? (
                              <span className="text-slate-400 text-[11px]">
                                -
                              </span>
                            ) : row.score.lulus ? (
                              <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-semibold">
                                Lulus
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-rose-500/15 text-rose-300 text-[11px] font-semibold">
                                Tidak Lulus
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
