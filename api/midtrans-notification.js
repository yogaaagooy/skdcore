const { activatePremium, getMidtransStatus, isPaid, validSignature } = require("./_payments");

function send(response, status, body) {
  response.status(status).json(body);
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return send(response, 405, { message: "Metode tidak diizinkan." });
  }

  try {
    if (!validSignature(request.body || {})) {
      return send(response, 401, { message: "Signature Midtrans tidak valid." });
    }

    const orderId = String(request.body?.order_id || "");
    const status = await getMidtransStatus(orderId);
    if (isPaid(status)) await activatePremium({ orderId, status });

    return send(response, 200, { received: true });
  } catch (error) {
    console.error("Midtrans notification failed", error);
    return send(response, 500, { message: "Notifikasi pembayaran belum dapat diproses." });
  }
};
