import { useState, useEffect, useCallback } from 'react';
import { X, Clock, Banknote, AlertCircle, AlertTriangle, CheckCircle2, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { saleService } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';

/**
 * DrawerVentasEspera
 * Consulta las ventas con estado=pendiente desde la BD.
 * Recibe isOpen y onClose como props — sin estado global.
 *
 * FIX: El overlay del drawer siempre está en el DOM y se oculta con
 * pointer-events/opacity para evitar el crash de React StrictMode:
 * "removeChild: node is not a child of this node"
 */
export default function DrawerVentasEspera({ isOpen, onClose, onVentaConfirmada }) {
  const isDrawerOpen = isOpen;
  const cerrarDrawer = onClose;

  const [ventas, setVentas]                   = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [procesando, setProcesando]           = useState(null);
  const [confirmarAnular, setConfirmarAnular] = useState(null);

  const cargarPendientes = useCallback(async () => {
    setLoading(true);
    try {
      const res     = await saleService.getPendientes();
      const payload = res.data?.data ?? res.data;
      const lista   = Array.isArray(payload) ? payload
                    : Array.isArray(payload?.data) ? payload.data : [];
      setVentas(lista);
    } catch {
      toast.error('No se pudieron cargar las ventas pendientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isDrawerOpen) cargarPendientes();
  }, [isDrawerOpen, cargarPendientes]);

  const handleConfirmar = async (venta) => {
    setProcesando(venta.id);
    try {
      const res = await saleService.confirmarTransferencia(venta.id);
      const ventaConfirmada = res.data?.data ?? res.data;
      toast.success(`✔ Transferencia confirmada — ${venta.numero_venta ?? ''}`);
      cerrarDrawer();
      await cargarPendientes();
      if (onVentaConfirmada) onVentaConfirmada(ventaConfirmada);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error al confirmar la transferencia');
    } finally {
      setProcesando(null);
    }
  };

  const handleAnular = async () => {
    if (!confirmarAnular) return;
    setProcesando(confirmarAnular.id);
    try {
      await saleService.anular(confirmarAnular.id);
      toast.info('Venta anulada y stock restaurado');
      setConfirmarAnular(null);
      await cargarPendientes();
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error al anular la venta');
    } finally {
      setProcesando(null);
    }
  };

  const tiempoEspera = (fecha) => {
    const mins = Math.floor((Date.now() - new Date(fecha)) / 60000);
    if (mins < 1)  return 'hace un momento';
    if (mins < 60) return `hace ${mins} min`;
    return `hace ${Math.floor(mins / 60)}h ${mins % 60}min`;
  };

  const nombreCliente = (venta) =>
    venta.cliente?.nombre
      ? `${venta.cliente.nombre} ${venta.cliente.apellido ?? ''}`.trim()
      : venta.cliente_nombre_manual || 'Cliente General';

  const showModal = confirmarAnular !== null;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-gray-900/30 backdrop-blur-sm transition-opacity duration-300
          ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={cerrarDrawer}
      />
      <div className={`fixed top-0 right-0 h-full z-50 w-96 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />Transferencias Pendientes
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{ventas.length} pendiente{ventas.length !== 1 ? 's' : ''} de confirmación</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={cargarPendientes} disabled={loading} title="Actualizar lista" className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={cerrarDrawer} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"><X size={16} /></button>
          </div>
        </div>
        <div className="mx-3 mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2">
          <AlertCircle size={14} className="text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">El stock ya está reservado. Confirma al recibir la transferencia, o anula para liberar el inventario.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3 mt-2">
          {loading && ventas.length === 0 ? (
            <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : ventas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2 text-center">
              <Banknote size={40} strokeWidth={1} />
              <p className="text-sm font-medium">No hay transferencias pendientes</p>
              <p className="text-xs">Las ventas pausadas aparecerán aquí</p>
            </div>
          ) : (
            ventas.map(venta => {
              const enProceso = procesando === venta.id;
              const items     = venta.detalles ?? venta.items ?? [];
              const cliente   = nombreCliente(venta);
              return (
                <div key={venta.id} className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{cliente}</p>
                      <p className="text-xs font-mono text-gray-400">{venta.numero_venta}</p>
                      {venta.referencia_transferencia && <p className="text-xs text-amber-600 font-medium mt-0.5">Ref: {venta.referencia_transferencia}</p>}
                    </div>
                    <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0"><Clock size={10} />{tiempoEspera(venta.created_at)}</span>
                  </div>
                  <div className="space-y-1">
                    {items.slice(0, 3).map((item, i) => (
                      <div key={item.id ?? i} className="flex justify-between text-xs text-gray-600">
                        <span className="truncate flex-1">{item.producto?.nombre ?? item.nombre ?? '—'}</span>
                        <span className="ml-2 shrink-0 font-medium">×{item.cantidad}</span>
                      </div>
                    ))}
                    {items.length > 3 && <p className="text-xs text-gray-400">+{items.length - 3} producto{items.length - 3 !== 1 ? 's' : ''} más</p>}
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
                    <span className="text-xs text-gray-500">Total a confirmar</span>
                    <span className="font-bold text-amber-700 text-sm">{formatCurrency(venta.total)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleConfirmar(venta)} disabled={enProceso}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
                      {enProceso ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 size={13} />}
                      Confirmar transferencia
                    </button>
                    <button onClick={() => setConfirmarAnular(venta)} disabled={enProceso}
                      className="py-2 px-3 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-500 rounded-xl transition-colors" title="Anular venta">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className={`fixed inset-0 z-70 flex items-center justify-center p-4 transition-opacity duration-200 ${showModal ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setConfirmarAnular(null)} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-80 p-6 space-y-4">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle size={22} className="text-red-500" />
            </div>
            <h3 className="font-bold text-gray-800">¿Anular esta venta?</h3>
            <p className="text-sm text-gray-500">
              Se anulará la venta de <strong className="text-gray-700">{confirmarAnular ? nombreCliente(confirmarAnular) : ''}</strong> y el stock será restaurado.
            </p>
            {confirmarAnular?.referencia_transferencia && <p className="text-xs font-mono text-gray-400">Ref: {confirmarAnular.referencia_transferencia}</p>}
          </div>
          {confirmarAnular && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm">
              <div className="flex justify-between font-bold text-red-700">
                <span>Total a anular</span><span>{formatCurrency(confirmarAnular.total)}</span>
              </div>
            </div>
          )}
          <p className="text-center text-xs text-gray-400">Esta acción no se puede deshacer.</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmarAnular(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors">Cancelar</button>
            <button onClick={handleAnular} disabled={confirmarAnular && procesando === confirmarAnular.id}
              className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5">
              {confirmarAnular && procesando === confirmarAnular.id ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 size={13} />}
              Anular venta
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
