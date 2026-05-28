import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin())       return <Navigate to="/dashboard" replace />;
  return children;
}

export function SuperAdminRoute({ children }) {
  const { isAuthenticated, isSuperAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isSuperAdmin())  return <Navigate to="/dashboard" replace />;
  return children;
}

export function VendedorRoute({ children }) {
  const { isAuthenticated, hasRole } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // Vendedor, Admin y SuperAdmin pueden acceder
  if (!hasRole(['vendedor', 'admin', 'super-admin'])) return <Navigate to="/dashboard" replace />;
  return children;
}

export function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}
