// src/pages/HasilSimulasi.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getLatestAttempt } from "../services/results";
import { reportQuestion } from "../services/questionReports";

const PASSING_GRADE = {
  TWK: 65,
  TIU: 80,
  TKP: 166
};

function getStatus(result) {
  if (!result) return { lulus: false, message: "Belum ada data nilai." };
  const twk = result.TWK ?? 0;
  const tiu = result.TIU ?? 0;
  const tkp = result.TKP ?? 0;

  const lulusTWK = twk >= PASSING_GRADE.TWK;
  const lulusTIU = tiu >= PASSING_GRADE.TIU;
  const lulusTKP = tkp >= PASSING_GRADE.TKP;

  const lulusSemua = lulusTWK && lulusTIU && lulusTKP;

  let message = "";
  if (lulusSemua) {
    message = "Selamat! Nilai kamu sudah melewati passing grade di semua bidang.";
  } else {
    const kurang = [];
    if (!lulusTWK) kurang.push("TWK");
    if (!lulusTIU) kurang.push("TIU");
    if (!lulusTKP) kurang.push("TKP");
    message =
      "Belum melewati passing grade. Fokus tingkatkan nilai di: " + kurang.join(", ") + ".";
  }

  return { lulus: lulusSemua, message, detail: { lulusTWK, lulusTIU, lulusTKP } };
}

function formatDate(str) {
  if (!str) return "-";
  try {
    return new Date(str).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "-";
  }
}

export default function HasilSimulasi() {
  const location = useLocation();
  const navigate = useNavigate();

  const [result, setResult] = useState(location.state?.result || null);
  const [detail, setDetail] = useState(location.state?.detail || null);
  const [reported, setReported] = useState({});

  async function sendQuestionReport(question) {
    const reason = window.prompt("Jelaskan masalah pada soal ini (misalnya jawaban keliru, pertanyaan ambigu, atau salah tulis):");
    if (!reason?.trim()) return;
    try {
      await reportQuestion(question, reason.trim());
      setReported((current) => ({ ...current, [question.id]: true }));
    } catch (error) {
      window.alert(error.message);
    }
  }

  useEffect(() => {
    if (result) return;
    getLatestAttempt().then((attempt) => {
      setResult(attempt?.scores || null);
      setDetail(null);
    }).catch(() => setResult(null));
  }, [result]);

  const twk = result?.TWK ?? 0;
  const tiu = result?.TIU ?? 0;
  const tkp = result?.TKP ?? 0;

  const status = getStatus(result);

  const questions = detail?.questions || [];
  const answersMap = detail?.answers || {};
  const hasReview = questions.length > 0;
  const reviewLockedUntil = detail?.reviewLockedUntil || null;

  if (!result) {
    return (
      <div className="app-page min-h-screen bg-gray-50 dark:bg-slate-950 dark:text-slate-50">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-12">
          <section className="rounded-3xl border border-gray-200 bg-white px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-3xl text-blue-600 dark:bg-blue-950/40">◷</div>
            <h1 className="mt-5 text-2xl font-bold">Belum ada hasil latihan</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-slate-400">
              Selesaikan satu latihan atau tryout terlebih dahulu. Nilai dan pembahasan akan muncul di halaman ini.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button onClick={() => navigate("/dashboard")} className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800">Beranda</button>
              <button onClick={() => navigate("/latihan")} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700">Pilih latihan</button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-page min-h-screen bg-gray-50 dark:bg-slate-950 dark:text-slate-50">
      <Navbar />

      {/* Body */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Status umum */}
        <section className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-gray-200 p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">Ringkasan hasil SKD kamu</h1>
              <p className="text-sm text-gray-600 dark:text-slate-300">
                Lihat apakah nilai kamu sudah melewati passing grade resmi SKD.
              </p>
            </div>
            <div
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                status.lulus
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700"
                  : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700"
              }`}
            >
              {status.lulus ? "LULUS PASSING GRADE" : "BELUM LULUS PASSING GRADE"}
            </div>
          </div>

          <p className="text-sm text-gray-700 dark:text-slate-200">{status.message}</p>
        </section>

        {/* Nilai per bidang */}
        <section className="grid md:grid-cols-3 gap-4">
          {/* TWK */}
          <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-blue-600 mb-1">TWK</p>
            <p className="text-sm text-gray-500 dark:text-slate-300 mb-3">
              Tes Wawasan Kebangsaan
            </p>
            <p className="text-3xl font-bold mb-1">
              {twk}
              <span className="text-sm text-gray-400"> / {PASSING_GRADE.TWK}</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
              Passing grade TWK: {PASSING_GRADE.TWK}
            </p>
            <p
              className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium ${
                status.detail?.lulusTWK
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700"
                  : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700"
              }`}
            >
              {status.detail?.lulusTWK ? "Lulus TWK" : "Belum lulus TWK"}
            </p>
          </div>

          {/* TIU */}
          <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-blue-600 mb-1">TIU</p>
            <p className="text-sm text-gray-500 dark:text-slate-300 mb-3">
              Tes Intelegensi Umum
            </p>
            <p className="text-3xl font-bold mb-1">
              {tiu}
              <span className="text-sm text-gray-400"> / {PASSING_GRADE.TIU}</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
              Passing grade TIU: {PASSING_GRADE.TIU}
            </p>
            <p
              className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium ${
                status.detail?.lulusTIU
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700"
                  : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700"
              }`}
            >
              {status.detail?.lulusTIU ? "Lulus TIU" : "Belum lulus TIU"}
            </p>
          </div>

          {/* TKP */}
          <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-blue-600 mb-1">TKP</p>
            <p className="text-sm text-gray-500 dark:text-slate-300 mb-3">
              Tes Karakteristik Pribadi
            </p>
            <p className="text-3xl font-bold mb-1">
              {tkp}
              <span className="text-sm text-gray-400"> / {PASSING_GRADE.TKP}</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
              Passing grade TKP: {PASSING_GRADE.TKP}
            </p>
            <p
              className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium ${
                status.detail?.lulusTKP
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700"
                  : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700"
              }`}
            >
              {status.detail?.lulusTKP ? "Lulus TKP" : "Belum lulus TKP"}
            </p>
          </div>
        </section>

        {/* Tombol aksi */}
        <section className="flex flex-col md:flex-row justify-between gap-3">
          <div className="text-xs text-gray-500 dark:text-slate-400 max-w-md">
            <p>
              Angka passing grade di atas mengikuti aturan SKD umum terbaru. Nilai di aplikasi
              ini hanya hasil latihan, bukan hasil resmi.
            </p>
            {location.state?.detail && (
              <p className="mt-1">
                Review soal di bawah hanya berlaku untuk sesi yang baru saja kamu
                kerjakan. Jika halaman ini di-reload, review soal tidak ditampilkan.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 text-sm hover:bg-gray-50 dark:hover:bg-slate-800"
            >
              Beranda
            </button>
            <button
              type="button"
              onClick={() => navigate("/latihan")}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
            >
              Pilih latihan
            </button>
          </div>
        </section>

        {/* REVIEW SOAL */}
        {reviewLockedUntil && !hasReview && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
            <h2 className="font-bold">Pembahasan masih dikunci</h2>
            <p className="mt-1">
              Agar Tryout Nasional tetap adil, pembahasan baru dapat dilihat setelah periode berakhir pada {formatDate(reviewLockedUntil)}.
            </p>
          </section>
        )}
        {hasReview && (
          <section className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h2 className="text-sm font-semibold">Review soal & pembahasan</h2>
              <span className="text-[11px] text-gray-500 dark:text-slate-400">
                Total soal: {questions.length}
              </span>
            </div>

            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
              {questions.map((q, index) => {
                const userAnswerId = answersMap[q.id];
                const options = q.options || [];

                // skor tertinggi untuk tandai jawaban terbaik
                let bestScore = 0;
                options.forEach((o) => {
                  if (typeof o.score === "number" && o.score > bestScore) {
                    bestScore = o.score;
                  }
                });

                return (
                  <div
                    key={q.id}
                    className="border border-gray-200 dark:border-slate-800 rounded-xl p-3 text-xs space-y-2"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-200">
                          Soal {index + 1}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full border border-gray-200 dark:border-slate-700">
                          {q.category}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-500 dark:text-slate-400">
                        Jawaban kamu:{" "}
                        {userAnswerId ? (
                          <strong>{userAnswerId}</strong>
                        ) : (
                          <span className="text-red-500 font-semibold">Belum dijawab</span>
                        )}
                      </span>
                    </div>

                    <p className="text-[13px] font-medium text-gray-900 dark:text-slate-50">
                      {q.question}
                    </p>

                    <div className="space-y-1">
                      {options.map((opt) => {
                        const isUser = userAnswerId === opt.id;
                        const isBest = opt.score === bestScore && bestScore > 0;

                        let borderClass =
                          "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900";
                        let textClass = "text-gray-800 dark:text-slate-100";
                        if (isBest) {
                          borderClass =
                            "border-emerald-500 dark:border-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40";
                          textClass = "text-emerald-900 dark:text-emerald-100";
                        }
                        if (isUser && !isBest) {
                          borderClass =
                            "border-red-400 dark:border-red-400 bg-red-50/70 dark:bg-red-950/40";
                          textClass = "text-red-900 dark:text-red-100";
                        }
                        if (isUser && isBest) {
                          borderClass =
                            "border-blue-500 dark:border-blue-400 bg-blue-50/80 dark:bg-blue-950/40";
                          textClass = "text-blue-900 dark:text-blue-100";
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`flex items-start justify-between gap-2 rounded-lg border px-2 py-1.5 ${borderClass}`}
                          >
                            <div className={`flex-1 ${textClass}`}>
                              <span className="font-semibold mr-1">{opt.id}.</span>
                              <span>{opt.text}</span>
                            </div>
                            <div className="text-[10px] text-gray-500 dark:text-slate-400 text-right min-w-[60px]">
                              <div>Skor: {opt.score ?? 0}</div>
                              {isBest && <div className="font-semibold">Paling tepat</div>}
                              {isUser && <div className="font-semibold">Jawaban kamu</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="mt-1 text-[11px] text-gray-600 dark:text-slate-300 border-t border-gray-100 dark:border-slate-800 pt-2">
                        <span className="font-semibold">Pembahasan: </span>
                        <span>{q.explanation}</span>
                      </div>
                    )}
                    <button disabled={reported[q.id]} onClick={() => sendQuestionReport(q)} className="mt-2 text-[11px] font-semibold text-slate-500 hover:text-red-600 disabled:text-emerald-600">{reported[q.id] ? "✓ Laporan terkirim" : "Laporkan masalah pada soal"}</button>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
