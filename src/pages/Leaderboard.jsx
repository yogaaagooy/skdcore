// src/pages/Leaderboard.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { collectionGroup, getDocs, query, where } from "firebase/firestore";

const PASSING_TIU = 80;
const PASSING_TWK = 65;
const PASSING_TKP = 166;

function normalizeScore(raw) {
  // data lama: score masih number
  if (typeof raw === "number") {
    return {
      tiu: null,
      twk: null,
      tkp: null,
      total: raw,
      lulus: null,
    };
  }

  // data baru: objek hasil SKD
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

  // fallback
  return {
    tiu: null,
    twk: null,
    tkp: null,
    total: null,
    lulus: null,
  };
}

export default function Leaderboard() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUser = auth.currentUser;

  useEffect(() => {
    // kalau nggak ada examId, balik ke dashboard biar nggak nge-query undefined
    if (!examId) {
      setLoading(false);
      navigate("/dashboard", { replace: true });
      return;
    }

    async function load() {
      try {
        const q = query(
          collectionGroup(db, "examResults"),
          where("examId", "==", examId)
        );
        const snap = await getDocs(q);

        const data = snap.docs.map((doc) => {
          const d = doc.data();
          const userRef = doc.ref.parent.parent;
          const uid = userRef?.id || d.uid || null;

          const score = normalizeScore(d.score);
          return {
            id: doc.id,
            uid,
            email: d.email || d.userEmail || uid,
            score,
            createdAt: d.createdAt?.toDate?.() ?? null,
          };
        });

        data.sort((a, b) => {
          const at = a.score.total ?? 0;
          const bt = b.score.total ?? 0;
          if (bt !== at) return bt - at;
          if (a.createdAt && b.createdAt) {
            return b.createdAt - a.createdAt;
          }
          return 0;
        });

        setRows(data);
      } catch (err) {
        console.error("Error load leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [examId, navigate]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      {/* Header atas */}
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold">
              Leaderboard {examId ? `– ${examId}` : ""}
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Urutan berdasarkan total nilai SKD (TIU + TWK + TKP).
            </p>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="text-xs px-3 py-2 bg-slate-700 rounded hover:bg-slate-600"
          >
            ← Kembali ke Dashboard
          </button>
        </div>

        <div className="text-[11px] text-slate-400 mb-4">
          Passing Grade: TWK {PASSING_TWK} | TIU {PASSING_TIU} | TKP{" "}
          {PASSING_TKP}
        </div>

        {/* Card tabel */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-900 text-slate-200 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left w-16">Rank</th>
                  <th className="px-4 py-3 text-left">Nama / Email</th>
                  <th className="px-4 py-3 text-center w-20">TIU</th>
                  <th className="px-4 py-3 text-center w-20">TWK</th>
                  <th className="px-4 py-3 text-center w-20">TKP</th>
                  <th className="px-4 py-3 text-center w-24">Total</th>
                  <th className="px-4 py-3 text-center w-28">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-slate-400"
                    >
                      Memuat data leaderboard...
                    </td>
                  </tr>
                )}

                {!loading && rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-slate-400"
                    >
                      Belum ada peserta yang menyelesaikan ujian ini.
                    </td>
                  </tr>
                )}

                {!loading &&
                  rows.map((row, index) => {
                    const isMe =
                      currentUser && row.uid === currentUser.uid;
                    const s = row.score;

                    return (
                      <tr
                        key={row.id + row.uid}
                        className={`border-t border-slate-800/70 text-xs md:text-sm ${
                          isMe
                            ? "bg-slate-800"
                            : index % 2 === 0
                            ? "bg-slate-900/40"
                            : "bg-slate-950/40"
                        }`}
                      >
                        <td className="px-4 py-2 text-left">
                          {index + 1}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-col">
                            <span className="truncate max-w-[220px] md:max-w-xs">
                              {row.email || row.uid || "-"}
                            </span>
                            {isMe && (
                              <span className="text-[11px] text-emerald-400 mt-0.5">
                                (Anda)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-center">
                          {s.tiu ?? "-"}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {s.twk ?? "-"}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {s.tkp ?? "-"}
                        </td>
                        <td className="px-4 py-2 text-center font-semibold">
                          {s.total ?? "-"}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {s.lulus === null ? (
                            <span className="text-slate-400 text-[11px]">
                              -
                            </span>
                          ) : s.lulus ? (
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
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
