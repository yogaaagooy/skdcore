// src/pages/AdminImportExam.jsx (PRO VERSION)
import React, { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";

export default function AdminImportExam() {
  const [fileContent, setFileContent] = useState(null);
  const [simulationId, setSimulationId] = useState(1);
  const [questionNumber, setQuestionNumber] = useState("");
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
      setLog([
        `✔ File terbaca: ${file.name}`,
        `📊 Tipe file: ${Array.isArray(json) ? "Array soal" : "Objek ujian"}`,
        "Siap import."
      ]);
    } catch (err) {
      console.error("Error membaca file:", err);
      const errorMsg = err.message || "Format file tidak valid";
      setLog([
        `❌ Gagal membaca JSON.`,
        `Error: ${errorMsg}`,
        "Pastikan file adalah JSON yang valid (cek bracket, koma, quotes)"
      ]);
    }
  }

  // ===== Validasi Soal =====
  function validateQuestions(questions, logArr) {
    let ok = true;

    questions.forEach((q, index) => {
      const nomor = index + 1;
      
      // Cek tipe
      if (!q.tipe || !["TIU", "TWK", "TKP"].includes(q.tipe)) {
        logArr.push(`❌ Soal #${nomor}: tipe harus TWK, TIU, atau TKP`);
        ok = false;
        return;
      }
      
      // Cek options (harus 5 item)
      if (!Array.isArray(q.options) || q.options.length !== 5) {
        logArr.push(`❌ Soal #${nomor}: options harus 5 item (A-E)`);
        ok = false;
        return;
      }
      
      // Cek question
      if (!q.question || typeof q.question !== "string") {
        logArr.push(`❌ Soal #${nomor}: question wajib ada dan berupa string`);
        ok = false;
        return;
      }

      // TWK/TIU: cek score (harus ada satu yang score=5)
      if (q.tipe === "TWK" || q.tipe === "TIU") {
        const hasCorrect = q.options.some((o) => o.score === 5);
        if (!hasCorrect) {
          logArr.push(`❌ Soal #${nomor} (${q.tipe}): minimal satu option harus score=5`);
          ok = false;
        }
      }

      // TKP: cek scores (harus ada di semua option)
      if (q.tipe === "TKP") {
        const allHaveScore = q.options.every((o) => typeof o.score === "number");
        if (!allHaveScore) {
          logArr.push(`❌ Soal #${nomor} (TKP): semua option harus punya score`);
          ok = false;
        }
      }
    });

    return ok;
  }

  // ===== Normalisasi format soal (HANYA format object A-E) =====
  function normalizeQuestions(rawQuestions, logArr) {
    return rawQuestions.map((q) => {
      const keys = ["A", "B", "C", "D", "E"];
      
      // Parse tipe
      const tipe = (q.category || q.tipe || "TWK").toUpperCase();
      
      // Parse options dari object {A, B, C, D, E}
      const options = keys.map((k) => ({
        id: k,
        text: q.options[k] || "",
        score: 0
      }));

      // Output awal
      const out = {
        id: q.id,
        tipe: tipe,
        question: q.question || "",
        options: options,
        explanation: q.explanation || ""
      };

      // TWK/TIU: set score=5 untuk jawaban benar
      if (tipe === "TWK" || tipe === "TIU") {
        const correctLetter = (q.correct || "").toString().toUpperCase();
        const correctIdx = keys.indexOf(correctLetter);
        
        if (correctIdx >= 0) {
          out.options = out.options.map((opt, i) => ({
            ...opt,
            score: i === correctIdx ? 5 : 0
          }));
          out.correctOption = correctIdx;
        }
      }

      // TKP: set score dari scores object
      if (tipe === "TKP") {
        out.scores = keys.map((k) => q.scores[k] || 1);
        out.options = out.options.map((opt, i) => ({
          ...opt,
          score: out.scores[i] || 1
        }));
      }

      return out;
    });
  }

  // ===== Import ke Firestore =====
  async function handleImport() {
    if (!fileContent) {
      setLog(["❌ File belum dipilih."]);
      return;
    }

    const newLog = [];

    // Support dua format:
    // 1) Array soal langsung: [ {category, question, options, ...}, ... ]
    // 2) Objek ujian: { id, title, description, durationMinutes, questions: [...] }
    let id, title, description, durationMinutes, rawQuestions;

    if (Array.isArray(fileContent)) {
      // Format 1: Array soal langsung
      rawQuestions = fileContent;
      id = `imported_${Date.now()}`;
      title = `Imported soal ${new Date().toLocaleString("id-ID")}`;
      description = "Diimpor dari file JSON (array soal).";
      durationMinutes = 100;
      newLog.push(`📥 Mendeteksi format: array soal (${rawQuestions.length} soal).`);
    } else if (fileContent && typeof fileContent === "object") {
      // Format 2: Objek ujian
      id = fileContent.id || fileContent.examId || fileContent.kode;
      title = fileContent.title || fileContent.name || fileContent.judul;
      description = fileContent.description || fileContent.deskripsi || "";
      durationMinutes = fileContent.durationMinutes || fileContent.duration || 100;
      rawQuestions = fileContent.questions || fileContent.soal || fileContent.items || fileContent.data;

      if (!id || !title) {
        newLog.push("⚠️ Peringatan: id atau title tidak lengkap, menggunakan default.");
        id = id || `imported_${Date.now()}`;
        title = title || `Imported soal ${new Date().toLocaleString("id-ID")}`;
      }
      newLog.push(`📥 Mendeteksi format: objek ujian (id=${id}, ${Array.isArray(rawQuestions) ? rawQuestions.length : 0} soal).`);
    }

    if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
      setLog([
        "❌ JSON tidak valid. Harus berupa:",
        "  1) Array soal: [ {category, question, options, ...}, ... ]",
        "  2) Objek ujian: { id, title, questions: [...] }"
      ]);
      return;
    }

    newLog.push("🔍 Normalisasi dan validasi soal...");

    // NORMALISASI
    const questions = normalizeQuestions(Array.isArray(rawQuestions) ? rawQuestions : [], newLog);

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
      newLog.push(`✔ Total soal yang diimpor: ${questions.length}`);
    } catch (err) {
      console.error("Error import ke Firestore:", err);
      newLog.push(`❌ Gagal import: ${err.message}`);
      newLog.push("Pastikan Firebase sudah dikonfigurasi dengan benar.");
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

      <div className="mb-3">
        <label className="text-xs mr-2">Simulasi ke-</label>
        <select value={simulationId} onChange={(e) => setSimulationId(Number(e.target.value))} className="px-2 py-1 rounded border mr-3">
          {Array.from({length:10}, (_,i)=>i+1).map(n=> <option key={n} value={n}>Simulasi {n}</option>)}
        </select>
        <label className="text-xs mr-2">Nomor soal (opsional)</label>
        <input type="number" min={1} value={questionNumber} onChange={(e)=>setQuestionNumber(e.target.value)} className="px-2 py-1 rounded border" />
      </div>

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
