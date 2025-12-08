// src/ProtectedRoute.jsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./services/firebase";

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!user) {
    // kalau belum login, tendang ke /login
    return <Navigate to="/login" replace />;
  }

  // kalau sudah login, tampilkan child-nya (Dashboard)
  return children;
}

export default ProtectedRoute;
