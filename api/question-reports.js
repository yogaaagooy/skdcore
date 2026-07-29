const { FieldValue } = require("firebase-admin/firestore");
const { adminDb, verifyUser } = require("./_firebase-admin");

function send(response, status, body) {
  response.status(status).json(body);
}

function toIso(value) {
  return value?.toDate?.().toISOString?.() || null;
}

module.exports = async function handler(request, response) {
  if (!["GET", "POST"].includes(request.method)) {
    response.setHeader("Allow", "GET, POST");
    return send(response, 405, { message: "Metode tidak diizinkan." });
  }
  try {
    const firebaseUser = await verifyUser(request);
    if (!firebaseUser) return send(response, 401, { message: "Sesi login tidak valid." });

    if (request.method === "POST") {
      const questionId = String(request.body?.questionId || "").slice(0, 100);
      const reason = String(request.body?.reason || "").trim().slice(0, 500);
      if (!questionId || !reason) return send(response, 400, { message: "Alasan laporan harus diisi." });
      await adminDb().collection("questionReports").add({
        userId: firebaseUser.uid,
        email: firebaseUser.email || "",
        questionId,
        category: String(request.body?.category || "").slice(0, 10),
        question: String(request.body?.question || "").slice(0, 1000),
        reason,
        status: "open",
        createdAt: FieldValue.serverTimestamp(),
      });
      return send(response, 201, { saved: true });
    }

    const profile = await adminDb().collection("users").doc(firebaseUser.uid).get();
    if (!profile.exists || profile.data()?.role !== "admin") return send(response, 403, { message: "Akses ditolak." });
    const snapshot = await adminDb().collection("questionReports").orderBy("createdAt", "desc").limit(100).get();
    return send(response, 200, { reports: snapshot.docs.map((item) => ({ id: item.id, ...item.data(), createdAt: toIso(item.data().createdAt) })) });
  } catch (error) {
    console.error("Question reports failed", error);
    return send(response, 500, { message: "Laporan soal belum dapat diproses." });
  }
};
