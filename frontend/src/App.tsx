import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import AdminLayout from './layouts/AdminLayout';
import LoginPage from './pages/LoginPage';
import IntegrationPage from './pages/IntegrationPage';
import DashboardPage from './pages/DashboardPage';
import ApplicationsPage from './pages/ApplicationsPage';
import LicensesPage from './pages/LicensesPage';
import GenerateKeysPage from './pages/GenerateKeysPage';
import SessionsPage from './pages/SessionsPage';
import LogsPage from './pages/LogsPage';
import LicenseDetailPage from './pages/LicenseDetailPage';

function ProtectedRoute({ children, admin, loading }: { children: React.ReactNode; admin: any; loading: boolean }) {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }
  if (!admin) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { admin, loading, login, logout } = useAuth();

  return (
    <>
      <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#171717', color: '#f5f5f5', border: '1px solid rgba(255,255,255,0.06)' },
          success: { iconTheme: { primary: '#ffffff', secondary: '#171717' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#171717' } },
        }}
      />
      <Routes>
        <Route path="/login" element={admin ? <Navigate to="/" replace /> : <LoginPage onLogin={login} />} />
        <Route
          path="/"
          element={
            <ProtectedRoute admin={admin} loading={loading}>
              <AdminLayout admin={admin!} onLogout={logout} />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="licenses" element={<LicensesPage />} />
          <Route path="licenses/:id" element={<LicenseDetailPage />} />
          <Route path="generate" element={<GenerateKeysPage />} />
          <Route path="integration" element={<IntegrationPage />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="logs" element={<LogsPage />} />
        </Route>
      </Routes>
      </BrowserRouter>
    </>
  );
}
