import { useState, useEffect, useCallback } from 'react';
import {
  Shield, Eye, ChevronLeft, ChevronRight,
  RefreshCw, Filter, X, Clock,
} from 'lucide-react';
import { toast } from 'react-toastify';
import MainLayout from '../components/layout/MainLayout';
import Modal from '../components/ui/Modal';
import { auditoriaService } from '../services/api';
import { formatDatetime } from '../utils/helpers';

// ── Configuración de acciones ────────────────────────────────────────────────
const ACCION_CONFIG = {
  created: { label: 'Creado',    bg: 'bg-green-100',  text: 'text-green-800'  },
  updated: { label: 'Editado',   bg: 'bg-blue-100',   text: 'text-blue-800'   },
  deleted: { label: 'Eliminado', bg: 'bg-red-100',    text: 'text-red-800'    },
  login:   { label: 'Login',     bg: 'bg-purple-100', text: 'text-purple-800' },
  logout:  { label: 'Logout',    bg: 'bg-yellow-100', text: 'text-yellow-800' },
};

const MODELOS = [
  '', 'Venta', 'Compra', 'Producto', 'Cliente',
  'Proveedor', 'Categoria', 'Usuario', 'MetodoPago',
];

const ACCIONES = ['', 'created', 'updated', 'deleted', 'login', 'logout'];

const PER_PAGE = 20;

// ── Componente badge de acción ────────────────────────────────────────────────
function AccionBadge({ accion }) {
  const cfg = ACCION_CONFIG[accion] ?? { label: accion, bg: 'bg-gray-100', text: 'text-gray-600' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

// ── Visualizador de JSON con colores ─────────────────────────────────────────
function JsonViewer({ data, label, color }) {
  if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
    return (
      <div>
        <p className={`text-xs font-semibold mb-1.5 ${color}`}>{label}</p>
        <p className="text-xs text-gray-400 italic">Sin datos</p>
      </div>
    );
  }
  return (
    <div>
      <p className={`text-xs font-semibold mb-1.5 ${color}`}>{label}</p>
      <pre className="text-xs bg-gray-50 border border-gray-100 rounded-lg p-3 overflow-auto max-h-64 whitespace-pre-wrap break-words">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function AuditoriaPage() {
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [page, setPage]         = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal]       = useState(0);

  const [filters, setFilters] = useState({
    modelo:     '',
    accion:     '',
    desde:      '',
    hasta:      '',
  });

  const [selected, setSelected]   = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: PER_PAGE };
      if (filters.modelo) params.modelo = filters.modelo;
      if (filters.accion) params.accion = filters.accion;
      if (filters.desde)  params.desde  = filters.desde;
      if (filters.hasta)  params.hasta  = filters.hasta;

      const res  = await auditoriaService.getAll(params);
      const body = res.data;

      setLogs(Array.isArray(body.data) ? body.data : []);

      if (body.pagination) {
        setTotal(body.pagination.total ?? 0);
        setLastPage(body.pagination.last_page ?? 1);
      }
    } catch {
      toast.error('Error al cargar los registros de auditoría');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ modelo: '', accion: '', desde: '', hasta: '' });
    setPage(1);
  };

  const openDetail = (log) => {
    setSelected(log);
    setDetailOpen(true);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  // ── Rango de páginas visible ──────────────────────────────────────────────
  const pageRange = () => {
    const delta = 2;
    const start = Math.max(1, page - delta);
    const end   = Math.min(lastPage, page + delta);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <MainLayout>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pastel-primary flex items-center justify-center">
              <Shield size={20} className="text-blue-800" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-gray-800">Auditoría</h1>
              <p className="text-xs text-gray-400">Registro de todas las acciones del sistema</p>
            </div>
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="btn-ghost border border-gray-200 flex items-center gap-2 text-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {/* Filtros */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={14} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Filtros</span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                <X size={12} /> Limpiar
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Modelo */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Módulo</label>
              <select
                value={filters.modelo}
                onChange={e => handleFilter('modelo', e.target.value)}
                className="input-field text-sm"
              >
                {MODELOS.map(m => (
                  <option key={m} value={m}>{m || 'Todos'}</option>
                ))}
              </select>
            </div>

            {/* Acción */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Acción</label>
              <select
                value={filters.accion}
                onChange={e => handleFilter('accion', e.target.value)}
                className="input-field text-sm"
              >
                {ACCIONES.map(a => (
                  <option key={a} value={a}>
                    {a ? (ACCION_CONFIG[a]?.label ?? a) : 'Todas'}
                  </option>
                ))}
              </select>
            </div>

            {/* Desde */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Desde</label>
              <input
                type="date"
                value={filters.desde}
                onChange={e => handleFilter('desde', e.target.value)}
                className="input-field text-sm"
              />
            </div>

            {/* Hasta */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hasta</label>
              <input
                type="date"
                value={filters.hasta}
                onChange={e => handleFilter('hasta', e.target.value)}
                className="input-field text-sm"
              />
            </div>
          </div>
        </div>

        {/* Contador */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {loading ? 'Cargando...' : `${total.toLocaleString('es-SV')} registros encontrados`}
          </span>
          <span className="text-xs">
            Página {page} de {lastPage}
          </span>
        </div>

        {/* Tabla */}
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Fecha y hora</th>
                  <th className="table-header">Módulo</th>
                  <th className="table-header">ID</th>
                  <th className="table-header">Acción</th>
                  <th className="table-header">Usuario</th>
                  <th className="table-header">IP</th>
                  <th className="table-header text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="table-cell text-center py-14 text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw size={20} className="animate-spin opacity-40" />
                        <span className="text-sm">Cargando registros...</span>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="table-cell text-center py-14 text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Shield size={28} className="opacity-20" />
                        <span className="text-sm">No hay registros con los filtros aplicados</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="table-cell">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Clock size={12} className="text-gray-300 flex-shrink-0" />
                          <span className="text-xs">{formatDatetime(log.fecha)}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="text-sm font-medium text-gray-700">{log.modelo}</span>
                      </td>
                      <td className="table-cell">
                        <span className="text-xs text-gray-500 font-mono">
                          {log.modelo_id ?? '—'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <AccionBadge accion={log.accion} />
                      </td>
                      <td className="table-cell">
                        <span className="text-sm text-gray-600">
                          {log.usuario ? `@${log.usuario.usuario}` : <span className="text-gray-300 italic">Sistema</span>}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="text-xs font-mono text-gray-400">{log.ip ?? '—'}</span>
                      </td>
                      <td className="table-cell text-right">
                        <button
                          onClick={() => openDetail(log)}
                          className="p-1.5 rounded-lg hover:bg-pastel-primary/20 text-blue-600 transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginación */}
        {!loading && lastPage > 1 && (
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            {pageRange().map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  page === p
                    ? 'bg-pastel-primary text-blue-900'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage(p => Math.min(lastPage, p + 1))}
              disabled={page === lastPage}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Modal detalle */}
      <Modal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Detalle del registro"
        size="lg"
      >
        {selected && (
          <div className="space-y-4">
            {/* Meta info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <p className="text-xs text-gray-400">Módulo / ID</p>
                <p className="font-semibold text-gray-700">
                  {selected.modelo}
                  <span className="ml-1 font-mono text-gray-400 text-xs">
                    #{selected.modelo_id ?? '—'}
                  </span>
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <p className="text-xs text-gray-400">Acción</p>
                <AccionBadge accion={selected.accion} />
              </div>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <p className="text-xs text-gray-400">Usuario</p>
                <p className="font-semibold text-gray-700">
                  {selected.usuario ? `@${selected.usuario.usuario}` : 'Sistema'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <p className="text-xs text-gray-400">Fecha y hora</p>
                <p className="font-semibold text-gray-700">{formatDatetime(selected.fecha)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1 col-span-2">
                <p className="text-xs text-gray-400">IP</p>
                <p className="font-mono text-sm text-gray-600">{selected.ip ?? '—'}</p>
              </div>
            </div>

            {/* Valores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <JsonViewer
                data={selected.valores_anteriores}
                label="Valores anteriores"
                color="text-red-600"
              />
              <JsonViewer
                data={selected.valores_nuevos}
                label="Valores nuevos"
                color="text-green-600"
              />
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
}
