// src/pages/Leaderboard.jsx
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getCurrentUser } from "../utils/auth";

const HISTORY_KEY = "skdcore_simulasi_history_v1";

export default function Leaderboard() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [user, setUser] = useState(null);
  const [sortBy, setSortBy] = useState("total"); // total, twk, tiu, tkp

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      navigate("/login", { replace: true });
      return;
    }
    setUser(u);

    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      if (!raw) {
        setLeaderboard([]);
        return;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setLeaderboard([]);
        return;
      }

      // Group by user email dan hitung rata-rata score per kategori
      const userStats = {};
      parsed.forEach((h) => {
        const email = h.userEmail || "Unknown";
        const result = h.result || {};

        if (!userStats[email]) {
          userStats[email] = {
            email,
            totalExams: 0,
            sumTWK: 0,
            sumTIU: 0,
            sumTKP: 0,
            lastActivity: null,
          };
        }

        userStats[email].totalExams += 1;
        userStats[email].sumTWK += result.TWK || 0;
        userStats[email].sumTIU += result.TIU || 0;
        userStats[email].sumTKP += result.TKP || 0;
        userStats[email].lastActivity = h.timestamp;
      });

      // Convert ke array dan hitung rata-rata
      const leaderboardData = Object.values(userStats)
        .map((stat) => ({
          email: stat.email,
          totalExams: stat.totalExams,
          avgTWK: stat.totalExams > 0 ? Math.round(stat.sumTWK / stat.totalExams) : 0,
          avgTIU: stat.totalExams > 0 ? Math.round(stat.sumTIU / stat.totalExams) : 0,
          avgTKP: stat.totalExams > 0 ? Math.round(stat.sumTKP / stat.totalExams) : 0,
          totalScore: stat.sumTWK + stat.sumTIU + stat.sumTKP,
          lastActivity: stat.lastActivity,
        }))
        .sort((a, b) => {
          // Default sort by total score descending
          return b.totalScore - a.totalScore;
        });

      setLeaderboard(leaderboardData);
    } catch (err) {
      console.error("Gagal load leaderboard:", err);
    }
  }, [navigate]);

  if (!user) return null;

  // Sort leaderboard berdasarkan pilihan
  let sortedData = [...leaderboard];
  if (sortBy === "twk") {
    sortedData.sort((a, b) => b.avgTWK - a.avgTWK);
  } else if (sortBy === "tiu") {
    sortedData.sort((a, b) => b.avgTIU - a.avgTIU);
  } else if (sortBy === "tkp") {
    sortedData.sort((a, b) => b.avgTKP - a.avgTKP);
  } else {
    sortedData.sort((a, b) => b.totalScore - a.totalScore);
  }

  function formatDate(str) {
    if (!str) return "-";
    try {
      return new Date(str).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const getMedalEmoji = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* WELCOME SECTION */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Selamat datang, {user.name}! 👋
          </h2>
          <p className="text-gray-600 dark:text-slate-400">
            Lihat bagaimana performa Anda dibandingkan dengan pengguna lain
          </p>
        </div>

        {/* FILTER & SORT */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Sort Berdasarkan:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white dark:bg-slate-900 dark:border-slate-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="total">Total Score (Avg)</option>
              <option value="twk">TWK (Avg)</option>
              <option value="tiu">TIU (Avg)</option>
              <option value="tkp">TKP (Avg)</option>
            </select>
          </div>
        </div>

        {/* LEADERBOARD TABLE */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">
                    Email
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-900 dark:text-white">
                    Eksam
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-900 dark:text-white">
                    Avg TWK
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-900 dark:text-white">
                    Avg TIU
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-900 dark:text-white">
                    Avg TKP
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-900 dark:text-white">
                    Total Avg
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">
                    Aktivitas Terakhir
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                {sortedData.length > 0 ? (
                  sortedData.map((row, idx) => (
                    <tr
                      key={row.email}
                      className={`${
                        row.email === user.email
                          ? "bg-blue-50 dark:bg-blue-950/30"
                          : "hover:bg-gray-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <td className="px-6 py-4 font-bold text-lg">
                        {getMedalEmoji(idx + 1)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {row.email}
                        </span>
                        {row.email === user.email && (
                          <span className="ml-2 text-xs bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-200 px-2 py-1 rounded">
                            Anda
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700 dark:text-slate-300">
                        {row.totalExams}x
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`font-semibold ${
                            row.avgTWK >= 65
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-gray-700 dark:text-slate-300"
                          }`}
                        >
                          {row.avgTWK}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`font-semibold ${
                            row.avgTIU >= 80
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-gray-700 dark:text-slate-300"
                          }`}
                        >
                          {row.avgTIU}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`font-semibold ${
                            row.avgTKP >= 166
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-gray-700 dark:text-slate-300"
                          }`}
                        >
                          {row.avgTKP}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                          {row.totalScore}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-400">
                        {formatDate(row.lastActivity)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <p className="text-gray-600 dark:text-slate-400">
                        Belum ada data leaderboard
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* BACK TO DASHBOARD */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition"
          >
            ← Kembali ke Dashboard
          </button>
        </div>

        {/* FOOTER */}
        <div className="mt-12 text-center text-gray-600 dark:text-slate-500 text-xs">
          <p>SKDCore Simulasi © 2025 - Platform Latihan SKD Terpercaya</p>
        </div>
      </main>
    </div>
  );
}
