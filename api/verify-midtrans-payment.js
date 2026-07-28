const { verifyUser } = require("./_firebase-admin");
const { activatePremium, getMidtransStatus, isPaid } = require("./_payments");

function send(response, status, body) {
  response.status(status).json(body);
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return send(response, 405, { message: "Metode tidak diizinkan." });
  }

  try {
    const user = await verifyUser(request);
    if (!user) return send(response, 401, { message: "Sesi login tidak valid. Silakan login ulang." });

    const orderId = String(request.body?.orderId || "");
    if (!orderId) return send(response, 400, { message: "Nomor transaksi tidak tersedia." });

    const status = await getMidtransStatus(orderId);
    if (status.custom_field1 !== user.uid) {
      return send(response, 403, { message: "Transaksi ini bukan milik akun kamu." });
    }
    if (!isPaid(status)) {
      return send(response, 409, { message: "Pembayaran belum berhasil dikonfirmasi." });
    }

    const premium = await activatePremium({ orderId, status });
    return send(response, 200, { active: true, premiumUntil: premium.premiumUntil });
  } catch (error) {
    console.error("Verify Midtrans payment failed", error);
    return send(response, 500, { message: "Aktivasi premium belum berhasil. Silakan coba periksa pembayaran kembali." });
  }
};
