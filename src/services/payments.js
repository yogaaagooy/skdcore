import { auth } from "./firebase";

export async function listPayments() {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Sesi login tidak ditemukan.");

  const response = await fetch("/api/admin-payments", {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Data transaksi gagal dimuat.");
  return data.payments || [];
}
