import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import logo from "../assets/skdcore-logo.png";

const HISTORY_KEY = "skdcore_simulasi_history_v1";
const QUESTION_BANK_KEY = "skdcore_question_bank_v1";
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
  if (m === "twk") return 28 * 60;
  if (m === "tiu") return 32 * 60;
  if (m === "tkp") return 41 * 60;
  return 100 * 60; // full SKD
}

// Load bank soal dari localStorage
function loadQuestionBank() {
  if (typeof window === "undefined") return DEFAULT_QUESTIONS;
  try {
    const raw = window.localStorage.getItem(QUESTION_BANK_KEY);
    if (!raw) return DEFAULT_QUESTIONS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_QUESTIONS;
    return parsed;
  } catch {
    return DEFAULT_QUESTIONS;
  }
}

// Bagi per mode
function buildQuestionBank(allQuestions) {
  return {
    all: allQuestions,
    twk: allQuestions.filter((q) => q.category === "TWK"),
    tiu: allQuestions.filter((q) => q.category === "TIU"),
    tkp: allQuestions.filter((q) => q.category === "TKP")
  };
}

export default function Simulasi() {
  const { mode } = useParams();
  const currentMode = (mode || "all").toLowerCase();
  const navigate = useNavigate();

  // Ambil soal (import dulu, kalau nggak ada pakai default)
  const allQuestions = loadQuestionBank();
  const QUESTION_BANK = buildQuestionBank(allQuestions);
  const QUESTION_SET = QUESTION_BANK[currentMode] || QUESTION_BANK.all;

  const storageKey = `skdcore_simulasi_state_v1_${currentMode}`;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(() => getTotalTimeSeconds(currentMode));

  const currentQuestion = QUESTION_SET[currentIndex];
  const answeredCount = Object.keys(answers).length;

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
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

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
    setCurrentIndex((prev) => Math.min(prev + 1, QUESTION_SET.length - 1));
  }

  function handleJumpTo(index) {
    setCurrentIndex(index);
  }

  function calculateResult() {
    const result = { TWK: 0, TIU: 0, TKP: 0 };

    QUESTION_SET.forEach((q) => {
      const selectedId = answers[q.id];
      if (!selectedId) return;
      const selectedOption = q.options.find((opt) => opt.id === selectedId);
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

  function handleFinish(auto = false) {
    const result = calculateResult();
    const answered = Object.keys(answers).length;
    const totalQuestions = QUESTION_SET.length;
    const unanswered = totalQuestions - answered;

    if (!auto && timeLeft > 0 && unanswered > 0) {
      const ok = window.confirm(
        `Masih ada ${unanswered} soal yang belum dijawab.\n\nTetap akhiri simulasi dan lihat hasil?`
      );
      if (!ok) return;
    }

    try {
      if (typeof window !== "undefined") {
        let userEmail = null;
        try {
          const rawUser = window.localStorage.getItem("skdcore_current_user");
          if (rawUser) {
            const u = JSON.parse(rawUser);
            userEmail = u?.email || null;
          }
        } catch {
          userEmail = null;
        }

        const raw = window.localStorage.getItem(HISTORY_KEY);
        const prev = raw ? JSON.parse(raw) : [];
        const attempt = {
          id: Date.now(),
          date: new Date().toISOString(),
          result,
          answeredCount: answered,
          totalQuestions,
          mode: currentMode,
          autoFinished: auto,
          userEmail
        };
        const newHistory = [attempt, ...(Array.isArray(prev) ? prev : [])].slice(0, 50);
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
        window.localStorage.removeItem(storageKey);

        // simpan detail terakhir
        const detailPayload = {
          result,
          mode: currentMode,
          date: new Date().toISOString(),
          questions: QUESTION_SET,
          answers
        };
        window.localStorage.setItem(LAST_DETAIL_KEY, JSON.stringify(detailPayload));
      }
    } catch (err) {
      console.error("Gagal simpan riwayat simulasi:", err);
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

  // Kalau benar-benar nggak ada soal untuk mode ini
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4">
        <div className="bg-white dark:bg-slate-900 dark:border-slate-800 border border-gray-200 rounded-2xl p-6 max-w-md w-full text-center">
          <h1 className="text-lg font-bold mb-2">Belum ada soal untuk mode ini</h1>
          <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
            Mode: <span className="font-semibold uppercase">{currentMode}</span>
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
          >
            Kembali ke Dashboard
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
              <img src={logo} alt="SKDCore" className="h-10 w-auto object-contain" />
              
            </div>
            <span className="text-[11px] text-gray-500 dark:text-slate-400">
              {modeLabel}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex flex-col items-end">
              <span className="text-gray-500 dark:text-slate-400">Timer</span>
              <span
                className={`font-semibold ${
                  timeLeft <= 60 ? "text-red-500" : "text-gray-800 dark:text-slate-100"
                }`}
              >
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-gray-500 dark:text-slate-400">Terjawab</span>
              <span className="font-semibold text-gray-800 dark:text-slate-100">
                {answeredCount} / {QUESTION_SET.length}
              </span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Panel nomor soal */}
        <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-3 text-xs text-gray-600 dark:text-slate-300">
            <span>
              Soal {currentIndex + 1} dari {QUESTION_SET.length} • {currentQuestion.category}
            </span>
            {timeLeft <= 0 && (
              <span className="text-red-500 font-semibold">
                Waktu habis, simulasi akan diakhiri.
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {QUESTION_SET.map((q, index) => {
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
              Kembali ke Dashboard
            </button>
            <button
              type="button"
              onClick={() => handleFinish(false)}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
            >
              Lihat Hasil
            </button>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={clearState}
              className="px-4 py-2 rounded-lg border border-red-300 dark:border-red-500 text-sm text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              Reset simulasi
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
