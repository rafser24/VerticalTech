import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin())       return <Navigate to="/dashboard" replace />;
  return children;
}

export function SuperAdminRoute({ children }) {
  const { isAuthenticated, isSuperAdmin } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isSuperAdmin())  return <Navigate to="/dashboard" replace />;
  return children;
}

export function VendedorRoute({ children }) {
  const { isAuthenticated, hasRole } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // Vendedor, Admin y SuperAdmin pueden acceder
  if (!hasRole(['vendedor', 'admin', 'super-admin'])) return <Navigate to="/dashboard" replace />;
  return children;
}

export function PublicRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}
