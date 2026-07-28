const { adminDb, verifyUser } = require("./_firebase-admin");

function send(response, status, body) {
  response.status(status).json(body);
}

function toIso(value) {
  return value?.toDate?.().toISOString() || null;
}

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return send(response, 405, { message: "Metode tidak diizinkan." });
  }

  try {
    const user = await verifyUser(request);
    if (!user) return send(response, 401, { message: "Sesi login tidak valid." });

    const db = adminDb();
    const adminSnapshot = await db.collection("users").doc(user.uid).get();
    if (!adminSnapshot.exists || adminSnapshot.data().role !== "admin") {
      return send(response, 403, { message: "Akses hanya untuk administrator." });
    }

    const paymentSnapshot = await db.collection("payments").orderBy("createdAt", "desc").limit(200).get();
    const payments = paymentSnapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
    const userIds = [...new Set(payments.map((payment) => payment.userId).filter(Boolean))];
    const userSnapshots = userIds.length
      ? await db.getAll(...userIds.map((userId) => db.collection("users").doc(userId)))
      : [];
    const users = Object.fromEntries(userSnapshots.map((snapshot) => [snapshot.id, snapshot.data() || {}]));

    return send(response, 200, {
      payments: payments.map((payment) => ({
        id: payment.id,
        orderId: payment.orderId || payment.id,
        userId: payment.userId,
        name: users[payment.userId]?.name || "Tanpa nama",
        email: users[payment.userId]?.email || "-",
        packageNumber: payment.packageNumber || null,
        amount: Number(payment.amount || 0),
        status: payment.status || "pending",
        transactionStatus: payment.transactionStatus || null,
        paymentType: payment.paymentType || null,
        environment: payment.environment || "sandbox",
        createdAt: toIso(payment.createdAt),
        paidAt: toIso(payment.paidAt),
        premiumUntil: toIso(payment.premiumUntil),
      })),
    });
  } catch (error) {
    console.error("Admin payments failed", error);
    return send(response, 500, { message: "Data transaksi belum dapat dimuat." });
  }
};
