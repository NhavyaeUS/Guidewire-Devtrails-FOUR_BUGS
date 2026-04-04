import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import Policy from './pages/Policy';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return token ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { token, worker, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!token) return <Navigate to="/login" />;
  if (!worker?.isAdmin) return <Navigate to="/" />;
  return <>{children}</> ;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      
      <Route path="/onboarding" element={
        <PrivateRoute>
          <Onboarding />
        </PrivateRoute>
      } />
      
      <Route path="/policy" element={
        <PrivateRoute>
          <Policy />
        </PrivateRoute>
      } />
      
      <Route path="/profile" element={
        <PrivateRoute>
          <Profile />
        </PrivateRoute>
      } />
      
      <Route path="/admin" element={
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      } />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
