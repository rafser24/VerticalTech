import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PrivateRoute, AdminRoute, PublicRoute } from './components/layout/RouteGuard';
import LoginPage     from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage  from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import SuppliersPage from './pages/SuppliersPage';
import ClientsPage   from './pages/ClientsPage';
import UsersPage     from './pages/UsersPage';
import PurchasesPage from './pages/PurchasesPage';
import SalesPage     from './pages/SalesPage';
import ReportsPage   from './pages/ReportsPage';   // ← nuevo
import NotFound      from './components/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"      element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/dashboard"  element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/productos"  element={<PrivateRoute><ProductsPage /></PrivateRoute>} />
        <Route path="/categorias" element={<PrivateRoute><CategoriesPage /></PrivateRoute>} />
        <Route path="/proveedores"element={<PrivateRoute><SuppliersPage /></PrivateRoute>} />
        <Route path="/clientes"   element={<PrivateRoute><ClientsPage /></PrivateRoute>} />
        <Route path="/compras"    element={<PrivateRoute><PurchasesPage /></PrivateRoute>} />
        <Route path="/ventas"     element={<PrivateRoute><SalesPage /></PrivateRoute>} />
        <Route path="/usuarios"   element={<AdminRoute><UsersPage /></AdminRoute>} />
        <Route path="/reportes"   element={<AdminRoute><ReportsPage /></AdminRoute>} /> {/* ← nuevo */}
        <Route path="/"           element={<Navigate to="/dashboard" replace />} />
        <Route path="*"           element={<NotFound />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        theme="light"
      />
    </BrowserRouter>
  );
}
