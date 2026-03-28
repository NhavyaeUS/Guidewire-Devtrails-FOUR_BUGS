import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import BottomNav from './components/BottomNav';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Policy from './pages/Policy';
import Claims from './pages/Claims';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import { Loader2 } from 'lucide-react';

// Require Auth Wrapper
function RequireAuth({ children, requireAdmin = false, requireOnboarded = true }: 
  { children: JSX.Element, requireAdmin?: boolean, requireOnboarded?: boolean }) {
  const { worker, token, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-500" size={40} />
      </div>
    );
  }

  if (!token || !worker) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !worker.isAdmin) {
    return <Navigate to="/" replace />;
  }

  // If worker needs onboarding but tries to access main app
  if (requireOnboarded && !worker.isAdmin && !worker.riskTier && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // If worker is onboarded but tries to access onboarding page
  if (!requireOnboarded && worker.riskTier && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />;
  }

  return children;
}

// App Layout with Bottom Nav
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-20 min-h-screen">
      {children}
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/onboarding" element={
          <RequireAuth requireOnboarded={false}>
            <Onboarding />
          </RequireAuth>
        } />

        <Route path="/" element={
          <RequireAuth>
            <AppLayout><Dashboard /></AppLayout>
          </RequireAuth>
        } />

        <Route path="/policy" element={
          <RequireAuth>
            <AppLayout><Policy /></AppLayout>
          </RequireAuth>
        } />

        <Route path="/claims" element={
          <RequireAuth>
            <AppLayout><Claims /></AppLayout>
          </RequireAuth>
        } />

        <Route path="/profile" element={
          <RequireAuth>
            <AppLayout><Profile /></AppLayout>
          </RequireAuth>
        } />

        {/* Admin Route */}
        <Route path="/admin" element={
          <RequireAuth requireAdmin={true}>
            <AdminDashboard />
          </RequireAuth>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
