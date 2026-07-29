import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPageSKDCore from "./LandingPageSKDCore";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Simulasi from "./pages/Simulasi";
import HasilSimulasi from "./pages/HasilSimulasi";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import SimpleAdminDashboard from "./pages/SimpleAdminDashboard";
import SimulationMenu from "./pages/SimulationMenu";
import TrainingMenu from "./pages/TrainingMenu";
import WrongAnswers from "./pages/WrongAnswers";
import PublicInfo from "./pages/PublicInfo";
import Feedback from "./pages/Feedback";
import { clearLegacyAuth, setCurrentUser } from "./utils/auth";
import { observeAuth } from "./services/auth";

function RequireAuth({ children, roles, user, loading }) {
  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-50 px-4 dark:bg-slate-950"><div className="text-center"><div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600 dark:border-slate-800 dark:border-t-blue-400" /><p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">Menyiapkan akun...</p></div></div>;
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clearLegacyAuth();
    return observeAuth((profile) => {
      setUser(profile);
      setCurrentUser(profile);
      setLoading(false);
    });
  }, []);

  const guard = (children, roles) => <RequireAuth roles={roles} user={user} loading={loading}>{children}</RequireAuth>;

  return (
    <Routes>
      <Route path="/" element={<LandingPageSKDCore />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/panduan" element={<PublicInfo page="panduan" />} />
      <Route path="/privasi" element={<PublicInfo page="privasi" />} />
      <Route path="/ketentuan" element={<PublicInfo page="ketentuan" />} />

      <Route
        path="/dashboard"
        element={
          guard(<Dashboard />, ["user", "admin"])
        }
      />

      <Route
        path="/profile"
        element={
          guard(<Profile />, ["user", "admin"])
        }
      />

      <Route
        path="/kritik-saran"
        element={
          guard(<Feedback />, ["user", "admin"])
        }
      />

      <Route
        path="/admin"
        element={
          guard(<SimpleAdminDashboard />, ["admin"])
        }
      />

      <Route
        path="/latihan"
        element={
          guard(<TrainingMenu />, ["user", "admin"])
        }
      />
      <Route
        path="/tryout"
        element={
          guard(<SimulationMenu />, ["user", "admin"])
        }
      />
      <Route path="/simulasi" element={<Navigate to="/tryout" replace />} />
      <Route
        path="/buku-kesalahan"
        element={
          guard(<WrongAnswers />, ["user", "admin"])
        }
      />
      <Route
        path="/simulasi/:mode"
        element={
          guard(<Simulasi />, ["user", "admin"])
        }
      />
      <Route
        path="/simulasi/sim/:num"
        element={
          guard(<Simulasi />, ["user", "admin"])
        }
      />

      <Route
        path="/hasil-simulasi"
        element={
          guard(<HasilSimulasi />, ["user", "admin"])
        }
      />

      <Route
        path="/leaderboard"
        element={
          guard(<Leaderboard />, ["user", "admin"])
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
