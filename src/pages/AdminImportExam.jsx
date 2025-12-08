// src/pages/AdminImportExam.jsx (PRO VERSION)
import React, { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";

export default function AdminImportExam() {
  const [fileContent, setFileContent] = useState(null);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);

  // ===== Helper baca file JSON =====
  function readFileJson(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          resolve(JSON.parse(text));
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsText(file);
    });
  }

  // ===== Pilih file =====
  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const json = await readFileJson(file);
      setFileContent(json);
      setLog([`File terbaca: ${file.name}`, "Siap import."]);
    } catch (err) {
      console.error(err);
      setLog(["❌ Gagal membaca JSON. Format file salah."]);
    }
  }

  // ===== Validasi Soal =====
  function validateQuestions(questions, logArr) {
    let ok = true;

    questions.forEach((q, index) => {
      const nomor = index + 1;
      const tipe = q.tipe;

      if (!tipe || !["TIU", "TWK", "TKP"].includes(tipe)) {
        logArr.push(`❌ Soal #${nomor}: Field 'tipe' wajib (TIU/TWK/TKP).`);
        ok = false;
        return;
      }

      if (!Array.isArray(q.options) || q.options.length !== 5) {
        logArr.push(`❌ Soal #${nomor}: 'options' harus berisi 5 item (A–E).`);
        ok = false;
        return;
      }

      // TIU / TWK
      if (tipe === "TIU" || tipe === "TWK") {
        if (typeof q.correctOption !== "number") {
          logArr.push(
            `❌ Soal #${nomor} (${tipe}): wajib punya 'correctOption'.`
          );
          ok = false;
        }
      }

      // TKP
      if (tipe === "TKP") {
        if (
          !Array.isArray(q.scores) ||
          q.scores.length !== 5 ||
          !q.scores.every((n) => typeof n === "number")
        ) {
          logArr.push(
            `❌ Soal #${nomor} (TKP): 'scores' harus array 5 angka (1–5).`
          );
          ok = false;
        }
      }
    });

    return ok;
  }

  // ===== Import ke Firestore =====
  async function handleImport() {
    if (!fileContent) {
      setLog(["❌ File belum dipilih."]);
      return;
    }

    const { id, title, description, durationMinutes, questions } =
      fileContent;

    const newLog = [];

    if (!id || !title || !Array.isArray(questions)) {
      setLog([
        "❌ JSON tidak valid. Pastikan id, title, dan questions ada."
      ]);
      return;
    }

    newLog.push("🔍 Validasi soal...");

    // VALIDASI
    const valid = validateQuestions(questions, newLog);

    if (!valid) {
      newLog.push("❌ Import dibatalkan karena ada error.");
      setLog(newLog);
      return;
    }

    newLog.push("✔ Semua soal valid. Mengimport ke Firestore...");
    setLoading(true);

    try {
      await setDoc(doc(db, "exams", id), {
        title,
        description: description || "",
        durationMinutes: durationMinutes || 100,
        questions
      });

      newLog.push(`✔ Berhasil import ujian '${id}'`);
    } catch (err) {
      console.error(err);
      newLog.push(`❌ Gagal import: ${err.message}`);
    }

    setLoading(false);
    setLog(newLog);
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">
        Admin – Import Ujian (PRO Version)
      </h1>

      <p className="mb-3 opacity-80">
        Import 1 file JSON berisi ujian besar (110 soal campuran).
      </p>

      <input
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="mb-4"
      />

      <button
        onClick={handleImport}
        disabled={!fileContent || loading}
        className="px-5 py-3 bg-blue-600 rounded disabled:opacity-50"
      >
        {loading ? "Mengimport..." : "Import ke Firestore"}
      </button>

      <div className="mt-5 bg-gray-900 p-3 rounded max-h-80 overflow-auto text-sm">
        {log.map((line, idx) => (
          <div key={idx}>{line}</div>
        ))}
      </div>
    </div>
  );
}
