// src/hooks/useRole.js
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../services/firebase";

export default function useRole() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          setRole(data.role || "user");
        } else {
          setRole("user");
        }
      } catch (err) {
        console.error("Error load role:", err);
        setRole("user");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  return { role, loading };
}
