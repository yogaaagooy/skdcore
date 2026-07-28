const crypto = require("crypto");
const { FieldValue, Timestamp } = require("firebase-admin/firestore");
const { adminDb } = require("./_firebase-admin");

const PRICE = 29000;
const PREMIUM_DAYS = 30;

function midtransBaseUrl() {
  return process.env.MIDTRANS_JS_PRODUCTION === "true"
    ? "https://api.midtrans.com"
    : "https://api.sandbox.midtrans.com";
}

function midtransAuthHeader() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY belum tersedia.");
  return `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;
}

async function getMidtransStatus(orderId) {
  const response = await fetch(`${midtransBaseUrl()}/v2/${encodeURIComponent(orderId)}/status`, {
    headers: { Accept: "application/json", Authorization: midtransAuthHeader() },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.status_message || "Status pembayaran Midtrans tidak dapat diperiksa.");
  return data;
}

function isPaid(status) {
  return status.transaction_status === "settlement"
    || (status.transaction_status === "capture" && status.fraud_status === "accept");
}

function validSignature(payload) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const source = `${payload.order_id || ""}${payload.status_code || ""}${payload.gross_amount || ""}${serverKey || ""}`;
  const expected = crypto.createHash("sha512").update(source).digest("hex");
  const received = String(payload.signature_key || "");
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

async function activatePremium({ orderId, status }) {
  const db = adminDb();
  const paymentRef = db.collection("payments").doc(orderId);

  return db.runTransaction(async (transaction) => {
    const paymentSnapshot = await transaction.get(paymentRef);
    if (!paymentSnapshot.exists) throw new Error("Data transaksi tidak ditemukan.");

    const payment = paymentSnapshot.data();
    if (payment.amount !== PRICE) throw new Error("Nominal transaksi tidak sesuai.");
    if (Number(status.gross_amount) !== PRICE) throw new Error("Nominal Midtrans tidak sesuai.");

    const userRef = db.collection("users").doc(payment.userId);
    const userSnapshot = await transaction.get(userRef);
    if (!userSnapshot.exists) throw new Error("Akun pengguna tidak ditemukan.");

    if (payment.status === "paid" && payment.premiumUntil) {
      return { userId: payment.userId, premiumUntil: payment.premiumUntil.toDate().toISOString() };
    }

    const now = Date.now();
    const currentUntil = userSnapshot.data().premiumUntil?.toMillis?.() || 0;
    const premiumUntil = Timestamp.fromMillis(Math.max(now, currentUntil) + PREMIUM_DAYS * 24 * 60 * 60 * 1000);

    transaction.update(userRef, {
      premiumActive: true,
      premiumUntil,
      premiumOrderId: orderId,
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(paymentRef, {
      status: "paid",
      transactionStatus: status.transaction_status,
      paymentType: status.payment_type || null,
      paidAt: FieldValue.serverTimestamp(),
      premiumUntil,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { userId: payment.userId, premiumUntil: premiumUntil.toDate().toISOString() };
  });
}

module.exports = {
  PRICE,
  activatePremium,
  getMidtransStatus,
  isPaid,
  midtransAuthHeader,
  validSignature,
};
