import { useState } from 'react';
import { X, RotateCcw, Trash2, Clock, Banknote, AlertCircle, AlertTriangle } from 'lucide-react';
import usePosStore from '../../store/usePosStore';
import { formatCurrency } from '../../utils/helpers';

/**
 * DrawerVentasEspera
 * Panel lateral (offcanvas) que lista todas las ventas pausadas
 * pendientes de confirmación de transferencia bancaria.
 */
export default function DrawerVentasEspera() {
  const {
    isDrawerOpen,
    cerrarDrawer,
    ventasEnEspera,
    retomarVenta,
    anularVentaEnEspera,
    carritoActual,
  } = usePosStore();

  const [confirmarAnular, setConfirmarAnular] = useState(null); // venta a anular

  const carritoOcupado = carritoActual.length > 0;

  const calcularTotal = (venta) => {
    const subtotal  = venta.items.reduce((s, p) => s + p.cantidad * p.precio_unitario, 0);
    const descuento = subtotal * ((venta.descuento ?? 0) / 100);
    return subtotal - descuento;
  };

  const tiempoEspera = (iso) => {
    const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
    if (mins < 1)  return 'hace un momento';
    if (mins < 60) return `hace ${mins} min`;
    return `hace ${Math.floor(mins / 60)}h ${mins % 60}min`;
  };

  const handleRetomar = (id) => {
    const ok = retomarVenta(id);
    if (!ok) alert('Primero pausa o cancela la venta actual antes de retomar esta.');
  };

  const handleConfirmarAnular = () => {
    if (confirmarAnular) {
      anularVentaEnEspera(confirmarAnular.id);
      setConfirmarAnular(null);
    }
  };

  return (
    <>
      {/* Overlay drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-40 bg-gray-900/30 backdrop-blur-sm" onClick={cerrarDrawer} />
      )}

      {/* Panel lateral */}
      <div className={`fixed top-0 right-0 h-full z-50 w-80 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />
              Ventas en Espera
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {ventasEnEspera.length} pendiente{ventasEnEspera.length !== 1 ? 's' : ''} de transferencia
            </p>
          </div>
          <button onClick={cerrarDrawer} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
            <X size={16} />
          </button>
        </div>

        {carritoOcupado && (
          <div className="mx-3 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
            <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">Tienes una venta activa. Paúsala primero para poder retomar otra.</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {ventasEnEspera.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2 text-center">
              <Banknote size={36} strokeWidth={1} />
              <p className="text-sm">No hay ventas en espera</p>
              <p className="text-xs">Las transferencias pendientes aparecerán aquí</p>
            </div>
          ) : (
            ventasEnEspera.map(venta => (
              <div key={venta.id} className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{venta.clienteNombre}</p>
                    {venta.referencia && (
                      <p className="text-xs text-gray-400 font-mono">Ref: {venta.referencia}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={10} />{tiempoEspera(venta.pausadoEn)}
                  </span>
                </div>

                <div className="space-y-1">
                  {venta.items.slice(0, 3).map(item => (
                    <div key={item.id} className="flex justify-between text-xs text-gray-600">
                      <span className="truncate flex-1">{item.nombre}</span>
                      <span className="ml-2 shrink-0">×{item.cantidad}</span>
                    </div>
                  ))}
                  {venta.items.length > 3 && (
                    <p className="text-xs text-gray-400">+{venta.items.length - 3} producto{venta.items.length - 3 !== 1 ? 's' : ''} más</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                  <span className="text-xs text-gray-500">Total pendiente</span>
                  <span className="font-bold text-amber-700">{formatCurrency(calcularTotal(venta))}</span>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleRetomar(venta.id)}
                    disabled={carritoOcupado}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <RotateCcw size={12} /> Retomar
                  </button>
                  <button
                    onClick={() => setConfirmarAnular(venta)}
                    className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Modal de confirmación de anulación ── */}
      {confirmarAnular && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setConfirmarAnular(null)} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: '1rem', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '320px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

            {/* Ícono */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.5rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={24} color="#EF4444" />
              </div>
              <h3 style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem', margin: 0 }}>¿Anular esta venta?</h3>
              <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: 0 }}>
                Se anulará la venta de <strong style={{ color: '#374151' }}>{confirmarAnular.clienteNombre}</strong>.
                {confirmarAnular.referencia && (
                  <span style={{ display: 'block', fontFamily: 'monospace', fontSize: '0.72rem', marginTop: 2 }}>Ref: {confirmarAnular.referencia}</span>
                )}
              </p>
            </div>

            {/* Resumen */}
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '0.75rem', padding: '0.75rem', fontSize: '0.8rem' }}>
              {confirmarAnular.items.slice(0, 3).map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563', marginBottom: 3 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.nombre}</span>
                  <span style={{ marginLeft: 8, fontWeight: 500, flexShrink: 0 }}>{formatCurrency(item.cantidad * item.precio_unitario)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#DC2626', paddingTop: 6, borderTop: '1px solid #FECACA', marginTop: 4 }}>
                <span>Total a anular</span>
                <span>{formatCurrency(calcularTotal(confirmarAnular))}</span>
              </div>
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#9CA3AF', margin: 0 }}>Esta acción no se puede deshacer.</p>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setConfirmarAnular(null)}
                style={{ flex: 1, padding: '0.6rem', border: '1.5px solid #E5E7EB', borderRadius: '0.75rem', fontSize: '0.82rem', color: '#6B7280', background: '#fff', cursor: 'pointer', fontWeight: 500 }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarAnular}
                style={{ flex: 1, padding: '0.6rem', border: 'none', borderRadius: '0.75rem', fontSize: '0.82rem', color: '#fff', background: '#EF4444', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Trash2 size={13} /> Anular venta
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
