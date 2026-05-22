import { useState } from 'react';
import { Trash2, ShoppingCart, PauseCircle, CreditCard, ChevronUp, ChevronDown, Tag } from 'lucide-react';
import { toast } from 'react-toastify';
import { saleService } from '../../services/api';
import { formatCurrency, decodeHtml } from '../../utils/helpers';

/**
 * CarritoActivo
 * Recibe todo el estado del carrito como props desde PosScreen.
 * No usa ninguna librería de estado global — solo React puro.
 */
export default function CarritoActivo({
  carritoActual,
  clienteActual,
  metodoPagoId,
  descuento,
  notas,
  clientes,
  metodosPago,
  onSetClienteActual,
  onSetMetodoPagoId,
  onSetDescuento,
  onSetNotas,
  onCambiarCantidad,
  onQuitarProducto,
  onLimpiarCarrito,
  onCompletarVenta,
  onCobrar,
  onAbrirDrawer,
}) {
  const [pauseModal,          setPauseModal]          = useState(false);
  const [refTransferencia,    setRefTransferencia]    = useState('');
  const [clienteNombreManual, setClienteNombreManual] = useState('');
  const [errores,             setErrores]             = useState({ clienteNombre: '', referencia: '' });
  const [pausando,            setPausando]            = useState(false);

  // ── Cálculos ──────────────────────────────────────────────────────────
  const subtotal   = carritoActual.reduce((s, p) => s + p.cantidad * p.precio_unitario, 0);
  const montoDesc  = subtotal * (descuento / 100);
  const total      = subtotal - montoDesc;
  const totalItems = carritoActual.reduce((s, p) => s + p.cantidad, 0);

  // ── Pausar → crea venta pendiente en la BD ────────────────────────────
  const confirmarPausa = async () => {
    const clienteObj  = clientes.find(c => (c.id ?? c.id_cliente) === Number(clienteActual));
    const nombreFinal = clienteObj?.nombre ?? clienteNombreManual.trim();

    const nuevosErrores = {
      clienteNombre: !nombreFinal ? 'El nombre del cliente es obligatorio' : '',
      referencia:    !refTransferencia.trim() ? 'El N° de referencia es obligatorio' : '',
    };
    setErrores(nuevosErrores);
    if (nuevosErrores.clienteNombre || nuevosErrores.referencia) return;

    const metodoPagoTransferenciaId =
      metodoPagoId
      ?? metodosPago.find(m => m.nombre?.toLowerCase().includes('transferencia'))?.id
      ?? metodosPago[0]?.id;

    if (!metodoPagoTransferenciaId) {
      toast.error('No se encontró un método de pago de transferencia');
      return;
    }

    setPausando(true);
    try {
      await saleService.createPendiente({
        cliente_id:               clienteActual || null,
        cliente_nombre_manual:    nombreFinal,
        metodo_pago_id:           metodoPagoTransferenciaId,
        descuento:                Number(descuento || 0),
        notas:                    notas || null,
        referencia_transferencia: refTransferencia.trim(),
        items: carritoActual.map(p => ({
          producto_id:     p.id,
          cantidad:        p.cantidad,
          precio_unitario: p.precio_unitario,
        })),
      });

      onCompletarVenta();
      setPauseModal(false);
      setRefTransferencia('');
      setClienteNombreManual('');
      setErrores({ clienteNombre: '', referencia: '' });
      toast.success('Venta registrada — pendiente de confirmación de transferencia');
      onAbrirDrawer();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrar la venta pendiente');
    } finally {
      setPausando(false);
    }
  };

  const cerrarModal = () => {
    if (pausando) return;
    setPauseModal(false);
    setErrores({ clienteNombre: '', referencia: '' });
  };

  // ── Estado vacío ──────────────────────────────────────────────────────
  if (carritoActual.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-400 gap-3">
        <ShoppingCart size={48} strokeWidth={1} />
        <p className="text-sm">El carrito está vacío.</p>
        <p className="text-xs">Selecciona productos del catálogo.</p>
        <button
          onClick={onAbrirDrawer}
          className="mt-2 text-xs text-blue-600 underline underline-offset-2"
        >
          Ver transferencias pendientes
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Selector cliente, pago, descuento y notas ── */}
      <div className="p-3 border-b border-gray-100 space-y-2">
        <select
          value={clienteActual ?? ''}
          onChange={e => onSetClienteActual(e.target.value || null)}
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
            onChange={e => onSetMetodoPagoId(e.target.value || null)}
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
            onChange={e => onSetDescuento(Number(e.target.value))}
            placeholder="Descuento %"
            className="input-field text-sm py-2"
          />
        </div>

        <input
          type="text"
          value={notas}
          onChange={e => onSetNotas(e.target.value)}
          placeholder="Notas u observaciones..."
          className="input-field text-sm py-2 w-full"
        />
      </div>

      {/* ── Lista de productos ── */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {carritoActual.map(producto => {
          const tienePromo        = producto.promocion != null;
          const precioOriginal    = producto.precio_original ?? producto.precio_venta;
          const descuentoAplicado = tienePromo && precioOriginal !== producto.precio_unitario;

          return (
            <div key={producto.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50/60">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{decodeHtml(producto.nombre)}</p>
                {descuentoAplicado ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-gray-400 line-through">{formatCurrency(precioOriginal)}</span>
                    <span className="text-xs font-semibold text-red-600">{formatCurrency(producto.precio_unitario)}</span>
                    <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-600 leading-none">
                      <Tag size={8} />{producto.promocion.nombre}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">{formatCurrency(producto.precio_unitario)} c/u</p>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onCambiarCantidad(producto.id, producto.cantidad - 1)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <ChevronDown size={12} />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{producto.cantidad}</span>
                <button
                  onClick={() => onCambiarCantidad(producto.id, producto.cantidad + 1)}
                  disabled={producto.cantidad >= producto.stock}
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-40"
                >
                  <ChevronUp size={12} />
                </button>
              </div>

              <span className={`text-sm font-semibold w-20 text-right ${tienePromo ? 'text-red-600' : 'text-gray-700'}`}>
                {formatCurrency(producto.cantidad * producto.precio_unitario)}
              </span>

              <button
                onClick={() => onQuitarProducto(producto.id)}
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
          onClick={onCobrar}
          disabled={!metodoPagoId}
          className="w-full btn-secondary py-3 flex items-center justify-center gap-2 text-base disabled:opacity-50"
        >
          <CreditCard size={18} /> Cobrar {formatCurrency(total)}
        </button>

        <button
          onClick={() => setPauseModal(true)}
          disabled={carritoActual.length === 0}
          className="w-full py-2.5 rounded-xl border-2 border-dashed border-amber-400 text-amber-700 hover:bg-amber-50 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <PauseCircle size={16} /> Pausar — Espera Transferencia
        </button>

        <button
          onClick={onLimpiarCarrito}
          className="w-full py-2 text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          Cancelar venta
        </button>
      </div>

      {/* ── Modal de pausa ── */}
      {pauseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={cerrarModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <PauseCircle size={18} className="text-amber-500" />
              Pausar venta — Transferencia pendiente
            </h3>
            <p className="text-sm text-gray-500">
              La venta quedará registrada en el sistema. Confírmala cuando recibas la transferencia.
            </p>

            <div className="space-y-3">
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
                    className={`input-field text-sm py-2 w-full ${errores.clienteNombre ? 'border-red-400' : ''}`}
                  />
                  {errores.clienteNombre && <p className="text-xs text-red-500 mt-1 ml-1">{errores.clienteNombre}</p>}
                </div>
              )}

              <div>
                <input
                  type="text"
                  value={refTransferencia}
                  onChange={e => { setRefTransferencia(e.target.value); setErrores(p => ({ ...p, referencia: '' })); }}
                  placeholder="N° de referencia / comprobante *"
                  className={`input-field text-sm py-2 w-full ${errores.referencia ? 'border-red-400' : ''}`}
                />
                {errores.referencia && <p className="text-xs text-red-500 mt-1 ml-1">{errores.referencia}</p>}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm">
              <p className="font-semibold text-amber-800">Total a transferir:</p>
              <p className="text-2xl font-bold text-amber-700">{formatCurrency(total)}</p>
            </div>

            <div className="flex gap-2">
              <button onClick={cerrarModal} disabled={pausando} className="flex-1 btn-ghost border border-gray-200 py-2 text-sm">
                Cancelar
              </button>
              <button
                onClick={confirmarPausa}
                disabled={pausando}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {pausando
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <PauseCircle size={15} />
                }
                {pausando ? 'Registrando...' : 'Confirmar y pausar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
