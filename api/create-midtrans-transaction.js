const { FieldValue } = require("firebase-admin/firestore");
const { adminDb, verifyUser } = require("./_firebase-admin");
const { PRICE, midtransAuthHeader } = require("./_payments");
const CHECKOUT_VERSION = "sandbox-v1";

function send(response, status, body) {
  response.status(status).json(body);
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return send(response, 405, { message: "Metode tidak diizinkan." });
  }

  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) return send(response, 503, { message: "Pembayaran belum dikonfigurasi." });

    const firebaseUser = await verifyUser(request);
    if (!firebaseUser) return send(response, 401, { message: "Sesi login tidak valid. Silakan login ulang." });

    const premiumSettings = await adminDb().collection("settings").doc("premium").get();
    if (!premiumSettings.exists || premiumSettings.data()?.enabled !== true) {
      return send(response, 503, { message: "Paket premium sedang dinonaktifkan oleh administrator." });
    }

    const packageNumber = Number(request.body?.packageNumber);
    if (!Number.isInteger(packageNumber) || packageNumber < 2 || packageNumber > 10) {
      return send(response, 400, { message: "Paket premium tidak valid." });
    }

    const isProduction = process.env.MIDTRANS_JS_PRODUCTION === "true";
    const snapBase = isProduction ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";
    const orderId = `NAL-${firebaseUser.uid}-${Date.now()}`;
    const displayName = firebaseUser.name || "Peserta NalarASN";

    const midtransResponse = await fetch(`${snapBase}/snap/v1/transactions`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": midtransAuthHeader(),
      },
      body: JSON.stringify({
        transaction_details: { order_id: orderId, gross_amount: PRICE },
        item_details: [{ id: `paket-${packageNumber}`, price: PRICE, quantity: 1, name: `NalarASN Premium - Paket ${packageNumber}` }],
        customer_details: {
          first_name: displayName.slice(0, 50),
          email: firebaseUser.email || "",
        },
        custom_field1: firebaseUser.uid,
        custom_field2: String(packageNumber),
      }),
    });

    const data = await midtransResponse.json();
    if (!midtransResponse.ok || !data.token) {
      console.error("Midtrans transaction error", data);
      return send(response, 502, { message: data.error_messages?.[0] || "Midtrans gagal membuat transaksi." });
    }

    await adminDb().collection("payments").doc(orderId).set({
      orderId,
      userId: firebaseUser.uid,
      packageNumber,
      amount: PRICE,
      status: "pending",
      environment: isProduction ? "production" : "sandbox",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return send(response, 200, { token: data.token, redirectUrl: data.redirect_url, orderId, checkoutVersion: CHECKOUT_VERSION });
  } catch (error) {
    console.error("Create Midtrans transaction failed", error);
    return send(response, 500, { message: "Terjadi kesalahan saat menyiapkan pembayaran." });
  }
};
