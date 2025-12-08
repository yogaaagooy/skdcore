// src/pages/ExamPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getExamById, saveExamResult } from "../services/exam";
import { auth } from "../services/firebase";

const PASSING_TIU = 80;
const PASSING_TWK = 65;
const PASSING_TKP = 166;
const PAGE_SIZE = 20; // jumlah nomor soal per blok (1–20, 21–40, dst.)

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function ExamPage() {
  const params = useParams();
  const examId = params.id || params.examId || params.examID || "skd-110";

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  const [current, setCurrent] = useState(0); // index soal aktif
  const [answers, setAnswers] = useState({}); // jawaban user per index
  const [submitted, setSubmitted] = useState(false);

  const [result, setResult] = useState(null);
  const [showReview, setShowReview] = useState(false);

  const [timeLeft, setTimeLeft] = useState(null);

  const user = auth.currentUser;
  const participantName = user?.displayName || user?.email || "-";
  const participantEmail = user?.email || "-";

  // ===== LOAD UJIAN =====
  useEffect(() => {
    async function load() {
      if (!examId) {
        setLoading(false);
        setExam(null);
        return;
      }
      const data = await getExamById(examId);
      setExam(data || null);
      setLoading(false);
    }
    load();
  }, [examId]);

  const questions = Array.isArray(exam?.questions) ? exam.questions : [];
  const totalQuestions = questions.length;

  // Set timer ketika exam sudah ada
  useEffect(() => {
    if (!exam) return;
    const dur = exam.durationMinutes || 100;
    setTimeLeft(dur * 60); // detik
  }, [exam]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null) return;
    if (submitted) return;
    if (timeLeft <= 0) {
      // waktu habis -> auto submit
      handleSubmit(true);
      return;
    }

    const t = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, submitted]);

  // ===== HANDLE JAWABAN =====
  function handleAnswer(index) {
    setAnswers((prev) => ({ ...prev, [current]: index }));
  }

  // Simpan dan lanjutkan (model BKN)
  function handleSaveAndNext() {
    if (current < totalQuestions - 1) {
      setCurrent((c) => c + 1);
    } else {
      const ok = window.confirm(
        "Anda berada di soal terakhir. Selesaikan ujian?"
      );
      if (ok) handleSubmit(false);
    }
  }

  // Lewatkan soal (tidak mengubah jawaban)
  function handleSkip() {
    if (current < totalQuestions - 1) {
      setCurrent((c) => c + 1);
    } else {
      // kalau di terakhir, loop ke awal
      setCurrent(0);
    }
  }

  // tombol “Selesai Ujian” manual
  function handleManualFinish() {
    const ok = window.confirm(
      "Yakin ingin menyelesaikan ujian sekarang? Jawaban yang belum diisi akan dianggap kosong."
    );
    if (!ok) return;
    handleSubmit(false);
  }

  // ===== HITUNG NILAI & SUBMIT =====
  async function handleSubmit(auto = false) {
    if (!questions.length) return;

    let scoreTIU = 0;
    let scoreTWK = 0;
    let scoreTKP = 0;

    questions.forEach((q, i) => {
      const tipe = q.tipe;
      const userAnswer = answers[i];

      if (tipe === "TIU" || tipe === "TWK") {
        const correct = q.correctOption;
        if (typeof correct === "number" && userAnswer === correct) {
          if (tipe === "TIU") scoreTIU += 5;
          if (tipe === "TWK") scoreTWK += 5;
        }
      }

      if (tipe === "TKP") {
        const scores = Array.isArray(q.scores) ? q.scores : [];
        if (typeof userAnswer === "number") {
          scoreTKP += scores[userAnswer] || 0;
        }
      }
    });

    const total = scoreTIU + scoreTWK + scoreTKP;

    const lulus =
      scoreTWK >= PASSING_TWK &&
      scoreTIU >= PASSING_TIU &&
      scoreTKP >= PASSING_TKP;

    const hasil = {
      tiu: scoreTIU,
      twk: scoreTWK,
      tkp: scoreTKP,
      total,
      lulus,
      autoSubmit: auto,
    };

    setResult(hasil);

    await saveExamResult(examId, hasil, answers);

    setSubmitted(true);
  }

  // ===== UI: LOADING / ERROR =====
  if (loading) {
    return (
      <div className="p-6 text-white">
        Loading ujian...
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-6 text-white">
        Ujian tidak ditemukan.
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalQuestions - answeredCount;

  // ===== UI: HASIL UJIAN =====
  if (submitted && result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-200/20 to-purple-900/40 text-white p-6">
        <h1 className="text-2xl font-bold mb-4">Hasil Ujian</h1>

        <div className="bg-gray-800 p-4 rounded mb-4">
          <p className="mb-1">
            <b>TIU:</b> {result.tiu} / 175
          </p>
          <p className="mb-1">
            <b>TWK:</b> {result.twk} / 150
          </p>
          <p className="mb-1">
            <b>TKP:</b> {result.tkp} / 225
          </p>
          <p className="mt-3 text-lg">
            <b>Total SKD:</b> {result.total} / 550
          </p>

          <p className="mt-2 text-sm opacity-70">
            Passing Grade: TWK {PASSING_TWK} | TIU {PASSING_TIU} | TKP{" "}
            {PASSING_TKP}
          </p>

          <p
            className={`mt-4 text-xl font-bold ${
              result.lulus ? "text-green-400" : "text-red-400"
            }`}
          >
            {result.lulus
              ? "✅ LULUS Passing Grade SKD"
              : "❌ TIDAK LULUS Passing Grade SKD"}
          </p>

          {result.autoSubmit && (
            <p className="mt-2 text-sm text-yellow-300">
              * Ujian disubmit otomatis karena waktu habis.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={() => setShowReview((v) => !v)}
            className="px-4 py-2 bg-blue-600 rounded"
          >
            {showReview ? "Sembunyikan Pembahasan" : "Lihat Pembahasan"}
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-700 rounded"
          >
            Cetak / Simpan PDF
          </button>

          <Link
            to={`/leaderboard/${examId}`}
            className="px-4 py-2 bg-purple-600 rounded"
          >
            Lihat Leaderboard
          </Link>
        </div>

        {/* MODE PEMBAHASAN */}
        {showReview && (
          <div className="mt-4 space-y-4">
            {questions.map((q, idx) => {
              const tipe = q.tipe;
              const options = Array.isArray(q.options) ? q.options : [];
              const ua = answers[idx];

              let info = "";
              if (tipe === "TIU" || tipe === "TWK") {
                const correct = q.correctOption;
                if (ua === undefined) {
                  info = "Belum dijawab.";
                } else if (ua === correct) {
                  info = "Jawaban kamu: BENAR.";
                } else {
                  info = "Jawaban kamu: SALAH.";
                }
              } else if (tipe === "TKP") {
                const scores = Array.isArray(q.scores) ? q.scores : [];
                const bestScore = Math.max(...scores, 0);
                const bestIndex = scores.indexOf(bestScore);
                const userScore =
                  typeof ua === "number" ? scores[ua] || 0 : 0;
                info = `Skor jawaban kamu: ${userScore}. Skor tertinggi soal ini: ${bestScore}.`;
                if (ua === bestIndex) {
                  info += " (Pilihan kamu sudah paling tinggi.)";
                }
              }

              return (
                <div key={idx} className="bg-gray-800 p-4 rounded">
                  <p className="font-semibold mb-2">
                    {idx + 1}. [{q.tipe || "-"}] {q.text}
                  </p>

                  {options.map((opt, i) => {
                    const isUser = ua === i;
                    const isCorrect =
                      q.tipe === "TIU" || q.tipe === "TWK"
                        ? i === q.correctOption
                        : false;

                    let badge = "";
                    if (q.tipe === "TIU" || q.tipe === "TWK") {
                      if (isCorrect) badge = "Kunci";
                    } else if (q.tipe === "TKP") {
                      const scores = Array.isArray(q.scores) ? q.scores : [];
                      const bestScore = Math.max(...scores, 0);
                      if (scores[i] === bestScore)
                        badge = `Skor tertinggi (${scores[i]})`;
                      else badge = `Skor ${scores[i] || 0}`;
                    }

                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-2 mb-1 text-sm ${
                          isUser ? "font-semibold" : ""
                        }`}
                      >
                        <span>
                          {String.fromCharCode(65 + i)}. {opt}
                        </span>
                        {badge && (
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-700">
                            {badge}
                          </span>
                        )}
                        {isUser && (
                          <span className="text-xs text-yellow-300">
                            (Jawaban kamu)
                          </span>
                        )}
                      </div>
                    );
                  })}

                  <p className="mt-2 text-sm opacity-80">{info}</p>

                  {q.explanation && (
                    <p className="mt-2 text-sm text-green-300">
                      Pembahasan: {q.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ===== UI: SOAL BERJALAN (MODE CAT BKN) =====
  const q = questions[current] || {};
  const options = Array.isArray(q.options) ? q.options : [];
  const userAnswer = answers[current];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200/20 to-purple-900/40 text-gray-900">
      {/* HEADER BKN STYLE */}
      <div className="bg-blue-900 text-white px-6 py-3 flex items-center">
        <div className="font-bold text-lg">
          COMPUTER ASSISTED TEST
          <div className="text-xs font-normal">
            BADAN KEPEGAWAIAN NEGARA
          </div>
        </div>
      </div>

      {/* BAR INFO ATAS */}
      <div className="bg-white/90 shadow flex flex-wrap items-center px-6 py-3 gap-6 text-sm">
        <div>
          <div className="font-semibold">Batas Waktu</div>
          <div>{exam.durationMinutes || 100} menit</div>
        </div>
        <div>
          <div className="font-semibold">Jumlah Soal</div>
          <div>{totalQuestions}</div>
        </div>
        <div className="text-green-700">
          <div className="font-semibold">Soal Dijawab</div>
          <div>{answeredCount}</div>
        </div>
        <div className="text-red-700">
          <div className="font-semibold">Belum Dijawab</div>
          <div>{unansweredCount}</div>
        </div>

        <button
          onClick={handleManualFinish}
          className="ml-auto px-4 py-2 bg-red-600 text-white rounded shadow"
        >
          Selesai Ujian
        </button>
      </div>

      {/* INFORMASI PESERTA */}
      <div className="px-6 pt-4">
        <div className="bg-white/90 rounded shadow mb-3">
          <div className="border-b px-4 py-2 font-semibold text-sm bg-gray-100">
            Informasi Ujian
          </div>
          <div className="px-4 py-2 text-sm">
            <div className="flex justify-between">
              <span>Nama Ujian</span>
              <span>: {exam.title}</span>
            </div>
            <div className="flex justify-between">
              <span>Kode Ujian</span>
              <span>: {exam.id}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/90 rounded shadow mb-4">
          <div className="border-b px-4 py-2 font-semibold text-sm bg-gray-100">
            Informasi Peserta
          </div>
          <div className="px-4 py-2 text-sm">
            <div className="flex justify-between">
              <span>Nama Peserta</span>
              <span>: {participantName}</span>
            </div>
            <div className="flex justify-between">
              <span>Email</span>
              <span>: {participantEmail}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AREA SOAL + NAV */}
      <div className="px-6 pb-10">
        {/* SOAL */}
        <div className="bg-white/95 rounded shadow p-4 mb-4">
          <p className="font-semibold mb-2">
            Soal No. {current + 1}
          </p>
          <p className="mb-4 text-sm">
            {q.text}{" "}
            {q.tipe && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-200">
                {q.tipe}
              </span>
            )}
          </p>

          {options.map((opt, i) => (
            <label
              key={i}
              className="flex items-center gap-2 mb-2 cursor-pointer text-sm"
            >
              <input
                type="radio"
                name="opsi"
                checked={userAnswer === i}
                onChange={() => handleAnswer(i)}
              />
              <span>
                {String.fromCharCode(65 + i)}. {opt}
              </span>
            </label>
          ))}

          {options.length === 0 && (
            <p className="text-sm text-gray-500">
              (Opsi jawaban belum diisi.)
            </p>
          )}
        </div>

        {/* TOMBOL BAWAH */}
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={handleSaveAndNext}
            className="px-4 py-2 bg-blue-600 text-white rounded shadow text-sm"
          >
            Simpan dan Lanjutkan
          </button>
          <button
            onClick={handleSkip}
            className="px-4 py-2 bg-gray-500 text-white rounded shadow text-sm"
          >
            Lewatkan soal ini
          </button>
        </div>

        {/* NAVIGASI NOMOR SOAL (CAT BKN STYLE, 20 per halaman) */}
        <div className="bg-white/90 rounded shadow p-3 text-sm">
          <div className="mb-2 flex justify-center gap-6">
            <span>
              <span className="inline-block w-4 h-4 bg-green-500 mr-1" />
              Hijau : Dijawab
            </span>
            <span>
              <span className="inline-block w-4 h-4 bg-red-500 mr-1" />
              Merah : Belum dijawab
            </span>
          </div>

          {(() => {
            // tentukan blok (1–20, 21–40, dst) dari soal yang sedang aktif
            const pageSize = PAGE_SIZE || 20;
            const currentBlock = Math.floor(current / pageSize);
            const maxBlock = Math.max(
              0,
              Math.floor((totalQuestions - 1) / pageSize)
            );
            const start = currentBlock * pageSize;
            const end = Math.min(totalQuestions, start + pageSize);

            return (
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {/* Panah kiri: pindah ke blok sebelumnya */}
                <button
                  onClick={() => {
                    if (currentBlock > 0) {
                      const firstIndex = (currentBlock - 1) * pageSize;
                      setCurrent(firstIndex);
                    }
                  }}
                  disabled={currentBlock === 0}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm ${
                    currentBlock === 0
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  ‹
                </button>

                {/* Nomor soal di blok aktif (maks 20) */}
                {questions.slice(start, end).map((_, idxInPage) => {
                  const idx = start + idxInPage;
                  const answered = answers[idx] !== undefined;
                  const isCurrent = idx === current;

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrent(idx)}
                      className={`w-8 h-8 text-xs rounded-sm border ${
                        isCurrent
                          ? "border-yellow-400 bg-yellow-200 text-black"
                          : answered
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}

                {/* Panah kanan: pindah ke blok berikutnya */}
                <button
                  onClick={() => {
                    if (currentBlock < maxBlock) {
                      const firstIndex = (currentBlock + 1) * pageSize;
                      setCurrent(firstIndex);
                    }
                  }}
                  disabled={currentBlock === maxBlock}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm ${
                    currentBlock === maxBlock
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  ›
                </button>
              </div>
            );
          })()}
        </div>
      </div>

      {/* TIMER POJOK KANAN BAWAH */}
      <div className="fixed right-4 bottom-4 bg-black/80 text-white px-4 py-2 rounded-lg shadow-lg font-mono text-lg">
        {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
      </div>
    </div>
  );
}
