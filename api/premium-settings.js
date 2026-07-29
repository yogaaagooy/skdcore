const { FieldValue } = require("firebase-admin/firestore");
const { adminDb, verifyUser } = require("./_firebase-admin");

function send(response, status, body) {
  response.status(status).json(body);
}

module.exports = async function handler(request, response) {
  if (!["GET", "POST"].includes(request.method)) {
    response.setHeader("Allow", "GET, POST");
    return send(response, 405, { message: "Metode tidak diizinkan." });
  }

  try {
    const firebaseUser = await verifyUser(request);
    if (!firebaseUser) return send(response, 401, { message: "Sesi login tidak valid. Silakan login ulang." });

    const settingsRef = adminDb().collection("settings").doc("premium");

    if (request.method === "GET") {
      const snapshot = await settingsRef.get();
      return send(response, 200, { enabled: snapshot.exists && snapshot.data()?.enabled === true });
    }

    const profile = await adminDb().collection("users").doc(firebaseUser.uid).get();
    if (!profile.exists || profile.data()?.role !== "admin") {
      return send(response, 403, { message: "Hanya administrator yang dapat mengubah pengaturan premium." });
    }

    const enabled = request.body?.enabled === true;
    await settingsRef.set({
      enabled,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: firebaseUser.uid,
    }, { merge: true });

    return send(response, 200, { enabled });
  } catch (error) {
    console.error("Premium settings failed", error);
    return send(response, 500, { message: "Pengaturan premium belum dapat diproses." });
  }
};
