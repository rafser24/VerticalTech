import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
<<<<<<< Updated upstream
  BarChart2, TrendingUp, ShoppingCart, Package,
  Download, Filter, Calendar, RefreshCw, AlertTriangle,
  ArrowUpRight, ArrowDownRight,
=======
  TrendingUp, ShoppingCart, Package, FileText,
  Filter, Calendar, RefreshCw, AlertTriangle,
  CalendarDays, CalendarRange,
>>>>>>> Stashed changes
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { jsPDF } from 'jspdf';

import MainLayout from '../components/layout/MainLayout';
import StatCard from '../components/ui/StatCard';
import { formatCurrency, formatDate, statusColors } from '../utils/helpers';
import api from '../services/api';
import useAppStore from '../store/appStore';

// ─────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────
const reportService = {
<<<<<<< Updated upstream
  getSummary:        (params) => api.get('/dashboard/resumen', { params }),
  getSalesByPeriod:  (params) => api.get('/dashboard/ventas-por-periodo', { params }),
  getTopProducts:    (params) => api.get('/dashboard/productos-mas-vendidos', { params }),
  getTopClients:     (params) => api.get('/dashboard/top-clientes', { params }),
  getLowStock:       ()       => api.get('/dashboard/stock-bajo'),
  getSalesReport:    (params) => api.get('/dashboard/reporte-ventas', { params }),
  getPurchasesReport:(params) => api.get('/dashboard/reporte-compras', { params }),
=======
  getSummary: (p) => api.get('/dashboard/resumen', { params: p }),
  getTopProducts: (p) => api.get('/dashboard/productos-mas-vendidos', { params: p }),
  getTopClients: (p) => api.get('/dashboard/top-clientes', { params: p }),
  getLowStock: () => api.get('/dashboard/stock-bajo'),
  getSalesReport: (p) => api.get('/dashboard/reporte-ventas', { params: p }),
>>>>>>> Stashed changes
};

// ─────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────
const hoy = new Date();
const currentYear = hoy.getFullYear();
const currentMonth = hoy.getMonth() + 1;
const todayStr = hoy.toISOString().split('T')[0]; // YYYY-MM-DD

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

<<<<<<< Updated upstream
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
=======
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const PIE_COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

const TIPOS = [
  { value: 'dia', label: 'Día', icon: CalendarDays },
  { value: 'semana', label: 'Semana', icon: CalendarRange },
  { value: 'mes', label: 'Mes', icon: Calendar },
  { value: 'anio', label: 'Año', icon: TrendingUp },
];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const unwrapData = (res) => res?.data?.data || res?.data || null;
const unwrapArray = (res) => {
  const d = unwrapData(res);
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.ventas)) return d.ventas;
  if (Array.isArray(d?.productos)) return d.productos;
  if (Array.isArray(d?.clientes)) return d.clientes;
  if (Array.isArray(d?.data)) return d.data;
  return [];
};

// Obtener lunes de la semana de una fecha
const getLunes = (dateStr) => {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0=dom
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
};

// Obtener domingo de la semana de una fecha
const getDomingo = (dateStr) => {
  const lunes = new Date(getLunes(dateStr));
  lunes.setDate(lunes.getDate() + 6);
  return lunes.toISOString().split('T')[0];
};

// Label legible del período seleccionado
const getPeriodLabel = (tipo, { fecha, mes, anio }) => {
  if (tipo === 'dia') return new Date(fecha + 'T12:00:00').toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  if (tipo === 'semana') return `Semana del ${getLunes(fecha)} al ${getDomingo(fecha)}`;
  if (tipo === 'mes') return `${MONTHS[mes - 1]} ${anio}`;
  if (tipo === 'anio') return `Año ${anio}`;
  return '';
};

// Construir params para el API según tipo
const buildParams = (tipo, { fecha, mes, anio }) => {
  if (tipo === 'dia') return { tipo, fecha };
  if (tipo === 'semana') return { tipo, fecha };
  if (tipo === 'mes') return { tipo, mes, anio };
  if (tipo === 'anio') return { tipo, anio };
  return { tipo, mes, anio };
};

// ─────────────────────────────────────────────────────────────
// COMPONENTE TABLA
// ─────────────────────────────────────────────────────────────
function ReportTable({ title, icon: Icon, columns, data, emptyMsg = 'Sin datos' }) {
  const rows = Array.isArray(data) ? data : [];
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 text-base font-bold text-gray-800">
>>>>>>> Stashed changes
          <Icon size={18} className="text-blue-500" />
          {title}
        </h3>
        <span className="text-xs text-gray-400">{rows.length} registros</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
<<<<<<< Updated upstream
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
=======
            <tr className="text-xs tracking-wider text-left text-gray-400 uppercase border-b">
              {columns.map((c) => <th key={c.key} className="px-2 pb-3">{c.label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.length > 0 ? rows.map((row, idx) => (
              <tr key={row.id || idx} className="transition-colors hover:bg-gray-50">
                {columns.map((c) => (
                  <td key={c.key} className="px-2 py-3">
                    {c.render ? c.render(row[c.key], row, idx) : (row[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length} className="py-10 text-center text-gray-400">
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────
>>>>>>> Stashed changes
export default function ReportsPage() {
  const empresa = useAppStore((s) => s.empresa);

  // ── Estado de filtros ──
  const [tipo, setTipo] = useState('mes');
  const [fecha, setFecha] = useState(todayStr);
  const [mes, setMes] = useState(currentMonth);
  const [anio, setAnio] = useState(currentYear);

  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [summary, setSummary] = useState({});
  const [salesReport, setSalesReport] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  // ── Fetch ──────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const params = buildParams(tipo, { fecha, mes, anio });

      const [r0, r1, r2, r3, r4] = await Promise.allSettled([
        reportService.getSummary(params),
        reportService.getSalesReport(params),
        reportService.getTopProducts(params),
        reportService.getTopClients(params),
        reportService.getLowStock(),
      ]);

      if (r0.status === 'fulfilled') setSummary(unwrapData(r0.value) || {});

      if (r1.status === 'fulfilled') {
        const d = unwrapData(r1.value);
        const v = Array.isArray(d?.ventas) ? d.ventas : Array.isArray(d) ? d : [];
        setSalesReport(v.sort((a, b) =>
          new Date(b.fecha_venta || b.created_at) - new Date(a.fecha_venta || a.created_at)
        ));
      } else setSalesReport([]);

      if (r2.status === 'fulfilled') setTopProducts(unwrapArray(r2.value)); else setTopProducts([]);
      if (r3.status === 'fulfilled') setTopClients(unwrapArray(r3.value)); else setTopClients([]);
      if (r4.status === 'fulfilled') setLowStock(unwrapArray(r4.value)); else setLowStock([]);

    } catch (err) {
      console.error(err);
      toast.error('Error cargando reportes');
    } finally {
      setLoading(false);
    }
  }, [tipo, fecha, mes, anio]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Generar PDF ────────────────────────────────────────────
  const generarPDF = async () => {
    try {
      setPdfLoading(true);
      toast.info('Generando reporte PDF...');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pW = doc.internal.pageSize.getWidth();
      const pH = doc.internal.pageSize.getHeight();
      const mg = 15;
      const periodoLabel = getPeriodLabel(tipo, { fecha, mes, anio });
      const fechaGen = new Date().toLocaleDateString('es-SV', { day: '2-digit', month: 'long', year: 'numeric' });

      const azul = [37, 99, 235];
      const azulOsc = [30, 64, 175];
      const gris = [107, 114, 128];
      const grisClaro = [243, 244, 246];
      const negro = [17, 24, 39];

      // Encabezado
      doc.setFillColor(...azulOsc);
      doc.rect(0, 0, pW, 38, 'F');

      if (empresa.logo_url) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = empresa.logo_url; });
          const cv = document.createElement('canvas');
          cv.width = img.naturalWidth; cv.height = img.naturalHeight;
          cv.getContext('2d').drawImage(img, 0, 0);
          doc.addImage(cv.toDataURL('image/png'), 'PNG', mg, 7, 22, 22);
        } catch { /* sin logo */ }
      }

      const lx = empresa.logo_url ? mg + 28 : mg;
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
      doc.text(empresa.nombre || 'VerticalTech', lx, 18);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      doc.setTextColor(200, 210, 255);
      if (empresa.nit) doc.text('NIT: ' + empresa.nit, lx, 24);
      if (empresa.correo) doc.text(empresa.correo, lx, 29);
      if (empresa.telefono) doc.text('Tel: ' + empresa.telefono, lx, 34);

      doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text('REPORTE DE VENTAS', pW - mg, 16, { align: 'right' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      doc.setTextColor(200, 210, 255);
      doc.text(periodoLabel, pW - mg, 22, { align: 'right' });
      doc.text('Generado: ' + fechaGen, pW - mg, 27, { align: 'right' });

      doc.setFillColor(...azul);
      doc.rect(0, 38, pW, 3, 'F');

      let y = 50;

      // Resumen ejecutivo
      doc.setTextColor(...negro);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      doc.text('RESUMEN EJECUTIVO', mg, y);
      doc.setDrawColor(...azul); doc.setLineWidth(0.5);
      doc.line(mg, y + 2, mg + 55, y + 2);
      y += 8;

      const ingresos = Number(summary?.ventas?.mes?.total || 0);
      const cantVentas = Number(summary?.ventas?.mes?.cantidad || 0);
      const ticket = cantVentas > 0 ? ingresos / cantVentas : 0;

      const cards = [
        { label: 'Ingresos del período', valor: formatCurrency(ingresos), color: azul },
        { label: 'Total de ventas', valor: cantVentas + ' ventas', color: [22, 163, 74] },
        { label: 'Ticket promedio', valor: formatCurrency(ticket), color: [124, 58, 237] },
        { label: 'Stock bajo', valor: lowStock.length + ' items', color: [217, 119, 6] },
      ];
      const cW = (pW - mg * 2 - 9) / 4;
      cards.forEach((c, i) => {
        const x = mg + i * (cW + 3);
        doc.setFillColor(...grisClaro); doc.roundedRect(x, y, cW, 20, 2, 2, 'F');
        doc.setFillColor(...c.color); doc.rect(x, y, 3, 20, 'F');
        doc.setTextColor(...c.color); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
        doc.text(c.valor, x + 6, y + 8);
        doc.setTextColor(...gris); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
        doc.text(c.label.toUpperCase(), x + 6, y + 14);
      });
      y += 28;

      if (empresa.direccion) {
        doc.setFontSize(8); doc.setTextColor(...gris); doc.setFont('helvetica', 'italic');
        doc.text('Dirección: ' + empresa.direccion, mg, y);
        y += 6;
      }

      // Helper tabla manual
      const drawTable = (startY, headers, rows, colWidths, hColor, altColor) => {
        const rH = 7; const padX = 2;
        const tW = colWidths.reduce((a, b) => a + b, 0);
        let cy = startY;

        const drawHeader = (atY) => {
          doc.setFillColor(...hColor); doc.rect(mg, atY, tW, rH, 'F');
          doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(255, 255, 255);
          let cx = mg;
          headers.forEach((h, i) => { doc.text(String(h), cx + padX, atY + 5); cx += colWidths[i]; });
        };
        drawHeader(cy); cy += rH;

        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
        rows.forEach((row, ri) => {
          if (cy + rH > pH - 15) {
            doc.addPage(); drawHeader(mg); cy = mg + rH;
            doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
          }
          if (ri % 2 === 1 && altColor) { doc.setFillColor(...altColor); doc.rect(mg, cy, tW, rH, 'F'); }
          doc.setTextColor(...negro);
          let rx = mg;
          row.forEach((cell, ci) => { doc.text(String(cell ?? '—'), rx + padX, cy + 5); rx += colWidths[ci]; });
          doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.1);
          doc.line(mg, cy + rH, mg + tW, cy + rH);
          cy += rH;
        });
        doc.setDrawColor(...hColor); doc.setLineWidth(0.3);
        doc.rect(mg, startY, tW, cy - startY, 'S');
        return cy + 4;
      };

      const sectionTitle = (title, color, lineW) => {
        if (y > pH - 60) { doc.addPage(); y = mg; }
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...negro);
        doc.text(title, mg, y);
        doc.setDrawColor(...color); doc.setLineWidth(0.5);
        doc.line(mg, y + 2, mg + lineW, y + 2);
        y += 5;
      };

      if (topProducts.length > 0) {
        sectionTitle('PRODUCTOS MÁS VENDIDOS', azul, 65);
        y = drawTable(y,
          ['#', 'Producto', 'Unidades', 'Ingresos'],
          topProducts.slice(0, 10).map((p, i) => [
            i + 1, p.nombre_producto || p.nombre || '—',
            p.unidades_vendidas || 0, formatCurrency(p.total_generado || 0),
          ]),
          [10, 100, 35, 35], azulOsc, grisClaro
        );
      }

      if (topClients.length > 0) {
        sectionTitle('MEJORES CLIENTES', azul, 50);
        y = drawTable(y,
          ['#', 'Cliente', 'Teléfono', 'Compras', 'Total'],
          topClients.slice(0, 10).map((c, i) => [
            i + 1, c.nombre_cliente || c.nombre || '—',
            c.telefono || '—', c.total_compras || 0, formatCurrency(c.total_gastado || 0),
          ]),
          [10, 75, 35, 25, 35], [22, 163, 74], grisClaro
        );
      }

      if (lowStock.length > 0) {
        sectionTitle('PRODUCTOS CON STOCK BAJO', [217, 119, 6], 72);
        y = drawTable(y,
          ['#', 'Producto', 'Stock', 'Mínimo'],
          lowStock.slice(0, 15).map((p, i) => [
            i + 1, p.nombre || p.nombre_producto || '—',
            p.stock || p.cantidad || 0, p.stock_minimo || p.stock_min || '—',
          ]),
          [10, 115, 27, 28], [217, 119, 6], [255, 251, 235]
        );
      }

      if (salesReport.length > 0) {
        sectionTitle('DETALLE DE VENTAS', [124, 58, 237], 50);
        drawTable(y,
          ['ID', 'Fecha', 'Cliente', 'Estado', 'Total'],
          salesReport.slice(0, 50).map((v) => [
            v.id || '—', formatDate(v.fecha_venta || v.created_at),
            v?.cliente?.nombre || 'Consumidor final', v.estado || '—', formatCurrency(v.total || 0),
          ]),
          [15, 28, 75, 25, 37], [124, 58, 237], grisClaro
        );
      }

      // Pie de página
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(...grisClaro); doc.rect(0, pH - 12, pW, 12, 'F');
        doc.setDrawColor(...azul); doc.setLineWidth(0.3); doc.line(0, pH - 12, pW, pH - 12);
        doc.setFontSize(7); doc.setTextColor(...gris); doc.setFont('helvetica', 'normal');
        doc.text((empresa.nombre || 'VerticalTech') + ' · ' + periodoLabel, mg, pH - 5);
        doc.text('Página ' + i + ' de ' + totalPages, pW - mg, pH - 5, { align: 'right' });
        doc.text('Documento generado automáticamente', pW / 2, pH - 5, { align: 'center' });
      }

      doc.save('Reporte_' + periodoLabel.replace(/\//g, '-').replace(/\s+/g, '_') + '.pdf');
      toast.success('Reporte descargado correctamente');
    } catch (err) {
      console.error(err);
      toast.error('Error al generar el PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Datos gráficas ──────────────────────────────────────────
  const barData = topProducts.slice(0, 7).map((p) => ({
    name: (p.nombre_producto || p.nombre || '—').substring(0, 14),
    vendidos: p.unidades_vendidas || 0,
    ingresos: Number(p.total_generado || 0),
  }));

  const pieData = topClients.slice(0, 6).map((c) => ({
    name: (c.nombre_cliente || c.nombre || '—').substring(0, 18),
    value: Number(c.total_gastado || 0),
  }));

  // ── Columnas tablas ─────────────────────────────────────────
  const salesCols = [
    { key: 'id', label: '#' },
    { key: 'fecha_venta', label: 'Fecha', render: (v, r) => formatDate(v || r.created_at) },
    { key: 'cliente', label: 'Cliente', render: (_, r) => r?.cliente?.nombre || 'Consumidor final' },
    {
      key: 'estado', label: 'Estado', render: (v) => (
        <span className={'badge ' + (statusColors[v] || 'bg-gray-100 text-gray-600')}>{v || '—'}</span>
      )
    },
    { key: 'total', label: 'Total', render: (v) => <span className="font-semibold">{formatCurrency(v || 0)}</span> },
  ];

  const prodCols = [
    { key: 'nombre_producto', label: 'Producto', render: (v, r) => v || r.nombre || '—' },
    { key: 'unidades_vendidas', label: 'Vendidos', render: (v) => v || 0 },
    { key: 'total_generado', label: 'Ingresos', render: (v) => formatCurrency(v || 0) },
  ];

  const clientCols = [
    { key: 'nombre_cliente', label: 'Cliente', render: (v, r) => v || r.nombre || '—' },
    { key: 'telefono', label: 'Teléfono', render: (v) => v || '—' },
    { key: 'total_compras', label: 'Compras', render: (v) => v || 0 },
    { key: 'total_gastado', label: 'Gastado', render: (v) => formatCurrency(v || 0) },
  ];

  const ingresosPeriodo = Number(summary?.ventas?.mes?.total || 0);
  const ventasPeriodo = Number(summary?.ventas?.mes?.cantidad || 0);
  const periodoLabel = getPeriodLabel(tipo, { fecha, mes, anio });

  // ── Render ──────────────────────────────────────────────────
  return (
    <MainLayout title="Reportes">
      <div className="space-y-6">

        {/* ════ FILTROS ════ */}
        <div className="card">
          <p className="mb-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">
            Filtrar por período
          </p>

          {/* Selector tipo */}
          <div className="flex flex-wrap gap-2 mb-4">
            {TIPOS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTipo(value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all
                  ${tipo === value
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Inputs según tipo */}
          <div className="flex flex-wrap items-end gap-4">

            {/* DÍA */}
            {tipo === 'dia' && (
              <div>
                <label className="block mb-1 text-xs text-gray-500 uppercase">Seleccionar día</label>
                <input
                  type="date"
                  value={fecha}
                  max={todayStr}
                  onChange={(e) => setFecha(e.target.value)}
                  className="input-field"
                />
              </div>
            )}

            {/* SEMANA */}
            {tipo === 'semana' && (
              <div>
                <label className="block mb-1 text-xs text-gray-500 uppercase">Cualquier día de la semana</label>
                <input
                  type="date"
                  value={fecha}
                  max={todayStr}
                  onChange={(e) => setFecha(e.target.value)}
                  className="input-field"
                />
                <p className="mt-1 text-[10px] text-gray-400">
                  Lun {getLunes(fecha)} → Dom {getDomingo(fecha)}
                </p>
              </div>
            )}

            {/* MES */}
            {tipo === 'mes' && (
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block mb-1 text-xs text-gray-500 uppercase">Mes</label>
                  <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="input-field">
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-xs text-gray-500 uppercase">Año</label>
                  <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="input-field">
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* AÑO */}
            {tipo === 'anio' && (
              <div>
                <label className="block mb-1 text-xs text-gray-500 uppercase">Año</label>
                <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="input-field">
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            )}

            {/* Botón aplicar */}
            <button onClick={fetchAll} disabled={loading} className="flex items-center gap-2 btn-primary">
              {loading
                ? <span className="flex items-center gap-2"><RefreshCw size={14} className="animate-spin" /><span>Cargando...</span></span>
                : <span className="flex items-center gap-2"><Filter size={14} /><span>Aplicar filtros</span></span>
              }
            </button>

            {/* Botón PDF */}
            <button
              type="button"
              onClick={generarPDF}
              disabled={pdfLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pdfLoading
                ? <span className="flex items-center gap-2"><RefreshCw size={14} className="animate-spin" /><span>Generando...</span></span>
                : <span className="flex items-center gap-2"><FileText size={15} /><span>Descargar PDF</span></span>
              }
            </button>
          </div>

          {/* Etiqueta del período activo */}
          <div className="flex items-center gap-2 px-3 py-2 mt-4 text-sm font-medium text-blue-700 rounded-lg bg-blue-50">
            <Calendar size={14} />
            <span>Mostrando: <strong>{periodoLabel}</strong></span>
          </div>
        </div>

        {/* ════ STAT CARDS ════ */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Ingresos del período"
            value={formatCurrency(ingresosPeriodo)}
            icon={TrendingUp}
            color="green"
            subtitle={ventasPeriodo + ' ventas'}
          />
          <StatCard
            title="Stock bajo"
            value={lowStock.length}
            icon={AlertTriangle}
            color="orange"
            subtitle="Productos"
          />
          <StatCard
            title="Período"
            value={TIPOS.find(t => t.value === tipo)?.label || ''}
            icon={Calendar}
            color="blue"
            subtitle={periodoLabel}
          />
        </div>

        {/* ════ GRÁFICAS ════ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          <div className="card">
            <h3 className="flex items-center gap-2 mb-4 text-base font-bold text-gray-800">
              <Package size={18} className="text-blue-500" />
              Unidades vendidas por producto
            </h3>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => n === 'ingresos' ? [formatCurrency(v), 'Ingresos'] : [v, 'Vendidos']} />
                  <Bar dataKey="vendidos" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-sm text-center text-gray-400">Sin datos para este período</p>
            )}
          </div>

          <div className="card">
            <h3 className="flex items-center gap-2 mb-4 text-base font-bold text-gray-800">
              <TrendingUp size={18} className="text-blue-500" />
              Participación de clientes
            </h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                    label={({ name, percent }) => name + ' ' + (percent * 100).toFixed(0) + '%'}
                    labelLine={false}
                  >
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-sm text-center text-gray-400">Sin datos para este período</p>
            )}
          </div>

        </div>

        {/* ════ TABLAS ════ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ReportTable title="Productos más vendidos" icon={Package} columns={prodCols} data={topProducts} />
          <ReportTable title="Mejores clientes" icon={TrendingUp} columns={clientCols} data={topClients} />
        </div>

        <ReportTable title="Detalle de ventas" icon={ShoppingCart} columns={salesCols} data={salesReport} />

      </div>
    </MainLayout>
  );
}
