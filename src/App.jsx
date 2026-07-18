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
import AdminDashboard from "./pages/AdminDashboard";
import SimpleAdminDashboard from "./pages/SimpleAdminDashboard";
import SimulationMenu from "./pages/SimulationMenu";
import { getCurrentUser } from "./utils/auth";

function RequireAuth({ children, roles }) {
  const user = getCurrentUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPageSKDCore />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route
        path="/dashboard"
        element={
          <RequireAuth roles={["user", "admin"]}>
            <Dashboard />
          </RequireAuth>
        }
      />

      <Route
        path="/profile"
        element={
          <RequireAuth roles={["user", "admin"]}>
            <Profile />
          </RequireAuth>
        }
      />

      <Route
        path="/admin"
        element={
          <RequireAuth roles={["admin"]}>
            <SimpleAdminDashboard />
          </RequireAuth>
        }
      />

      <Route
        path="/simulasi"
        element={
          <RequireAuth roles={["user", "admin"]}>
            <SimulationMenu />
          </RequireAuth>
        }
      />
      <Route
        path="/simulasi/:mode"
        element={
          <RequireAuth roles={["user", "admin"]}>
            <Simulasi />
          </RequireAuth>
        }
      />
      <Route
        path="/simulasi/sim/:num"
        element={
          <RequireAuth roles={["user", "admin"]}>
            <Simulasi />
          </RequireAuth>
        }
      />

      <Route
        path="/hasil-simulasi"
        element={
          <RequireAuth roles={["user", "admin"]}>
            <HasilSimulasi />
          </RequireAuth>
        }
      />

      <Route
        path="/leaderboard"
        element={
          <RequireAuth roles={["user", "admin"]}>
            <Leaderboard />
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default App;
