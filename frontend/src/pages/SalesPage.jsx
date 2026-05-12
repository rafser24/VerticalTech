import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, Eye, User, CreditCard, Package, FileText, Hash, ShoppingBag } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import PosScreen from '../components/pos/PosScreen';
import { formatCurrency, formatDate, statusColors } from '../utils/helpers';
import { saleService } from '../services/api';

/* ─── Modal detalle de venta ─────────────────────────────────────────────── */
function SaleDetailModal({ isOpen, onClose, sale, loading }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={sale ? `Detalle — ${sale.numero_venta ?? ''}` : 'Cargando...'} size="lg">
      {loading || !sale ? (
        <div className="space-y-3 animate-pulse">
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
          </div>
          <div className="h-40 bg-gray-100 rounded-xl" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                <Hash size={11} /> N° Venta
              </p>
              <p className="text-sm font-mono font-medium text-gray-800">
                {sale.numero_venta ?? `#${String(sale.id).padStart(6, '0')}`}
              </p>
              <span className={`badge text-xs mt-1 inline-block ${statusColors[sale.estado] ?? ''}`}>
                {sale.estado}
              </span>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                <User size={11} /> Cliente
              </p>
              <p className="text-sm font-medium text-gray-800">
                {sale.cliente
                  ? `${sale.cliente.nombre ?? ''} ${sale.cliente.apellido ?? ''}`.trim() || 'Sin nombre'
                  : 'Cliente General'}
              </p>
              {sale.cliente?.telefono && (
                <p className="text-xs text-gray-400 mt-0.5">{sale.cliente.telefono}</p>
              )}
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                <CreditCard size={11} /> Método de pago
              </p>
              <p className="text-sm font-medium text-gray-800">
                {sale.metodo_pago?.nombre ?? sale.metodoPago?.nombre ?? '—'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {sale.fecha_venta ? formatDate(sale.fecha_venta) : '—'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                <User size={11} /> Vendedor
              </p>
              <p className="text-sm font-medium text-gray-800">
                {sale.usuario?.nombre ?? sale.usuario?.name ?? '—'}
              </p>
            </div>
          </div>

          {sale.notas && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
              <FileText size={13} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">{sale.notas}</p>
            </div>
          )}

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2">
            <Package size={11} /> Productos
          </p>
          <div className="border border-gray-100 rounded-xl overflow-hidden mb-5">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="text-left px-4 py-2.5">Producto</th>
                  <th className="text-center px-3 py-2.5">Cant.</th>
                  <th className="text-right px-3 py-2.5">P. Unit.</th>
                  <th className="text-right px-4 py-2.5">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(sale.items ?? sale.detalles ?? []).map((d, i) => {
                  const linea = (d.cantidad * d.precio_unitario) - (parseFloat(d.descuento) || 0);
                  return (
                    <tr key={d.id ?? i} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">
                          {d.producto?.nombre ?? d.producto?.nombre_producto ?? '—'}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-center text-gray-600">{d.cantidad}</td>
                      <td className="px-3 py-3 text-right text-gray-600">{formatCurrency(d.precio_unitario)}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">{formatCurrency(linea)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-60 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span><span>{formatCurrency(sale.subtotal ?? 0)}</span>
              </div>
              {parseFloat(sale.descuento) > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Descuento</span><span>-{formatCurrency(sale.descuento)}</span>
                </div>
              )}
              {parseFloat(sale.impuesto) > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Impuesto</span><span>{formatCurrency(sale.impuesto)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-800 text-base pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="text-green-700">{formatCurrency(sale.total)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

/* ─── Página principal ───────────────────────────────────────────────────── */
export default function SalesPage() {
  const [vistaPos, setVistaPos] = useState(false); // false = historial, true = POS

  const [sales, setSales]     = useState([]);
  const [detail, setDetail]   = useState({ open: false, sale: null, loading: false });
  const [loading, setLoading] = useState(true);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await saleService.getAll();
      // API devuelve { status, message, data: [...] }
      const payload = res.data?.data ?? res.data;
      const list    = Array.isArray(payload) ? payload
                    : Array.isArray(payload?.data) ? payload.data
                    : [];
      setSales(list);
    } catch {
      toast.error('Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSales(); }, []);

  // Al volver del POS refrescar la tabla de ventas
  const handleVolverDePos = () => {
    setVistaPos(false);
    fetchSales();
  };

  const handleViewDetail = async (row) => {
    const id = row.id ?? row.id_venta;
    if (!id) { toast.error('ID de venta no encontrado'); return; }
    setDetail({ open: true, sale: null, loading: true });
    try {
      const res     = await saleService.getById(id);
      const payload = res.data?.data ?? res.data;
      // show() devuelve objeto único ahora que el route param se corrigió
      const sale = Array.isArray(payload)
        ? payload.find(s => s.id === id) ?? payload[0]
        : payload;
      setDetail({ open: true, sale, loading: false });
    } catch {
      toast.error('No se pudo cargar el detalle');
      setDetail({ open: false, sale: null, loading: false });
    }
  };

  const closeDetail = () => setDetail({ open: false, sale: null, loading: false });

  const columns = [
    {
      key: 'id',
      label: '#',
      render: (v, row) => (
        <span className="font-mono text-xs text-gray-400">
          {row.numero_venta ?? `#${String(v).padStart(4, '0')}`}
        </span>
      ),
    },
    {
      key: 'cliente',
      label: 'Cliente',
      render: (v, row) => (
        <span className="font-medium">{row.cliente?.nombre ?? 'Cliente General'}</span>
      ),
    },
    { key: 'fecha_venta', label: 'Fecha', render: (v, row) => formatDate(v ?? row.fecha) },
    {
      key: 'detalles_count',
      label: 'Items',
      render: (v, row) => (
        <span className="badge bg-pastel-secondary/40 text-green-800">
          {v ?? row.detalles?.length ?? '—'}
        </span>
      ),
    },
    { key: 'total', label: 'Total', render: v => <span className="font-semibold text-green-700">{formatCurrency(v)}</span> },
    { key: 'metodo_pago', label: 'Pago', render: (v, row) => row.metodo_pago?.nombre ?? v ?? '—' },
    { key: 'estado', label: 'Estado', render: v => <span className={`badge ${statusColors[v] ?? ''}`}>{v ?? '—'}</span> },
  ];

  // ── Si el usuario activó la vista POS, renderizar PosScreen ──────────
  if (vistaPos) {
    return <PosScreen onVolver={handleVolverDePos} />;
  }

  // ── Vista historial de ventas ─────────────────────────────────────────
  if (loading) {
    return (
      <MainLayout title="Ventas">
        <div className="flex flex-col items-center justify-center h-[65vh] gap-6">
          {/* Spinner moderno multicapa */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-500 border-r-green-400 animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-emerald-300 animate-spin" style={{ animationDuration: '0.6s', animationDirection: 'reverse' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>
          {/* Texto animado */}
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-gray-700 tracking-wide">Cargando ventas</p>
            <div className="flex items-center justify-center gap-1">
              {[0,1,2].map(i => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
          {/* Skeleton de la tabla */}
          <div className="w-full max-w-4xl space-y-3 px-4 mt-2">
            <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3" style={{ opacity: 1 - i * 0.15 }}>
                <div className="h-12 bg-gray-100 rounded-xl animate-pulse flex-1" />
                <div className="h-12 bg-gray-100 rounded-xl animate-pulse w-32" />
                <div className="h-12 bg-gray-100 rounded-xl animate-pulse w-24" />
              </div>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Ventas">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {loading ? 'Cargando...' : `${sales.length} ventas registradas`}
          </p>
          <div className="flex gap-2">
            {/* Botón POS — acceso rápido al punto de venta */}
            <button
              onClick={() => setVistaPos(true)}
              className="btn-primary flex items-center gap-2"
            >
              <ShoppingBag size={16} /> Punto de Venta
            </button>
          </div>
        </div>

        <div className="card">
          <DataTable
            data={sales}
            columns={columns}
            searchFields={['estado']}
            actions={(row) => (
              <button
                onClick={() => handleViewDetail(row)}
                className="p-1.5 hover:bg-pastel-secondary/30 rounded-lg transition-colors text-green-600"
                title="Ver detalle"
              >
                <Eye size={14} />
              </button>
            )}
          />
        </div>
      </div>

      <SaleDetailModal
        isOpen={detail.open}
        onClose={closeDetail}
        sale={detail.sale}
        loading={detail.loading}
      />
    </MainLayout>
  );
}
