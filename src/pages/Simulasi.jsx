import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import logo from "../assets/logo.png";
import UserDropdown from "../components/UserDropdown";
import { getCurrentUser } from "../utils/auth";
import { getQuestionBank } from "../services/questions";
import { logout } from "../services/auth";
import { getAttemptCount, getWeeklyAttemptCount, saveAttempt } from "../services/results";
import { saveWrongAnswers } from "../services/wrongAnswers";

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
  if (m === "tkp") return 40 * 60;
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
  const location = useLocation();
  const currentMode = (mode || "all").toLowerCase();
  const simulasiNum = num ? parseInt(num, 10) : null;
  const eventId = new URLSearchParams(location.search).get("weekly") || null;
  const hasWeeklyAccess = Boolean(eventId) && window.sessionStorage.getItem("nalarasn_weekly_tryout_access") === eventId;
  const weeklyEndAt = eventId ? window.sessionStorage.getItem("nalarasn_weekly_tryout_end") : null;
  const reviewLockedUntil = weeklyEndAt && Date.now() < Date.parse(weeklyEndAt) ? weeklyEndAt : null;
  const studyType = simulasiNum ? "exam" : (new URLSearchParams(location.search).get("type") === "learn" ? "learn" : "exam");
  const isLearningMode = studyType === "learn";
  const navigate = useNavigate();

  const [allQuestions, setAllQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState("");
  const [attemptCount, setAttemptCount] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const allowHistoryExit = useRef(false);
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
  const premiumUntilMillis = typeof currentUser?.premiumUntil === "string"
    ? Date.parse(currentUser.premiumUntil)
    : Number(currentUser?.premiumUntil?.seconds || 0) * 1000;
  const canAccessPackage = simulasiNum === null
    || simulasiNum === 1
    || hasWeeklyAccess
    || currentUser?.role === "admin"
    || (currentUser?.premiumActive && premiumUntilMillis > Date.now());

  useEffect(() => {
    if (!canAccessPackage) navigate("/tryout", { replace: true });
  }, [canAccessPackage, navigate]);

  useEffect(() => {
    if (!canAccessPackage) {
      setQuestionsLoading(false);
      return undefined;
    }
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
  }, [canAccessPackage, simulasiNum]);

  useEffect(() => {
    let active = true;
    (eventId ? getWeeklyAttemptCount(eventId) : getAttemptCount(currentMode, simulasiNum))
      .then((count) => { if (active) setAttemptCount(count); })
      .catch(() => { if (active) setAttemptCount(0); });
    return () => { active = false; };
  }, [currentMode, simulasiNum, eventId]);

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
          const elapsedWhileAway = !isLearningMode && parsed.savedAt
            ? Math.max(0, Math.floor((Date.now() - Number(parsed.savedAt)) / 1000))
            : 0;
          setTimeLeft(Math.max(0, parsed.timeLeft - elapsedWhileAway));
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
    if (isLearningMode || questionsLoading || !QUESTION_SET.length || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isLearningMode, timeLeft, questionsLoading, QUESTION_SET.length]);

  // Auto-submit kalau waktu habis
  useEffect(() => {
    if (!isLearningMode && timeLeft === 0) {
      handleFinish(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLearningMode, timeLeft]);

  // Auto-save ke localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const data = { answers, currentIndex, timeLeft, savedAt: Date.now() };
      window.localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (err) {
      console.error("Gagal simpan state simulasi:", err);
    }
  }, [answers, currentIndex, timeLeft, storageKey]);

  useEffect(() => {
    if (finishing || questionsLoading || !QUESTION_SET.length || (!isLearningMode && timeLeft <= 0)) return undefined;
    const warnBeforeLeaving = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [isLearningMode, finishing, questionsLoading, QUESTION_SET.length, timeLeft]);

  useEffect(() => {
    if (finishing || questionsLoading || !QUESTION_SET.length) return undefined;
    window.history.pushState({ nalarasnSessionGuard: true }, "", window.location.href);
    const warnOnBack = () => {
      if (allowHistoryExit.current) return;
      window.history.pushState({ nalarasnSessionGuard: true }, "", window.location.href);
      setExitDialogOpen(true);
    };
    window.addEventListener("popstate", warnOnBack);
    return () => window.removeEventListener("popstate", warnOnBack);
  }, [finishing, questionsLoading, QUESTION_SET.length]);

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function handleSelect(optionId) {
    if (!isLearningMode && timeLeft <= 0) return;
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

  function leaveSession() {
    allowHistoryExit.current = true;
    setExitDialogOpen(false);
    navigate(simulasiNum ? "/tryout" : "/latihan", { replace: true });
  }

  async function handleFinish(auto = false, confirmed = false) {
    if (finishing) return;
    const result = calculateResult();
    const answered = Object.keys(answers).length;
    const totalQuestionsLocal = QUESTION_SET.length;
    const unanswered = totalQuestionsLocal - answered;

    if (!auto && !confirmed && !isLearningMode && timeLeft > 0 && unanswered > 0) {
      const ok = window.confirm(
        `Masih ada ${unanswered} soal yang belum dijawab.\n\nTetap akhiri simulasi dan lihat hasil?`
      );
      if (!ok) return;
    }

    setFinishing(true);
    try {
      await saveAttempt({ mode: currentMode, packageNumber: simulasiNum, scores: result, answers, answeredCount: answered, questionCount: totalQuestionsLocal, autoFinished: auto, studyType, eventId });
      saveWrongAnswers(QUESTION_SET, answers);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(storageKey);
        const detailPayload = {
          result,
          mode: currentMode,
          date: new Date().toISOString(),
          questions: QUESTION_SET,
          answers,
          studyType,
          reviewLockedUntil
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
          questions: reviewLockedUntil ? [] : QUESTION_SET,
          answers: reviewLockedUntil ? {} : answers,
          reviewLockedUntil
        }
      }
    });
  }

  if (questionsLoading) {
    return <div className="grid min-h-screen place-items-center bg-gray-50 px-4 dark:bg-slate-950"><div className="text-center"><div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" /><p className="text-sm text-slate-500">Mengambil soal dari Firebase...</p></div></div>;
  }

  if (questionsError) {
    return <div className="grid min-h-screen place-items-center bg-gray-50 px-4 dark:bg-slate-950"><div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center dark:border-red-900 dark:bg-slate-900"><h1 className="font-bold">Soal gagal dimuat</h1><p className="mt-2 text-sm text-slate-500">{questionsError}</p><button onClick={() => navigate(simulasiNum ? "/tryout" : "/latihan")} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Kembali</button></div></div>;
  }

  if (currentUser && currentUser.role !== "admin" && ((!eventId && attemptCount >= 3) || (eventId && attemptCount >= 1))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4">
        <div className="bg-white dark:bg-slate-900 dark:border-slate-800 border border-gray-200 rounded-2xl p-6 max-w-md w-full text-center">
          <div className="text-4xl mb-4">🚫</div>
          <h1 className="text-lg font-bold mb-2">Batas Pengerjaan Tercapai</h1>
          <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
            {eventId ? "Kesempatan Tryout Nasional minggu ini sudah digunakan." : <>Anda sudah menyelesaikan sesi <span className="font-bold">{currentMode.toUpperCase()}</span> sebanyak <span className="font-bold">3 kali</span>.</>}
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-6">
            {eventId ? "Setiap pengguna mendapat satu kesempatan agar peringkat tetap adil." : "Setiap pengguna hanya diizinkan mengulang maksimal 3 kali per mode."}
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
    const simulasiLabel = simulasiNum ? `Tryout ${simulasiNum}` : `mode ${currentMode.toUpperCase()}`;
    const message = simulasiNum 
      ? `Belum ada soal yang diimpor untuk Tryout ${simulasiNum}. Hubungi admin untuk mengunggah soal.`
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
      : simulasiNum
      ? `Tryout ${simulasiNum}`
      : isLearningMode
      ? "Latihan campuran · Mode Belajar"
      : "Latihan campuran · Mode Ujian";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 dark:text-slate-50">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-gray-200 dark:border-slate-800 shadow-sm dark:shadow-none">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 rounded-lg bg-white p-1">
              <img
                src={logo}
                alt="NalarASN"
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <div className="flex flex-col items-end">
              <span className="text-gray-500 dark:text-slate-400">
                {isLearningMode ? "Mode" : "Timer"}
              </span>
              <span
                className={`font-semibold ${
                  timeLeft <= 60
                    ? "text-red-500"
                    : "text-gray-800 dark:text-slate-100"
                }`}
              >
                {isLearningMode ? "Belajar" : formatTime(timeLeft)}
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
        <section className="grid gap-px overflow-hidden border border-[#17366f]/15 bg-[#17366f]/15 dark:border-slate-700 dark:bg-slate-700 sm:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div className="border-t-4 border-t-[#17366f] bg-white p-4 dark:bg-[#0b1935]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#2468d8]">Peserta</p>
            <p className="mt-1 truncate text-sm font-bold">{currentUser?.name || "Peserta NalarASN"}</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">{modeLabel}</p>
          </div>
          <div className="border-t-4 border-t-[#2468d8] bg-white p-4 dark:bg-[#0b1935]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#2468d8]">Waktu</p>
            <p className={`mt-1 text-lg font-bold ${!isLearningMode && timeLeft <= 60 ? "text-red-500" : ""}`}>
              {isLearningMode ? "Tanpa batas" : formatTime(timeLeft)}
            </p>
          </div>
          <div className="border-t-4 border-t-[#e8a51a] bg-white p-4 dark:bg-[#0b1935]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#b77908] dark:text-[#f2bd4c]">Terjawab</p>
            <p className="mt-1 text-lg font-bold">{answeredCount}</p>
            <p className="text-xs text-slate-500">dari {QUESTION_SET.length} soal</p>
          </div>
          <div className="border-t-4 border-t-[#e8a51a] bg-white p-4 dark:bg-[#0b1935]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#b77908] dark:text-[#f2bd4c]">Belum dijawab</p>
            <p className={`mt-1 text-lg font-bold ${QUESTION_SET.length - answeredCount ? "text-amber-600" : "text-emerald-600"}`}>
              {QUESTION_SET.length - answeredCount}
            </p>
            <p className="text-xs text-slate-500">soal tersisa</p>
          </div>
        </section>

        {/* Kartu soal */}
        <div className="border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs dark:border-slate-800">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Soal {currentIndex + 1} dari {QUESTION_SET.length} · {currentQuestion.category}
            </span>
            {!isLearningMode && timeLeft <= 0 && (
              <span className="font-semibold text-red-500">Waktu habis, sesi akan diakhiri.</span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-slate-50 mb-4">
            {currentQuestion.question}
          </p>
          {currentQuestion.figure && (
            <pre className="mb-5 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-center font-mono text-sm leading-6 text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
              {currentQuestion.figure}
            </pre>
          )}

          <div className="space-y-2">
            {currentQuestion.options.map((opt) => {
              const isSelected = answers[currentQuestion.id] === opt.id;
              const answeredCurrent = Boolean(answers[currentQuestion.id]);
              const bestScore = Math.max(0, ...currentQuestion.options.map((item) => Number(item.score || 0)));
              const isBest = answeredCurrent && isLearningMode && Number(opt.score || 0) === bestScore;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(opt.id)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
                    isBest
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-950/30 dark:text-emerald-100"
                      : isSelected
                      ? "border-blue-600 bg-blue-50 text-blue-900 dark:border-blue-400 dark:bg-slate-800 dark:text-blue-100"
                      : "border-gray-200 bg-white hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  }`}
                  disabled={!isLearningMode && timeLeft <= 0}
                >
                  <span className="font-semibold mr-2">{opt.id}.</span>
                  {opt.text}
                </button>
              );
            })}
          </div>
          {isLearningMode && answers[currentQuestion.id] && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100"><strong>Jawaban terbaik ditandai hijau.</strong><p className="mt-1">{currentQuestion.explanation || "Pembahasan terperinci untuk soal ini sedang disiapkan. Bandingkan skor setiap pilihan untuk memahami respons yang paling tepat."}</p></div>}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-between">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex === QUESTION_SET.length - 1}
              className="border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              Berikutnya
            </button>
        </div>

        <div className="border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Kelompok nomor sebelumnya"
              onClick={() => currentBlock > 0 && setCurrentIndex((currentBlock - 1) * PAGE_SIZE)}
              disabled={currentBlock === 0}
              className="h-9 w-9 shrink-0 border text-sm disabled:opacity-30 dark:border-slate-700"
            >
              ‹
            </button>
            <div className="grid flex-1 grid-cols-5 gap-2 sm:grid-cols-10">
              {QUESTION_SET.map((q, index) => {
                if (index < start || index >= end) return null;
                const isCurrent = index === currentIndex;
                const isAnswered = Boolean(answers[q.id]);
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleJumpTo(index)}
                    aria-label={`Soal ${index + 1}${isAnswered ? ", sudah dijawab" : ""}`}
                    className={`h-9 border text-xs font-semibold ${
                      isCurrent
                        ? "border-blue-600 bg-blue-600 text-white"
                        : isAnswered
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              aria-label="Kelompok nomor berikutnya"
              onClick={() => currentBlock < maxBlock && setCurrentIndex((currentBlock + 1) * PAGE_SIZE)}
              disabled={currentBlock === maxBlock}
              className="h-9 w-9 shrink-0 border text-sm disabled:opacity-30 dark:border-slate-700"
            >
              ›
            </button>
          </div>
          <p className="mt-3 text-[11px] text-gray-500 dark:text-slate-400">
            Biru: soal aktif · Hijau: sudah dijawab · Putih: belum dijawab
          </p>
        </div>

        <div className="flex justify-end pb-6">
          <button
            type="button"
            onClick={() => setFinishDialogOpen(true)}
            className="w-full bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 sm:w-auto"
          >
            {simulasiNum ? "Selesaikan Tryout" : "Selesaikan Latihan"}
          </button>
        </div>
      </main>

      {exitDialogOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="exit-session-title">
          <div className="w-full max-w-md border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <h2 id="exit-session-title" className="text-lg font-bold">Keluar dari sesi?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">
              Jawaban terakhir sudah tersimpan. {isLearningMode
                ? "Kamu dapat melanjutkan latihan ini nanti."
                : "Timer tetap berjalan meskipun kamu meninggalkan halaman."}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setExitDialogOpen(false)} className="border border-slate-300 px-4 py-3 text-sm font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                Lanjut mengerjakan
              </button>
              <button type="button" onClick={leaveSession} className="bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700">
                Keluar dari sesi
              </button>
            </div>
          </div>
        </div>
      )}

      {finishDialogOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="finish-session-title">
          <div className="w-full max-w-md border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <h2 id="finish-session-title" className="text-lg font-bold">
              {simulasiNum ? "Selesaikan Tryout?" : "Selesaikan Latihan?"}
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3 bg-slate-50 p-4 text-center dark:bg-slate-950">
              <div><p className="text-2xl font-extrabold text-emerald-600">{answeredCount}</p><p className="text-xs text-slate-500">Sudah dijawab</p></div>
              <div><p className={`text-2xl font-extrabold ${QUESTION_SET.length - answeredCount ? "text-amber-600" : "text-slate-700 dark:text-slate-200"}`}>{QUESTION_SET.length - answeredCount}</p><p className="text-xs text-slate-500">Belum dijawab</p></div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-300">
              Setelah diselesaikan, jawaban tidak dapat diubah dan hasil akan langsung dihitung.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setFinishDialogOpen(false)} className="border border-slate-300 px-4 py-3 text-sm font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                Periksa kembali
              </button>
              <button type="button" disabled={finishing} onClick={() => { setFinishDialogOpen(false); handleFinish(false, true); }} className="bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                {finishing ? "Menyimpan..." : "Ya, selesaikan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
