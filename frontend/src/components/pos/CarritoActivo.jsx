import { useState } from 'react';
import { Trash2, ShoppingCart, PauseCircle, CreditCard, ChevronUp, ChevronDown, Tag } from 'lucide-react';
import usePosStore from '../../store/usePosStore';
import { formatCurrency } from '../../utils/helpers';

/**
 * CarritoActivo
 * Muestra los ítems del carritoActual, permite ajustar cantidades,
 * y expone los botones de "Cobrar" y "Pausar Venta (Transferencia)".
 */
export default function CarritoActivo({ clientes, metodosPago, onCobrar }) {
  const {
    carritoActual,
    clienteActual,
    metodoPagoId,
    descuento,
    notas,
    cambiarCantidad,
    quitarProducto,
    setMetadatos,
    limpiarCarrito,
    pausarVenta,
    abrirDrawer,
    ventasEnEspera,
  } = usePosStore();

  const [pauseModal, setPauseModal] = useState(false);
  const [refTransferencia, setRefTransferencia] = useState('');
  const [clienteNombreManual, setClienteNombreManual] = useState('');
  const [errores, setErrores] = useState({ clienteNombre: '', referencia: '' });

  // ── Cálculos ──────────────────────────────────────────────────────────
  const subtotal     = carritoActual.reduce((s, p) => s + p.cantidad * p.precio_unitario, 0);
  const montoDesc    = subtotal * (descuento / 100);
  const total        = subtotal - montoDesc;
  const totalItems   = carritoActual.reduce((s, p) => s + p.cantidad, 0);

  // ── Pausar venta ──────────────────────────────────────────────────────
  const handlePausar = () => {
    if (carritoActual.length === 0) return;
    setPauseModal(true);
  };

  const confirmarPausa = () => {
    // Validar campos obligatorios
    const clienteObj = clientes.find(c => (c.id ?? c.id_cliente) === Number(clienteActual));
    const nombreFinal = clienteObj?.nombre ?? clienteNombreManual.trim();
    const nuevosErrores = {
      clienteNombre: !nombreFinal ? 'El nombre del cliente es obligatorio' : '',
      referencia:    !refTransferencia.trim() ? 'El N° de referencia es obligatorio' : '',
    };
    setErrores(nuevosErrores);
    if (nuevosErrores.clienteNombre || nuevosErrores.referencia) return;

    pausarVenta({
      clienteNombre: nombreFinal,
      referencia:    refTransferencia.trim(),
    });
    setPauseModal(false);
    setRefTransferencia('');
    setClienteNombreManual('');
    setErrores({ clienteNombre: '', referencia: '' });
    abrirDrawer(); // Abre el drawer para ver la venta pausada
  };

  if (carritoActual.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-400 gap-3">
        <ShoppingCart size={48} strokeWidth={1} />
        <p className="text-sm">El carrito está vacío.</p>
        <p className="text-xs">Selecciona productos del catálogo.</p>
        {ventasEnEspera.length > 0 && (
          <button
            onClick={abrirDrawer}
            className="mt-2 text-xs text-blue-600 underline underline-offset-2"
          >
            Ver {ventasEnEspera.length} venta(s) en espera
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Selector de cliente y método de pago ── */}
      <div className="p-3 border-b border-gray-100 space-y-2">
        <select
          value={clienteActual ?? ''}
          onChange={e => setMetadatos({ clienteActual: e.target.value || null })}
          className="input-field text-sm py-2 w-full"
        >
          <option value="">Cliente general</option>
          {clientes.map(c => (
            <option key={c.id ?? c.id_cliente} value={c.id ?? c.id_cliente}>
              {c.nombre}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-2">
          <select
            value={metodoPagoId ?? ''}
            onChange={e => setMetadatos({ metodoPagoId: e.target.value || null })}
            className="input-field text-sm py-2"
          >
            <option value="">Método de pago</option>
            {metodosPago.map(m => (
              <option key={m.id ?? m.id_metodo_pago} value={m.id ?? m.id_metodo_pago}>
                {m.nombre}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0" max="100"
            value={descuento}
            onChange={e => setMetadatos({ descuento: Number(e.target.value) })}
            placeholder="Descuento %"
            className="input-field text-sm py-2"
          />
        </div>

        <input
          type="text"
          value={notas}
          onChange={e => setMetadatos({ notas: e.target.value })}
          placeholder="Notas u observaciones..."
          className="input-field text-sm py-2 w-full"
        />
      </div>

      {/* ── Lista de productos ── */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {carritoActual.map(producto => {
          const tienePromo = producto.promocion != null;
          const precioOriginal = producto.precio_original ?? producto.precio_venta;
          const descuentoAplicado = tienePromo && precioOriginal !== producto.precio_unitario;

          return (
            <div key={producto.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50/60">
              {/* Info producto */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{producto.nombre}</p>
                {descuentoAplicado ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-gray-400 line-through">
                      {formatCurrency(precioOriginal)}
                    </span>
                    <span className="text-xs font-semibold text-red-600">
                      {formatCurrency(producto.precio_unitario)}
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-600 leading-none">
                      <Tag size={8} />{producto.promocion.nombre}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">{formatCurrency(producto.precio_unitario)} c/u</p>
                )}
              </div>

              {/* Control cantidad */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => cambiarCantidad(producto.id, producto.cantidad - 1)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <ChevronDown size={12} />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{producto.cantidad}</span>
                <button
                  onClick={() => cambiarCantidad(producto.id, producto.cantidad + 1)}
                  disabled={producto.cantidad >= producto.stock}
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-40"
                >
                  <ChevronUp size={12} />
                </button>
              </div>

              {/* Subtotal línea */}
              <span className={`text-sm font-semibold w-20 text-right ${tienePromo ? 'text-red-600' : 'text-gray-700'}`}>
                {formatCurrency(producto.cantidad * producto.precio_unitario)}
              </span>

              {/* Quitar */}
              <button
                onClick={() => quitarProducto(producto.id)}
                className="p-1 hover:bg-red-100 rounded-lg text-red-400 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Totales ── */}
      <div className="border-t border-gray-100 px-4 py-3 space-y-1 text-sm bg-gray-50/50">
        <div className="flex justify-between text-gray-500">
          <span>Subtotal ({totalItems} ítem{totalItems !== 1 ? 's' : ''})</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {descuento > 0 && (
          <div className="flex justify-between text-red-500">
            <span>Descuento ({descuento}%)</span>
            <span>-{formatCurrency(montoDesc)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-gray-800 text-base pt-1 border-t border-gray-200">
          <span>Total</span>
          <span className="text-green-700">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* ── Botones de acción ── */}
      <div className="p-3 space-y-2">
        <button
          onClick={() => onCobrar({ total, subtotal, montoDesc })}
          disabled={!metodoPagoId}
          className="w-full btn-secondary py-3 flex items-center justify-center gap-2 text-base disabled:opacity-50"
        >
          <CreditCard size={18} /> Cobrar {formatCurrency(total)}
        </button>

        <button
          onClick={handlePausar}
          className="w-full py-2.5 rounded-xl border-2 border-dashed border-amber-400 text-amber-700 hover:bg-amber-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
        >
          <PauseCircle size={16} /> Pausar — Espera Transferencia
        </button>

        <button
          onClick={limpiarCarrito}
          className="w-full py-2 text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          Cancelar venta
        </button>
      </div>

      {/* ── Mini-modal para confirmar pausa ── */}
      {pauseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => { setPauseModal(false); setErrores({ clienteNombre: '', referencia: '' }); }} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <PauseCircle size={18} className="text-amber-500" />
              Pausar venta — Transferencia pendiente
            </h3>
            <p className="text-sm text-gray-500">
              La venta quedará en espera hasta confirmar la transferencia bancaria.
            </p>

            <div className="space-y-2">
              {/* Si hay cliente seleccionado en el carrito, mostrarlo como info; si no, pedir nombre */}
              {clientes.find(c => (c.id ?? c.id_cliente) === Number(clienteActual)) ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700">
                  <span className="font-medium">
                    {clientes.find(c => (c.id ?? c.id_cliente) === Number(clienteActual))?.nombre}
                  </span>
                  <span className="text-xs text-gray-400">(cliente seleccionado)</span>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={clienteNombreManual}
                    onChange={e => { setClienteNombreManual(e.target.value); setErrores(p => ({ ...p, clienteNombre: '' })); }}
                    placeholder="Nombre del cliente *"
                    className={`input-field text-sm py-2 w-full ${errores.clienteNombre ? 'border-red-400 focus:ring-red-300' : ''}`}
                  />
                  {errores.clienteNombre && (
                    <p className="text-xs text-red-500 mt-1 ml-1">{errores.clienteNombre}</p>
                  )}
                </div>
              )}
              <div>
                <input
                  type="text"
                  value={refTransferencia}
                  onChange={e => { setRefTransferencia(e.target.value); setErrores(p => ({ ...p, referencia: '' })); }}
                  placeholder="N° de referencia / comprobante *"
                  className={`input-field text-sm py-2 w-full ${errores.referencia ? 'border-red-400 focus:ring-red-300' : ''}`}
                />
                {errores.referencia && (
                  <p className="text-xs text-red-500 mt-1 ml-1">{errores.referencia}</p>
                )}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm">
              <p className="font-semibold text-amber-800">Total a transferir:</p>
              <p className="text-2xl font-bold text-amber-700">{formatCurrency(total)}</p>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => { setPauseModal(false); setErrores({ clienteNombre: '', referencia: '' }); }} className="flex-1 btn-ghost border border-gray-200 py-2 text-sm">
                Cancelar
              </button>
              <button onClick={confirmarPausa} className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors">
                Pausar venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
