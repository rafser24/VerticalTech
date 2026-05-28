import axios from 'axios';
import { AUTH_STORAGE_KEY } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

/**
 * Lee el token JWT directamente desde localStorage.
 *
 * Los interceptores de Axios se ejecutan fuera del árbol de React,
 * así que no pueden usar useContext(). Leer desde localStorage es la
 * solución correcta: el AuthProvider mantiene ambos sincronizados
 * en cada cambio de estado mediante un useEffect.
 */
function getToken() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Compatibilidad con formato antiguo Zustand: { state: { token }, version }
    return (data.state ?? data)?.token ?? null;
  } catch {
    return null;
  }
}

// ── Interceptor de request: inyecta token y sanitiza body ────────────────────
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    // Si es FormData (subida de archivos) NO sanitizar — lo dejamos pasar directo
    if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
      config.data = sanitizeObject(config.data);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido — limpiar sesión y redirigir al login
      localStorage.removeItem(AUTH_STORAGE_KEY);
      // Solo redirigir si no estamos ya en /login (evita bucle)
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Sanitización de inputs (previene XSS básico) ─────────────────────────────
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  const sanitized = {};
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      sanitized[key] = obj[key].replace(/<[^>]*>/g, '').trim();
    } else if (typeof obj[key] === 'object') {
      sanitized[key] = sanitizeObject(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }
  return sanitized;
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authService = {
  login:  (creds) => api.post('/auth/login', creds),
  logout: ()      => api.post('/auth/logout'),
  me:     ()      => api.get('/auth/me'),
};

// ── Factory CRUD genérico ─────────────────────────────────────────────────────
const crudService = (endpoint) => ({
  getAll:  (params)    => api.get(endpoint, { params }),
  getById: (id)        => api.get(`${endpoint}/${id}`),
  create:  (data)      => api.post(endpoint, data),
  update:  (id, data)  => api.put(`${endpoint}/${id}`, data),
  remove:  (id)        => api.delete(`${endpoint}/${id}`),
  toggle:  (id)        => api.patch(`${endpoint}/${id}/toggle`),
});

// ── Servicios de entidades ────────────────────────────────────────────────────
export const productService       = crudService('/productos');
export const categoryService      = crudService('/categorias');
export const supplierService      = crudService('/proveedores');
export const clientService        = crudService('/clientes');
export const userService          = crudService('/usuarios');
export const paymentMethodService = crudService('/metodos-pago');

export const purchaseService = {
  ...crudService('/compras'),
  confirmar:  (id) => api.patch(`/compras/${id}/confirmar`),
  recibir:    (id) => api.patch(`/compras/${id}/recibir`),
  anular:     (id) => api.patch(`/compras/${id}/anular`),
  retroceder: (id) => api.patch(`/compras/${id}/retroceder`),
};

export const saleService = {
  ...crudService('/ventas'),
  getPendientes:          ()     => api.get('/ventas/pendientes'),
  createPendiente:        (data) => api.post('/ventas/pendiente', data),
  confirmarTransferencia: (id)   => api.patch(`/ventas/${id}/confirmar-transferencia`),
  anular:                 (id)   => api.patch(`/ventas/${id}/anular`),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardService = {
  getStats:      ()       => api.get('/dashboard/resumen'),
  getRecentSales:()       => api.get('/dashboard/ventas-por-periodo'),
  getSalesChart: (params) => api.get('/dashboard/ventas-por-periodo', { params }),
};

// ── Auditoría ─────────────────────────────────────────────────────────────────
export const auditoriaService = {
  getAll:  (params) => api.get('/auditoria', { params }),
  getById: (id)     => api.get(`/auditoria/${id}`),
};

// ── Reportes ─────────────────────────────────────────────────────────────────
export const reportService = {
  getSummary:         (params) => api.get('/dashboard/resumen',                { params }),
  getSalesByPeriod:   (params) => api.get('/dashboard/ventas-por-periodo',     { params }),
  getTopProducts:     (params) => api.get('/dashboard/productos-mas-vendidos', { params }),
  getTopClients:      (params) => api.get('/dashboard/top-clientes',           { params }),
  getLowStock:        ()       => api.get('/dashboard/stock-bajo'),
  getSalesReport:     (params) => api.get('/dashboard/reporte-ventas',         { params }),
  getPurchasesReport: (params) => api.get('/dashboard/reporte-compras',        { params }),
};

export default api;