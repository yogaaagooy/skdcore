const PRICE = 29000;
const CHECKOUT_VERSION = "sandbox-v1";

function send(response, status, body) {
  response.status(status).json(body);
}

async function verifyFirebaseToken(idToken) {
  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) throw new Error("Konfigurasi Firebase server belum tersedia.");

  const result = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!result.ok) return null;
  const data = await result.json();
  return data.users?.[0] || null;
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return send(response, 405, { message: "Metode tidak diizinkan." });
  }

  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) return send(response, 503, { message: "Pembayaran belum dikonfigurasi." });

    const bearer = request.headers.authorization || "";
    const idToken = bearer.startsWith("Bearer ") ? bearer.slice(7) : "";
    const firebaseUser = idToken ? await verifyFirebaseToken(idToken) : null;
    if (!firebaseUser) return send(response, 401, { message: "Sesi login tidak valid. Silakan login ulang." });

    const packageNumber = Number(request.body?.packageNumber);
    if (!Number.isInteger(packageNumber) || packageNumber < 2 || packageNumber > 10) {
      return send(response, 400, { message: "Paket premium tidak valid." });
    }

    const isProduction = process.env.MIDTRANS_JS_PRODUCTION === "true";
    const snapBase = isProduction ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";
    const orderId = `NALARASN-${firebaseUser.localId.slice(0, 8)}-${Date.now()}`;
    const displayName = firebaseUser.displayName || "Peserta NalarASN";

    const midtransResponse = await fetch(`${snapBase}/snap/v1/transactions`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
      },
      body: JSON.stringify({
        transaction_details: { order_id: orderId, gross_amount: PRICE },
        item_details: [{ id: `paket-${packageNumber}`, price: PRICE, quantity: 1, name: `NalarASN Premium - Paket ${packageNumber}` }],
        customer_details: {
          first_name: displayName.slice(0, 50),
          email: firebaseUser.email,
        },
        custom_field1: firebaseUser.localId,
        custom_field2: String(packageNumber),
      }),
    });

    const data = await midtransResponse.json();
    if (!midtransResponse.ok || !data.token) {
      console.error("Midtrans transaction error", data);
      return send(response, 502, { message: data.error_messages?.[0] || "Midtrans gagal membuat transaksi." });
    }

    return send(response, 200, { token: data.token, redirectUrl: data.redirect_url, orderId, checkoutVersion: CHECKOUT_VERSION });
  } catch (error) {
    console.error("Create Midtrans transaction failed", error);
    return send(response, 500, { message: "Terjadi kesalahan saat menyiapkan pembayaran." });
  }
};
