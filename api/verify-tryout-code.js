const { adminDb, verifyUser } = require("./_firebase-admin");

function send(response, status, body) {
  response.status(status).json(body);
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return send(response, 405, { message: "Metode tidak diizinkan." });
  }

  try {
    const firebaseUser = await verifyUser(request);
    if (!firebaseUser) return send(response, 401, { message: "Sesi login tidak valid." });
    const snapshot = await adminDb().collection("settings").doc("weeklyTryout").get();
    const settings = snapshot.exists ? snapshot.data() : {};
    if (settings.enabled !== true) return send(response, 403, { message: "Tryout Nasional belum dibuka." });

    const now = Date.now();
    if (settings.startAt && now < Date.parse(settings.startAt)) return send(response, 403, { message: "Tryout Nasional belum dimulai." });
    if (settings.endAt && now > Date.parse(settings.endAt)) return send(response, 403, { message: "Tryout Nasional sudah berakhir." });

    const expected = String(settings.accessCode || "").trim().toUpperCase();
    const submitted = String(request.body?.code || "").trim().toUpperCase();
    if (expected && submitted !== expected) return send(response, 400, { message: "Kode akses belum tepat." });
    return send(response, 200, {
      valid: true,
      packageNumber: Number(settings.packageNumber || 1),
      eventId: settings.eventId || "",
      endAt: settings.endAt || null,
    });
  } catch (error) {
    console.error("Verify tryout code failed", error);
    return send(response, 500, { message: "Kode belum dapat diperiksa." });
  }
};
