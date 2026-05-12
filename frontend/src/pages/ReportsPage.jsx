import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  BarChart2, TrendingUp, ShoppingCart, Package,
  FileText, Filter, Calendar, RefreshCw, AlertTriangle,
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import StatCard from '../components/ui/StatCard';
import { formatCurrency, formatDate, statusColors } from '../utils/helpers';
import api from '../services/api';

// ─── Servicio de reportes ─────────────────────────────────────────────────────
const reportService = {
  getSummary:        (params) => api.get('/dashboard/resumen',                { params }),
  getSalesByPeriod:  (params) => api.get('/dashboard/ventas-por-periodo',     { params }),
  getTopProducts:    (params) => api.get('/dashboard/productos-mas-vendidos', { params }),
  getTopClients:     (params) => api.get('/dashboard/top-clientes',           { params }),
  getLowStock:       ()       => api.get('/dashboard/stock-bajo'),
  getSalesReport:    (params) => api.get('/dashboard/reporte-ventas',         { params }),
  getPurchasesReport:(params) => api.get('/dashboard/reporte-compras',        { params }),
};

// ─── Utilidades ───────────────────────────────────────────────────────────────
const currentYear  = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

// Extrae array de cualquier forma que llegue el API
const unwrapArray = (res) => {
  const d = res?.data?.data ?? res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data))   return d.data;
  if (Array.isArray(d?.ventas)) return d.ventas;
  return [];
};

// ─── Generador PDF ────────────────────────────────────────────────────────────
const generarPDF = ({ mes, anio, summary, salesReport, topProducts, topClients, lowStock }) => {
  const mesNombre = MONTHS[mes - 1];
  const fecha     = new Date().toLocaleDateString('es-SV');
  const hora      = new Date().toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' });

  const ingresos = Number(summary?.ventas?.mes?.total    || 0);
  const egresos  = Number(summary?.compras?.mes?.total   || 0);
  const margen   = Number(summary?.margen_mes            || 0);
  const ventas   = Number(summary?.ventas?.mes?.cantidad || 0);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Reporte ${mesNombre} ${anio}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;font-size:11px;color:#1E293B;background:#fff;padding:32px}
    /* Cabecera */
    .header{border-bottom:3px solid #1E3A8A;padding-bottom:16px;margin-bottom:20px}
    .header-top{display:flex;justify-content:space-between;align-items:flex-start}
    .empresa-nombre{font-size:22px;font-weight:700;color:#1E3A8A;letter-spacing:-0.03em}
    .empresa-nombre span{color:#2563EB}
    .empresa-datos{font-size:9px;color:#64748B;line-height:1.7;margin-top:4px}
    .reporte-titulo{text-align:right}
    .reporte-titulo h2{font-size:16px;font-weight:700;color:#0F172A}
    .reporte-titulo p{font-size:9px;color:#94A3B8;margin-top:2px}
    /* KPIs */
    .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
    .kpi{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:12px}
    .kpi-label{font-size:8px;text-transform:uppercase;letter-spacing:0.08em;color:#94A3B8;margin-bottom:4px}
    .kpi-value{font-size:16px;font-weight:700;color:#0F172A}
    .kpi-sub{font-size:8px;color:#64748B;margin-top:2px}
    .kpi.verde .kpi-value{color:#16A34A}
    .kpi.rojo  .kpi-value{color:#DC2626}
    .kpi.azul  .kpi-value{color:#2563EB}
    /* Secciones */
    .seccion{margin-bottom:20px}
    .seccion-titulo{font-size:11px;font-weight:700;color:#1E3A8A;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid #E2E8F0;padding-bottom:6px;margin-bottom:10px}
    /* Tablas */
    table{width:100%;border-collapse:collapse;font-size:10px}
    th{background:#1E3A8A;color:#fff;text-align:left;padding:6px 8px;font-size:9px;text-transform:uppercase;letter-spacing:0.06em}
    td{padding:5px 8px;border-bottom:1px solid #F1F5F9;color:#334155}
    tr:nth-child(even) td{background:#F8FAFC}
    .text-right{text-align:right}
    .text-center{text-align:center}
    .badge{display:inline-block;padding:2px 6px;border-radius:4px;font-size:8px;font-weight:600}
    .badge-green{background:#DCFCE7;color:#166534}
    .badge-red{background:#FEE2E2;color:#991B1B}
    /* Pie */
    .footer{margin-top:28px;padding-top:12px;border-top:1px solid #E2E8F0;display:flex;justify-content:space-between;font-size:8px;color:#94A3B8}
    @media print{body{padding:16px}}
  </style>
</head>
<body>
  <!-- CABECERA -->
  <div class="header">
    <div class="header-top">
      <div>
        <div class="empresa-nombre">Vertical<span>Tech</span></div>
        <div class="empresa-datos">
          Col. Escalón, Calle La Reforma #123, San Salvador, El Salvador<br/>
          Tel: +503 2222-3333 &nbsp;|&nbsp; NIT: 0614-010101-001-0 &nbsp;|&nbsp; info@verticaltech.sv
        </div>
      </div>
      <div class="reporte-titulo">
        <h2>Reporte Mensual</h2>
        <p>${mesNombre} ${anio}</p>
        <p>Generado: ${fecha} ${hora}</p>
        <p>Documento no válido como crédito fiscal</p>
      </div>
    </div>
  </div>

  <!-- KPIs -->
  <div class="kpis">
    <div class="kpi verde">
      <div class="kpi-label">Ingresos del mes</div>
      <div class="kpi-value">${formatCurrency(ingresos)}</div>
      <div class="kpi-sub">${ventas} ventas completadas</div>
    </div>
    <div class="kpi rojo">
      <div class="kpi-label">Egresos del mes</div>
      <div class="kpi-value">${formatCurrency(egresos)}</div>
      <div class="kpi-sub">${summary?.compras?.mes?.cantidad || 0} compras</div>
    </div>
    <div class="kpi ${margen >= 0 ? 'azul' : 'rojo'}">
      <div class="kpi-label">Margen neto</div>
      <div class="kpi-value">${formatCurrency(margen)}</div>
      <div class="kpi-sub">${margen >= 0 ? 'Resultado positivo' : 'Resultado negativo'}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Stock bajo</div>
      <div class="kpi-value">${lowStock.length}</div>
      <div class="kpi-sub">Productos por reabastecer</div>
    </div>
  </div>

  <!-- DETALLE DE VENTAS -->
  <div class="seccion">
    <div class="seccion-titulo">Detalle de ventas — ${mesNombre} ${anio}</div>
    <table>
      <thead><tr>
        <th>#</th><th>N° Venta</th><th>Fecha</th><th>Cliente</th><th>Método pago</th><th>Estado</th><th class="text-right">Total</th>
      </tr></thead>
      <tbody>
        ${salesReport.length > 0
          ? salesReport.map((v, i) => `<tr>
              <td class="text-center">${i + 1}</td>
              <td style="font-family:monospace">${v.numero_venta ?? '—'}</td>
              <td>${formatDate(v.fecha_venta ?? v.fecha)}</td>
              <td>${v.cliente?.nombre ?? 'Consumidor final'}</td>
              <td>${v.metodo_pago?.nombre ?? '—'}</td>
              <td><span class="badge ${v.estado === 'completada' ? 'badge-green' : 'badge-red'}">${v.estado}</span></td>
              <td class="text-right" style="font-weight:600">${formatCurrency(v.total)}</td>
            </tr>`).join('')
          : `<tr><td colspan="7" style="text-align:center;color:#94A3B8;padding:16px">Sin ventas en este período</td></tr>`
        }
        ${salesReport.length > 0 ? `
        <tr style="background:#EFF6FF">
          <td colspan="6" style="text-align:right;font-weight:700;color:#1E3A8A">Total del período:</td>
          <td class="text-right" style="font-weight:700;color:#1E3A8A">${formatCurrency(salesReport.reduce((s,v) => s + Number(v.total||0), 0))}</td>
        </tr>` : ''}
      </tbody>
    </table>
  </div>

  <!-- TOP PRODUCTOS -->
  <div class="seccion">
    <div class="seccion-titulo">Top productos vendidos</div>
    <table>
      <thead><tr><th>#</th><th>Producto</th><th class="text-center">Unidades</th><th class="text-right">Ingresos</th></tr></thead>
      <tbody>
        ${topProducts.length > 0
          ? topProducts.slice(0,10).map((p, i) => `<tr>
              <td class="text-center">${i+1}</td>
              <td><strong>${p.nombre_producto ?? p.nombre ?? '—'}</strong>${p.marca ? `<br/><span style="color:#94A3B8;font-size:8px">${p.marca}</span>` : ''}</td>
              <td class="text-center">${p.unidades_vendidas ?? 0}</td>
              <td class="text-right" style="font-weight:600;color:#16A34A">${formatCurrency(p.total_generado ?? 0)}</td>
            </tr>`).join('')
          : `<tr><td colspan="4" style="text-align:center;color:#94A3B8;padding:16px">Sin ventas en este período</td></tr>`
        }
      </tbody>
    </table>
  </div>

  <!-- TOP CLIENTES -->
  <div class="seccion">
    <div class="seccion-titulo">Mejores clientes del mes</div>
    <table>
      <thead><tr><th>#</th><th>Cliente</th><th>Teléfono</th><th class="text-center">Compras</th><th class="text-right">Total gastado</th></tr></thead>
      <tbody>
        ${topClients.length > 0
          ? topClients.slice(0,10).map((c, i) => `<tr>
              <td class="text-center">${i+1}</td>
              <td><strong>${c.nombre ?? '—'}</strong></td>
              <td>${c.telefono ?? '—'}</td>
              <td class="text-center">${c.total_compras ?? 0}</td>
              <td class="text-right" style="font-weight:600;color:#16A34A">${formatCurrency(c.total_gastado ?? 0)}</td>
            </tr>`).join('')
          : `<tr><td colspan="5" style="text-align:center;color:#94A3B8;padding:16px">Sin clientes en este período</td></tr>`
        }
      </tbody>
    </table>
  </div>

  ${lowStock.length > 0 ? `
  <!-- STOCK BAJO -->
  <div class="seccion">
    <div class="seccion-titulo">⚠ Productos con stock bajo (${lowStock.length})</div>
    <table>
      <thead><tr><th>Producto</th><th>Categoría</th><th class="text-center">Stock actual</th><th class="text-center">Stock mínimo</th><th class="text-center">Faltante</th><th>Proveedor</th></tr></thead>
      <tbody>
        ${lowStock.map(p => `<tr>
          <td><strong>${p.nombre_producto ?? '—'}</strong></td>
          <td>${p.categoria ?? '—'}</td>
          <td class="text-center" style="color:#DC2626;font-weight:600">${p.stock_actual ?? 0}</td>
          <td class="text-center">${p.stock_minimo ?? 0}</td>
          <td class="text-center"><span class="badge badge-red">−${p.diferencia ?? 0}</span></td>
          <td>${p.proveedor ?? '—'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}

  <!-- PIE -->
  <div class="footer">
    <span>VerticalTech — Sistema POS v1.0 &nbsp;|&nbsp; Reporte generado automáticamente</span>
    <span>${fecha} ${hora}</span>
  </div>
</body>
</html>`;

  const ventana = window.open('', '_blank', 'width=900,height=700');
  ventana.document.write(html);
  ventana.document.close();
  ventana.onload = () => ventana.print();
};

// ─── Validación de mes futuro ─────────────────────────────────────────────────
const esMesFuturo = (mes, anio) => {
  const hoy    = new Date();
  const actual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const selec  = new Date(anio, mes - 1, 1);
  return selec > actual;
};

// ─── Componente: Barra de filtros ─────────────────────────────────────────────
function FilterBar({ mes, anio, onMesChange, onAnioChange, onApply, onPDF, loading }) {
  const futuro  = esMesFuturo(mes, anio);
  const mesNombre = MONTHS[mes - 1];

  return (
    <div className="card space-y-3">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Mes</label>
          <select value={mes} onChange={e => onMesChange(Number(e.target.value))} className="input-field w-40">
            {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Año</label>
          <select value={anio} onChange={e => onAnioChange(Number(e.target.value))} className="input-field w-28">
            {[currentYear, currentYear-1, currentYear-2].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button
          onClick={() => {
            if (futuro) {
              toast.warn(`${mesNombre} ${anio} aún no ha ocurrido. Selecciona un mes pasado o el actual.`, { autoClose: 4000 });
              return;
            }
            onApply();
          }}
          disabled={loading}
          className="btn-primary flex items-center gap-2"
        >
          {loading
            ? <><RefreshCw size={14} className="animate-spin" /> Cargando...</>
            : <><Filter size={14} /> Aplicar filtros</>
          }
        </button>
        <button
          onClick={onPDF}
          disabled={loading || futuro}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText size={14} /> Generar PDF
        </button>
      </div>

      {/* Aviso mes futuro */}
      {futuro && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <AlertTriangle size={15} className="shrink-0 text-amber-500" />
          <span>
            <strong>{mesNombre} {anio}</strong> es un mes futuro — no existen datos para este período todavía.
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Componente: Tabla genérica ───────────────────────────────────────────────
function ReportTable({ title, icon: Icon, columns, data, emptyMsg = 'Sin datos para este período' }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
          <Icon size={18} className="text-blue-500" />{title}
        </h3>
        <span className="text-xs text-gray-400">{data.length} registros</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b">
              {columns.map(col => <th key={col.key} className="pb-3 px-2">{col.label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.length > 0
              ? data.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-gray-50 transition-colors">
                    {columns.map(col => (
                      <td key={col.key} className="py-3 px-2">
                        {col.render ? col.render(row[col.key], row, idx) : (row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))
              : <tr><td colSpan={columns.length} className="py-10 text-center text-gray-400 text-sm">{emptyMsg}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

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
