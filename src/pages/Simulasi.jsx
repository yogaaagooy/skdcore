import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import logo from "../assets/logo.png";
import UserDropdown from "../components/UserDropdown";
import { getCurrentUser } from "../utils/auth";
import { getQuestionBank } from "../services/questions";
import { logout } from "../services/auth";
import { getAttemptCount, saveAttempt } from "../services/results";

const LAST_DETAIL_KEY = "skdcore_last_simulation_detail_v1";

// Soal default (dipakai kalau belum ada bank soal import)
const DEFAULT_QUESTIONS = [
  {
    id: 1,
    category: "TWK",
    question: "Nilai yang terkandung dalam sila pertama Pancasila adalah...",
    options: [
      { id: "A", text: "Kemanusiaan dan keadilan", score: 0 },
      { id: "B", text: "Ketuhanan Yang Maha Esa", score: 5 },
      { id: "C", text: "Persatuan Indonesia", score: 0 },
      { id: "D", text: "Kerakyatan yang dipimpin oleh hikmat", score: 0 },
      { id: "E", text: "Keadilan sosial bagi seluruh rakyat Indonesia", score: 0 }
    ]
  },
  {
    id: 2,
    category: "TIU",
    question: "3, 6, 12, 24, ... Angka selanjutnya adalah?",
    options: [
      { id: "A", text: "36", score: 0 },
      { id: "B", text: "40", score: 0 },
      { id: "C", text: "48", score: 5 },
      { id: "D", text: "52", score: 0 },
      { id: "E", text: "60", score: 0 }
    ]
  },
  {
    id: 3,
    category: "TKP",
    question:
      "Atasan memberikan tugas mendadak menjelang jam pulang, padahal kamu sudah janji dengan keluarga. Sikap kamu?",
    options: [
      { id: "A", text: "Menolak karena sudah ada rencana penting", score: 2 },
      { id: "B", text: "Mengerjakan sebisanya lalu pulang tepat waktu", score: 3 },
      { id: "C", text: "Meminta waktu tambahan tapi tetap mengutamakan tugas", score: 5 },
      { id: "D", text: "Menyerahkan ke rekan kerja agar tugas tetap jalan", score: 4 },
      { id: "E", text: "Mengabaikan tugas karena merasa tidak adil", score: 1 }
    ]
  }
];

// Timer BKN
function getTotalTimeSeconds(mode) {
  const m = (mode || "all").toLowerCase();
  if (m === "twk") return 25 * 60;
  if (m === "tiu") return 30 * 60;
  if (m === "tkp") return 35 * 60;
  return 100 * 60; // full SKD
}

// Bagi per mode
function buildQuestionBank(allQuestions) {
  const twk = allQuestions.filter((q) => q.category === "TWK").slice(0, 30);
  const tiu = allQuestions.filter((q) => q.category === "TIU").slice(0, 35);
  const tkp = allQuestions.filter((q) => q.category === "TKP").slice(0, 45);
  return {
    all: [...twk, ...tiu, ...tkp],
    twk,
    tiu,
    tkp
  };
}

const PAGE_SIZE = 10; // jumlah nomor yang tampil per blok

export default function Simulasi() {
  const { mode, num } = useParams();
  const currentMode = (mode || "all").toLowerCase();
  const simulasiNum = num ? parseInt(num, 10) : null;
  const navigate = useNavigate();

  const [allQuestions, setAllQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState("");
  const [attemptCount, setAttemptCount] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const QUESTION_BANK = buildQuestionBank(allQuestions);
  const QUESTION_SET = QUESTION_BANK[currentMode] || QUESTION_BANK.all;

  // Gunakan key yang berbeda jika dari simulasi spesifik
  const storageKey = simulasiNum 
    ? `skdcore_simulasi_sim${simulasiNum}_state_v1_${currentMode}`
    : `skdcore_simulasi_state_v1_${currentMode}`;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(() =>
    getTotalTimeSeconds(currentMode)
  );

  const currentQuestion = QUESTION_SET[currentIndex];
  const answeredCount = Object.keys(answers).length;

  const totalQuestions = QUESTION_SET.length;
  const currentBlock = Math.floor(currentIndex / PAGE_SIZE);
  const maxBlock = Math.floor((totalQuestions - 1) / PAGE_SIZE);
  const start = currentBlock * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, totalQuestions);

  const currentUser = getCurrentUser();

  useEffect(() => {
    let active = true;
    setQuestionsLoading(true);
    setQuestionsError("");
    getQuestionBank(simulasiNum === null ? "main" : simulasiNum)
      .then((questions) => {
        if (!active) return;
        setAllQuestions(questions.length ? questions : (simulasiNum === null ? DEFAULT_QUESTIONS : []));
      })
      .catch(() => { if (active) setQuestionsError("Soal gagal dimuat dari Firebase. Periksa koneksi lalu coba lagi."); })
      .finally(() => { if (active) setQuestionsLoading(false); });
    return () => { active = false; };
  }, [simulasiNum]);

  useEffect(() => {
    let active = true;
    getAttemptCount(currentMode, simulasiNum)
      .then((count) => { if (active) setAttemptCount(count); })
      .catch(() => { if (active) setAttemptCount(0); });
    return () => { active = false; };
  }, [currentMode, simulasiNum]);

  // Load state dari localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        if (parsed.answers) setAnswers(parsed.answers);
        if (typeof parsed.currentIndex === "number") {
          setCurrentIndex(
            parsed.currentIndex >= 0 && parsed.currentIndex < QUESTION_SET.length
              ? parsed.currentIndex
              : 0
          );
        }
        if (typeof parsed.timeLeft === "number" && parsed.timeLeft > 0) {
          setTimeLeft(parsed.timeLeft);
        } else {
          setTimeLeft(getTotalTimeSeconds(currentMode));
        }
      }
    } catch (err) {
      console.error("Gagal load state simulasi:", err);
    }
  }, [storageKey, currentMode, QUESTION_SET.length]);

  // Timer mundur
  useEffect(() => {
    if (questionsLoading || !QUESTION_SET.length || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, questionsLoading, QUESTION_SET.length]);

  // Auto-submit kalau waktu habis
  useEffect(() => {
    if (timeLeft === 0) {
      handleFinish(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // Auto-save ke localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const data = { answers, currentIndex, timeLeft };
      window.localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (err) {
      console.error("Gagal simpan state simulasi:", err);
    }
  }, [answers, currentIndex, timeLeft, storageKey]);

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function handleSelect(optionId) {
    if (timeLeft <= 0) return;
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId
    }));
  }

  function handlePrev() {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }

  function handleNext() {
    setCurrentIndex((prev) =>
      Math.min(prev + 1, QUESTION_SET.length - 1)
    );
  }

  function handleJumpTo(index) {
    setCurrentIndex(index);
  }

  function calculateResult() {
    const result = { TWK: 0, TIU: 0, TKP: 0 };

    QUESTION_SET.forEach((q) => {
      const selectedId = answers[q.id];
      if (!selectedId) return;
      const selectedOption = q.options.find(
        (opt) => opt.id === selectedId
      );
      if (!selectedOption) return;
      result[q.category] += selectedOption.score;
    });

    return result;
  }

  function clearState() {
    setAnswers({});
    setCurrentIndex(0);
    setTimeLeft(getTotalTimeSeconds(currentMode));
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey);
    }
  }

  async function handleFinish(auto = false) {
    if (finishing) return;
    const result = calculateResult();
    const answered = Object.keys(answers).length;
    const totalQuestionsLocal = QUESTION_SET.length;
    const unanswered = totalQuestionsLocal - answered;

    if (!auto && timeLeft > 0 && unanswered > 0) {
      const ok = window.confirm(
        `Masih ada ${unanswered} soal yang belum dijawab.\n\nTetap akhiri simulasi dan lihat hasil?`
      );
      if (!ok) return;
    }

    setFinishing(true);
    try {
      await saveAttempt({ mode: currentMode, packageNumber: simulasiNum, scores: result, answers, answeredCount: answered, questionCount: totalQuestionsLocal, autoFinished: auto });
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(storageKey);
        const detailPayload = {
          result,
          mode: currentMode,
          date: new Date().toISOString(),
          questions: QUESTION_SET,
          answers
        };
        window.localStorage.setItem(
          LAST_DETAIL_KEY,
          JSON.stringify(detailPayload)
        );
      }
    } catch (err) {
      window.alert(err.message || "Hasil gagal disimpan. Periksa koneksi lalu coba lagi.");
      setFinishing(false);
      return;
    }

    navigate("/hasil-simulasi", {
      state: {
        result,
        detail: {
          questions: QUESTION_SET,
          answers
        }
      }
    });
  }

  if (questionsLoading) {
    return <div className="grid min-h-screen place-items-center bg-gray-50 px-4 dark:bg-slate-950"><div className="text-center"><div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" /><p className="text-sm text-slate-500">Mengambil soal dari Firebase...</p></div></div>;
  }

  if (questionsError) {
    return <div className="grid min-h-screen place-items-center bg-gray-50 px-4 dark:bg-slate-950"><div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center dark:border-red-900 dark:bg-slate-900"><h1 className="font-bold">Soal gagal dimuat</h1><p className="mt-2 text-sm text-slate-500">{questionsError}</p><button onClick={() => navigate("/simulasi")} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Kembali</button></div></div>;
  }

  if (currentUser && currentUser.role !== "admin" && attemptCount >= 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4">
        <div className="bg-white dark:bg-slate-900 dark:border-slate-800 border border-gray-200 rounded-2xl p-6 max-w-md w-full text-center">
          <div className="text-4xl mb-4">🚫</div>
          <h1 className="text-lg font-bold mb-2">Batas Simulasi Tercapai</h1>
          <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
            Anda sudah menyelesaikan simulasi <span className="font-bold">{currentMode.toUpperCase()}</span> sebanyak <span className="font-bold">3 kali</span>.
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-6">
            Setiap user hanya diizinkan mengulang simulasi maksimal 3 kali per mode.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
          >
            Beranda
          </button>
        </div>
      </div>
    );
  }

  // Kalau benar-benar nggak ada soal untuk mode ini
  if (!currentQuestion) {
    const simulasiLabel = simulasiNum ? `Simulasi ${simulasiNum}` : `mode ${currentMode.toUpperCase()}`;
    const message = simulasiNum 
      ? `Belum ada soal yang di-import untuk Simulasi ${simulasiNum}. Hubungi admin untuk mengupload soal.`
      : `Belum ada soal untuk mode ${currentMode.toUpperCase()}.`;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4">
        <div className="bg-white dark:bg-slate-900 dark:border-slate-800 border border-gray-200 rounded-2xl p-6 max-w-md w-full text-center">
          <h1 className="text-lg font-bold mb-2">
            Soal belum tersedia
          </h1>
          <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
            {message}
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
          >
            Beranda
          </button>
        </div>
      </div>
    );
  }

  const modeLabel =
    currentMode === "twk"
      ? "Latihan fokus TWK"
      : currentMode === "tiu"
      ? "Latihan fokus TIU"
      : currentMode === "tkp"
      ? "Latihan fokus TKP"
      : "Simulasi penuh SKD";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 dark:text-slate-50">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-gray-200 dark:border-slate-800 shadow-sm dark:shadow-none">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <img
                src={logo}
                alt="NalarASN"
                className="h-10 w-auto object-contain"
              />
            </div>
            <span className="text-[11px] text-gray-500 dark:text-slate-400">
              {modeLabel}
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <div className="flex flex-col items-end">
              <span className="text-gray-500 dark:text-slate-400">
                Timer
              </span>
              <span
                className={`font-semibold ${
                  timeLeft <= 60
                    ? "text-red-500"
                    : "text-gray-800 dark:text-slate-100"
                }`}
              >
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-gray-500 dark:text-slate-400">
                Terjawab
              </span>
              <span className="font-semibold text-gray-800 dark:text-slate-100">
                {answeredCount} / {QUESTION_SET.length}
              </span>
            </div>
            <UserDropdown
              user={currentUser}
              onLogout={async () => {
                await logout();
                navigate("/login");
              }}
            />
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Panel nomor soal */}
        <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-3 text-xs text-gray-600 dark:text-slate-300">
            <span>
              Soal {currentIndex + 1} dari {QUESTION_SET.length} •{" "}
              {currentQuestion.category}
            </span>
            {timeLeft <= 0 && (
              <span className="text-red-500 font-semibold">
                Waktu habis, simulasi akan diakhiri.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Panah kiri: blok sebelumnya */}
            <button
              type="button"
              onClick={() => {
                if (currentBlock > 0) {
                  const firstIndex = (currentBlock - 1) * PAGE_SIZE;
                  setCurrentIndex(firstIndex);
                }
              }}
              disabled={currentBlock === 0}
              className="w-8 h-8 rounded-full border text-sm flex items-center justify-center disabled:opacity-40"
            >
              ‹
            </button>

            {/* Nomor soal dalam blok aktif (maks 10) */}
            <div className="flex flex-wrap gap-2">
              {QUESTION_SET.map((q, index) => {
                if (index < start || index >= end) return null;

                const isCurrent = index === currentIndex;
                const isAnswered = !!answers[q.id];

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleJumpTo(index)}
                    className={`w-8 h-8 text-xs rounded-full border flex items-center justify-center
                      ${
                        isCurrent
                          ? "border-blue-600 bg-blue-50 text-blue-700 font-semibold dark:border-blue-400 dark:bg-slate-800 dark:text-blue-200"
                          : isAnswered
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-slate-800 dark:text-emerald-200"
                          : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            {/* Panah kanan: blok berikutnya */}
            <button
              type="button"
              onClick={() => {
                if (currentBlock < maxBlock) {
                  const firstIndex = (currentBlock + 1) * PAGE_SIZE;
                  setCurrentIndex(firstIndex);
                }
              }}
              disabled={currentBlock === maxBlock}
              className="w-8 h-8 rounded-full border text-sm flex items-center justify-center disabled:opacity-40"
            >
              ›
            </button>
          </div>

          <p className="mt-2 text-[11px] text-gray-500 dark:text-slate-400">
            Hijau = sudah dijawab, Biru = soal aktif, Putih = belum dijawab.
          </p>
        </div>

        {/* Kartu soal */}
        <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-900 dark:text-slate-50 mb-4">
            {currentQuestion.question}
          </p>

          <div className="space-y-2">
            {currentQuestion.options.map((opt) => {
              const isSelected = answers[currentQuestion.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(opt.id)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
                    isSelected
                      ? "border-blue-600 bg-blue-50 text-blue-900 dark:border-blue-400 dark:bg-slate-800 dark:text-blue-100"
                      : "border-gray-200 bg-white hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  }`}
                  disabled={timeLeft <= 0}
                >
                  <span className="font-semibold mr-2">{opt.id}.</span>
                  {opt.text}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigasi bawah */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 text-sm hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex === QUESTION_SET.length - 1}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 text-sm hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 text-sm hover:bg-gray-50 dark:hover:bg-slate-800"
            >
              Beranda
            </button>
            <button
              type="button"
              onClick={() => handleFinish(false)}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
            >
              Selesaikan Simulasi
            </button>
          </div>

          {/* Reset simulasi disembunyikan */}
          {/*
          <div className="pt-2">
            <button
              type="button"
              onClick={clearState}
              className="px-4 py-2 rounded-lg border border-red-300 dark:border-red-500 text-sm text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              Reset simulasi
            </button>
          </div>
          */}
        </div>
      </main>
    </div>
  );
}
