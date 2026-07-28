const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON belum tersedia.");

  try {
    const serviceAccount = JSON.parse(raw);
    if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
      throw new Error("Field service account tidak lengkap.");
    }
    return serviceAccount;
  } catch (error) {
    throw new Error(`Konfigurasi Firebase Admin tidak valid: ${error.message}`);
  }
}

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  return initializeApp({ credential: cert(getServiceAccount()) });
}

async function verifyUser(request) {
  const bearer = request.headers.authorization || "";
  const idToken = bearer.startsWith("Bearer ") ? bearer.slice(7) : "";
  if (!idToken) return null;

  try {
    return await getAuth(getAdminApp()).verifyIdToken(idToken);
  } catch {
    return null;
  }
}

function adminDb() {
  return getFirestore(getAdminApp());
}

module.exports = { adminDb, verifyUser };
