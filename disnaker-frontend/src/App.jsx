// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Toaster } from "react-hot-toast";
import { AlertProvider } from "./components/AlertPopup";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
import Forbidden from "./pages/Forbidden";

const PegawaiLayout = lazy(() => import("./pages/pegawai/PegawaiLayout"));
const SuperadminLayout = lazy(() => import("./pages/superadmin/SuperadminLayout"));
const PegawaiDashboardPage = lazy(() => import("./pages/pegawai/PegawaiDashboardPage"));
const PegawaiProfilePage = lazy(() => import("./pages/pegawai/PegawaiProfilePage"));
const AbsensiPage = lazy(() => import("./pages/pegawai/AbsensiPage"));
const PegawaiManagementPage = lazy(() => import("./pages/superadmin/PegawaiManagementPage"));
const BidangManagementPage = lazy(() => import("./pages/superadmin/BidangManagementPage"));
const AbsensiManagementPage = lazy(() => import("./pages/bidang/sekretariat/AbsensiManagementPage"));
const KelolaAbsensiPopupPage = lazy(() => import("./pages/bidang/sekretariat/KelolaAbsensiPopupPage"));

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// Guard for authenticated routes
const RequireAuth = ({ children }) => {
  const token = localStorage.getItem("expressToken");
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const RequireSuperadmin = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (user.role !== "superadmin") return <Navigate to="/forbidden" replace />;
  return children;
};

function App() {
  return (
    <AlertProvider>
      <Router>
        <Suspense fallback={<Spinner />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Pegawai - Absensi */}
            <Route
              path="/pegawai"
              element={
                <RequireAuth>
                  <PegawaiLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<PegawaiDashboardPage />} />
              <Route path="absensi" element={<AbsensiPage />} />
              <Route path="profile" element={<PegawaiProfilePage />} />
            </Route>

            {/* Superadmin */}
            <Route
              path="/superadmin"
              element={
                <RequireAuth>
                  <RequireSuperadmin>
                    <SuperadminLayout />
                  </RequireSuperadmin>
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="pegawai" replace />} />
              <Route path="pegawai" element={<PegawaiManagementPage />} />
              <Route path="bidang" element={<BidangManagementPage />} />
              <Route path="rekap" element={<AbsensiManagementPage />} />
              <Route path="popup" element={<KelolaAbsensiPopupPage />} />
            </Route>

            {/* Sekretariat - Absensi Management */}
            <Route
              path="/sekretariat"
              element={
                <RequireAuth>
                  <PegawaiLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="absensi-management" replace />} />
              <Route path="absensi-management" element={<AbsensiManagementPage />} />
              <Route path="kelola-absensi-popup" element={<KelolaAbsensiPopupPage />} />
            </Route>

            {/* Misc */}
            <Route path="/forbidden" element={<Forbidden />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>

        <Toaster position="top-center" />
      </Router>
    </AlertProvider>
  );
}

export default App;
