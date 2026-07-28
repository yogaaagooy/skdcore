const { FieldValue } = require("firebase-admin/firestore");
const { adminDb, verifyUser } = require("./_firebase-admin");

function send(response, status, body) {
  response.status(status).json(body);
}

function publicSettings(data = {}) {
  return {
    enabled: data.enabled === true,
    title: data.title || "Tryout Nasional Mingguan",
    packageNumber: Number(data.packageNumber || 1),
    startAt: data.startAt || "",
    endAt: data.endAt || "",
    socialUrl: data.socialUrl || "",
    requiresCode: Boolean(data.accessCode),
    eventId: data.eventId || "",
  };
}

module.exports = async function handler(request, response) {
  if (!["GET", "POST"].includes(request.method)) {
    response.setHeader("Allow", "GET, POST");
    return send(response, 405, { message: "Metode tidak diizinkan." });
  }

  try {
    const settingsRef = adminDb().collection("settings").doc("weeklyTryout");

    if (request.method === "GET") {
      const snapshot = await settingsRef.get();
      const data = snapshot.exists ? snapshot.data() : {};
      const result = publicSettings(data);
      const firebaseUser = await verifyUser(request);
      if (firebaseUser) {
        const profile = await adminDb().collection("users").doc(firebaseUser.uid).get();
        if (profile.exists && profile.data()?.role === "admin") result.accessCode = data.accessCode || "";
      }
      return send(response, 200, result);
    }

    const firebaseUser = await verifyUser(request);
    if (!firebaseUser) return send(response, 401, { message: "Sesi admin tidak dapat diverifikasi. Muat ulang halaman lalu coba kembali." });
    const profile = await adminDb().collection("users").doc(firebaseUser.uid).get();
    if (!profile.exists || profile.data()?.role !== "admin") {
      return send(response, 403, { message: "Hanya administrator yang dapat mengubah jadwal tryout." });
    }

    const packageNumber = Number(request.body?.packageNumber);
    if (!Number.isInteger(packageNumber) || packageNumber < 1 || packageNumber > 10) {
      return send(response, 400, { message: "Nomor tryout harus antara 1 sampai 10." });
    }

    const payload = {
      enabled: request.body?.enabled === true,
      title: String(request.body?.title || "Tryout Nasional Mingguan").slice(0, 80),
      packageNumber,
      startAt: String(request.body?.startAt || ""),
      endAt: String(request.body?.endAt || ""),
      socialUrl: String(request.body?.socialUrl || "").slice(0, 500),
      accessCode: String(request.body?.accessCode || "").trim().toUpperCase().slice(0, 30),
      eventId: `weekly-${String(request.body?.startAt || Date.now()).replace(/[^0-9]/g, "").slice(0, 14)}`,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: firebaseUser.uid,
    };
    await settingsRef.set(payload, { merge: true });
    return send(response, 200, publicSettings(payload));
  } catch (error) {
    console.error("Weekly tryout settings failed", error);
    return send(response, 500, { message: "Pengaturan Tryout Nasional belum dapat diproses." });
  }
};
