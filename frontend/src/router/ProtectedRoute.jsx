import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {

  const isAuthenticated = !!localStorage.getItem('token');

  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }


  return <Outlet />;
}