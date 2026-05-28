import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { AppProvider }  from './context/AppContext';

import {
  PrivateRoute,
  AdminRoute,
  SuperAdminRoute,
  VendedorRoute,
  PublicRoute,
} from './components/layout/RouteGuard';

import LoginPage       from './pages/LoginPage';
import DashboardPage   from './pages/DashboardPage';
import ProductsPage    from './pages/ProductsPage';
import CategoriesPage  from './pages/CategoriesPage';
import SuppliersPage   from './pages/SuppliersPage';
import ClientsPage     from './pages/ClientsPage';
import UsersPage       from './pages/UsersPage';
import PurchasesPage   from './pages/PurchasesPage';
import SalesPage       from './pages/SalesPage';
import ReportsPage     from './pages/ReportsPage';
import AuditoriaPage   from './pages/AuditoriaPage';
import PromocionesPage from './pages/PromocionesPage';
import PosPage         from './pages/PosPage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import NotFound        from './components/NotFound';

export default function App() {
  return (
    <AuthProvider>
    <AppProvider>
    <BrowserRouter>
      <Routes>
        {/* Pública */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

        {/* Todos los roles autenticados */}
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />

        {/* Vendedor + Admin + SuperAdmin */}
        <Route path="/productos" element={<VendedorRoute><ProductsPage /></VendedorRoute>} />
        <Route path="/clientes"  element={<VendedorRoute><ClientsPage /></VendedorRoute>} />
        <Route path="/ventas"    element={<VendedorRoute><SalesPage /></VendedorRoute>} />
        <Route path="/pos"       element={<VendedorRoute><PosPage /></VendedorRoute>} />

        {/* Solo Admin + SuperAdmin */}
        <Route path="/categorias"    element={<AdminRoute><CategoriesPage /></AdminRoute>} />
        <Route path="/proveedores"   element={<AdminRoute><SuppliersPage /></AdminRoute>} />
        <Route path="/compras"       element={<AdminRoute><PurchasesPage /></AdminRoute>} />
        <Route path="/reportes"      element={<AdminRoute><ReportsPage /></AdminRoute>} />
        <Route path="/usuarios"      element={<AdminRoute><UsersPage /></AdminRoute>} />
        <Route path="/auditoria"     element={<SuperAdminRoute><AuditoriaPage /></SuperAdminRoute>} />
        <Route path="/promociones"   element={<AdminRoute><PromocionesPage /></AdminRoute>} />
        <Route path="/configuracion" element={<SuperAdminRoute><ConfiguracionPage /></SuperAdminRoute>} />

        {/* Redirección y 404 */}
        <Route path="/"  element={<Navigate to="/dashboard" replace />} />
        <Route path="*"  element={<NotFound />} />
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
    </AppProvider>
    </AuthProvider>
  );
}
