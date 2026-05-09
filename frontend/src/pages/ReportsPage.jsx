import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  BarChart2, TrendingUp, ShoppingCart, Package,
  Download, Filter, Calendar, RefreshCw, AlertTriangle,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import StatCard from '../components/ui/StatCard';
import { formatCurrency, formatDate, statusColors } from '../utils/helpers';
import api from '../services/api';

// ─── Servicio de reportes ─────────────────────────────────────────────────────
const reportService = {
  getSummary:        (params) => api.get('/dashboard/resumen', { params }),
  getSalesByPeriod:  (params) => api.get('/dashboard/ventas-por-periodo', { params }),
  getTopProducts:    (params) => api.get('/dashboard/productos-mas-vendidos', { params }),
  getTopClients:     (params) => api.get('/dashboard/top-clientes', { params }),
  getLowStock:       ()       => api.get('/dashboard/stock-bajo'),
  getSalesReport:    (params) => api.get('/dashboard/reporte-ventas', { params }),
  getPurchasesReport:(params) => api.get('/dashboard/reporte-compras', { params }),
};

// ─── Utilidades ───────────────────────────────────────────────────────────────
const currentYear  = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

// ─── Componente: Barra de filtros ─────────────────────────────────────────────
function FilterBar({ mes, anio, onMesChange, onAnioChange, onApply, loading }) {
  return (
    <div className="card flex flex-wrap items-end gap-4">
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Mes</label>
        <select
          value={mes}
          onChange={e => onMesChange(Number(e.target.value))}
          className="input-field w-40"
        >
          {MONTHS.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Año</label>
        <select
          value={anio}
          onChange={e => onAnioChange(Number(e.target.value))}
          className="input-field w-28"
        >
          {[currentYear, currentYear - 1, currentYear - 2].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <button
        onClick={onApply}
        disabled={loading}
        className="btn-primary flex items-center gap-2"
      >
        {loading
          ? <><RefreshCw size={14} className="animate-spin" /> Cargando...</>
          : <><Filter size={14} /> Aplicar filtros</>
        }
      </button>
    </div>
  );
}

// ─── Componente: Tabla genérica de reporte ────────────────────────────────────
function ReportTable({ title, icon: Icon, columns, data, emptyMsg = 'Sin datos para este período' }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
          <Icon size={18} className="text-blue-500" />
          {title}
        </h3>
        <span className="text-xs text-gray-400">{data.length} registros</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b">
              {columns.map(col => (
                <th key={col.key} className="pb-3 px-2">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.length > 0 ? (
              data.map((row, idx) => (
                <tr key={row.id || idx} className="hover:bg-gray-50 transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className="py-3 px-2">
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-10 text-center text-gray-400 text-sm">
                  {emptyMsg}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Componente: Barra de progreso simple ─────────────────────────────────────
function ProgressBar({ value, max, color = 'bg-blue-400' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5">
      <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [mes, setMes]   = useState(currentMonth);
  const [anio, setAnio] = useState(currentYear);
  const [loading, setLoading] = useState(true);

  // Estados de datos
  const [summary, setSummary]         = useState(null);
  const [salesReport, setSalesReport] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topClients, setTopClients]   = useState([]);
  const [lowStock, setLowStock]       = useState([]);
  const [salesByPeriod, setSalesByPeriod] = useState([]);

  // ── Carga de datos ─────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = { mes, anio };

      const [sumRes, salesRes, prodRes, clientRes, stockRes, periodRes] = await Promise.allSettled([
        reportService.getSummary(params),
        reportService.getSalesReport(params),
        reportService.getTopProducts(params),
        reportService.getTopClients(params),
        reportService.getLowStock(),
        reportService.getSalesByPeriod(),
      ]);

      if (sumRes.status    === 'fulfilled') setSummary(sumRes.value.data?.data        || sumRes.value.data        || null);
      if (salesRes.status  === 'fulfilled') setSalesReport(salesRes.value.data?.data?.ventas  || salesRes.value.data?.ventas  || []);
      if (prodRes.status   === 'fulfilled') setTopProducts(prodRes.value.data?.data            || prodRes.value.data            || []);
      if (clientRes.status === 'fulfilled') setTopClients(clientRes.value.data?.data           || clientRes.value.data           || []);
      if (stockRes.status  === 'fulfilled') setLowStock(stockRes.value.data?.data              || stockRes.value.data              || []);
      if (periodRes.status === 'fulfilled') setSalesByPeriod(periodRes.value.data?.data        || periodRes.value.data        || []);

    } catch {
      toast.error('Error al cargar los reportes');
    } finally {
      setLoading(false);
    }
  }, [mes, anio]);

  useEffect(() => {
    fetchAll();
  }, []);

  // ── Columnas de reportes ───────────────────────────────────────────
  const salesColumns = [
    { key: 'id_venta', label: '#', render: v => <span className="text-xs text-gray-400 font-mono">{v}</span> },
    { key: 'fecha',    label: 'Fecha',   render: v => formatDate(v) },
    { key: 'cliente',  label: 'Cliente', render: (_, r) => r.cliente?.nombre || 'Consumidor final' },
    { key: 'estado',   label: 'Estado',  render: v => (
      <span className={`badge ${statusColors[v] || 'bg-gray-100 text-gray-600'}`}>{v}</span>
    )},
    { key: 'total',    label: 'Total',   render: v => <span className="font-semibold">{formatCurrency(v)}</span> },
  ];

  const topProductColumns = [
    { key: '_rank', label: '#', render: (_, r, idx) => (
      <span className="w-6 h-6 rounded-full bg-pastel-primary flex items-center justify-center text-blue-800 font-bold text-xs">
        {(idx ?? 0) + 1}
      </span>
    )},
    { key: 'nombre_producto', label: 'Producto', render: (v, r) => (
      <div>
        <p className="font-medium text-gray-800">{v}</p>
        <p className="text-xs text-gray-400">{r.marca || ''}</p>
      </div>
    )},
    { key: 'unidades_vendidas', label: 'Unidades', render: (v, r) => (
      <div className="space-y-1">
        <span className="font-semibold text-gray-700">{v}</span>
        <ProgressBar value={Number(v)} max={Number(topProducts[0]?.unidades_vendidas || 1)} color="bg-blue-300" />
      </div>
    )},
    { key: 'total_generado', label: 'Ingresos', render: v => (
      <span className="font-semibold text-green-700">{formatCurrency(v)}</span>
    )},
  ];

  const topClientColumns = [
    { key: 'nombre',        label: 'Cliente',   render: v => <span className="font-medium">{v}</span> },
    { key: 'telefono',      label: 'Teléfono',  render: v => v || '—' },
    { key: 'total_compras', label: 'Compras',   render: v => <span className="badge bg-pastel-primary/30 text-blue-800">{v}</span> },
    { key: 'total_gastado', label: 'Total gastado', render: v => (
      <span className="font-semibold text-green-700">{formatCurrency(v)}</span>
    )},
  ];

  const lowStockColumns = [
    { key: 'nombre_producto', label: 'Producto', render: (v, r) => (
      <div className="flex items-center gap-2">
        <AlertTriangle size={14} className="text-orange-500 shrink-0" />
        <div>
          <p className="font-medium text-gray-800">{v}</p>
          <p className="text-xs text-gray-400">{r.categoria || ''}</p>
        </div>
      </div>
    )},
    { key: 'stock_actual',  label: 'Stock actual',  render: v => <span className="font-semibold text-red-600">{v}</span> },
    { key: 'stock_minimo',  label: 'Stock mínimo',  render: v => <span className="text-gray-600">{v}</span> },
    { key: 'diferencia',    label: 'Faltante',      render: v => (
      <span className="badge bg-pastel-accent/30 text-red-700">−{v}</span>
    )},
    { key: 'proveedor',     label: 'Proveedor',     render: v => v || '—' },
  ];

  // ── Métricas del resumen ───────────────────────────────────────────
  const ingresosMes  = Number(summary?.ventas?.mes?.total    || 0);
  const egresosMes   = Number(summary?.compras?.mes?.total   || 0);
  const margenMes    = Number(summary?.margen_mes            || 0);
  const ventasMes    = Number(summary?.ventas?.mes?.cantidad || 0);
  const stockBajoCount = Number(summary?.productos_stock_bajo || lowStock.length || 0);

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <MainLayout title="Reportes">
      <div className="space-y-6">

        {/* Filtros */}
        <FilterBar
          mes={mes}
          anio={anio}
          onMesChange={setMes}
          onAnioChange={setAnio}
          onApply={fetchAll}
          loading={loading}
        />

        {/* Título del período */}
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Calendar size={14} />
          Mostrando datos de <strong className="text-gray-700">{MONTHS[mes - 1]} {anio}</strong>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Ingresos del mes"
            value={formatCurrency(ingresosMes)}
            icon={TrendingUp}
            color="green"
            subtitle={`${ventasMes} ventas completadas`}
          />
          <StatCard
            title="Egresos del mes"
            value={formatCurrency(egresosMes)}
            icon={ShoppingCart}
            color="pink"
            subtitle={`${summary?.compras?.mes?.cantidad || 0} compras`}
          />
          <StatCard
            title="Margen neto"
            value={formatCurrency(margenMes)}
            icon={BarChart2}
            color={margenMes >= 0 ? 'blue' : 'orange'}
            subtitle={margenMes >= 0 ? 'Resultado positivo' : 'Resultado negativo'}
          />
          <StatCard
            title="Stock bajo"
            value={stockBajoCount}
            icon={AlertTriangle}
            color="orange"
            subtitle="Productos por reabastecer"
          />
        </div>

        {/* Gráfico simple de ventas por período */}
        {salesByPeriod.length > 0 && (
          <div className="card">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-4">
              <BarChart2 size={18} className="text-blue-500" />
              Ventas últimos 12 meses
            </h3>
            <div className="flex items-end gap-2 h-32 overflow-x-auto pb-2">
              {salesByPeriod.map((p, i) => {
                const maxTotal = Math.max(...salesByPeriod.map(x => Number(x.total || 0)), 1);
                const heightPct = (Number(p.total || 0) / maxTotal) * 100;
                return (
                  <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0 w-10 group">
                    <div className="relative w-full">
                      <div
                        className="w-full bg-pastel-primary/60 hover:bg-blue-400 rounded-t transition-colors cursor-default"
                        style={{ height: `${Math.max(heightPct * 1.1, 4)}px` }}
                        title={`${p.periodo}: ${formatCurrency(p.total)}`}
                      />
                    </div>
                    <span className="text-[9px] text-gray-400 whitespace-nowrap rotate-45 origin-left">
                      {p.periodo?.slice(5) || p.periodo}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tablas principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top productos */}
          <ReportTable
            title="Top productos vendidos"
            icon={Package}
            columns={topProductColumns}
            data={topProducts.slice(0, 10)}
            emptyMsg="Sin ventas en este período"
          />

          {/* Top clientes */}
          <ReportTable
            title="Mejores clientes del mes"
            icon={TrendingUp}
            columns={topClientColumns}
            data={topClients.slice(0, 10)}
            emptyMsg="Sin clientes en este período"
          />
        </div>

        {/* Detalle de ventas del mes */}
        <ReportTable
          title={`Detalle de ventas — ${MONTHS[mes - 1]} ${anio}`}
          icon={ShoppingCart}
          columns={salesColumns}
          data={salesReport}
          emptyMsg="Sin ventas registradas en este período"
        />

        {/* Stock bajo */}
        {lowStock.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-orange-700 font-medium">
              <AlertTriangle size={15} />
              {lowStock.length} producto(s) requieren reabastecimiento urgente
            </div>
            <ReportTable
              title="Productos con stock bajo"
              icon={AlertTriangle}
              columns={lowStockColumns}
              data={lowStock}
            />
          </div>
        )}

      </div>
    </MainLayout>
  );
}
