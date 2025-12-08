// src/AdminRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import useRole from "./src/hooks/useRole";

export default function AdminRoute({ children }) {
  const { role, loading } = useRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        Memuat akses admin...
      </div>
    );
  }

  if (role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
