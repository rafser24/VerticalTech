import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { ArrowLeft, Clock } from 'lucide-react';
import MainLayout from '../layout/MainLayout';
import CarritoActivo from './CarritoActivo';
import CatalogoProductos from './CatalogoProductos';
import DrawerVentasEspera from './DrawerVentasEspera';
import TicketVenta from './TicketVenta';
import api, { clientService, productService, paymentMethodService, saleService } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';

/**
 * PosScreen — Punto de Venta
 *
 * Todo el estado del carrito vive aquí (useState).
 * Se pasa hacia abajo como props a CarritoActivo y CatalogoProductos.
 * Sin librerías externas de estado global.
 */
export default function PosScreen({ onVolver }) {
  // ── Catálogos (datos del servidor) ───────────────────────────────────
  const [productos,   setProductos]   = useState([]);
  const [clientes,    setClientes]    = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // ── Estado del carrito activo ────────────────────────────────────────
  const [carritoActual, setCarritoActual] = useState([]);
  const [clienteActual, setClienteActual] = useState(null);
  const [metodoPagoId,  setMetodoPagoId]  = useState(null);
  const [descuento,     setDescuento]     = useState(0);
  const [notas,         setNotas]         = useState('');

  // ── UI ───────────────────────────────────────────────────────────────
  const [cobrando,     setCobrando]     = useState(false);
  const [ticketVenta,  setTicketVenta]  = useState(null);
  const [drawerOpen,   setDrawerOpen]   = useState(false);

  // ── Cargar catálogos al montar ────────────────────────────────────────
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoadingData(true);
        const [prodRes, clientRes, pagoRes, promRes] = await Promise.allSettled([
          productService.getAll(),
          clientService.getAll(),
          paymentMethodService.getAll(),
          api.get('/promociones', { params: { activo: true } }),
        ]);

        const unwrap = (settled) => {
          if (settled.status === 'rejected') return [];
          const d = settled.value?.data?.data ?? settled.value?.data;
          return Array.isArray(d) ? d : d?.data ?? d?.items ?? [];
        };

        const unwrapPromociones = (settled) => {
          if (settled.status === 'rejected') return [];
          const d = settled.value?.data;
          if (d?.data?.data && Array.isArray(d.data.data)) return d.data.data;
          if (d?.data && Array.isArray(d.data)) return d.data;
          return [];
        };

        setProductos(unwrap(prodRes));
        setClientes(unwrap(clientRes));
        setMetodosPago(unwrap(pagoRes));
        setPromociones(unwrapPromociones(promRes));
      } catch (err) {
        console.error(err);
        toast.error('Error al cargar catálogos');
      } finally {
        setLoadingData(false);
      }
    };
    cargarDatos();
  }, []);

  // ── Acciones del carrito ──────────────────────────────────────────────

  /** Agrega un producto o incrementa su cantidad si ya está en el carrito */
  const agregarProducto = useCallback((producto) => {
    setCarritoActual(prev => {
      const existe = prev.find(p => p.id === producto.id);
      if (existe) {
        return prev.map(p =>
          p.id === producto.id && p.cantidad < p.stock
            ? { ...p, cantidad: p.cantidad + 1 }
            : p
        );
      }
      const precioUnitario = producto.precio_unitario ?? producto.precio_venta;
      return [
        ...prev,
        {
          ...producto,
          cantidad:        1,
          precio_unitario: precioUnitario,
          precio_original: producto.precio_original ?? producto.precio_venta,
          promocion:       producto.promocion ?? null,
        },
      ];
    });
  }, []);

  /** Cambia la cantidad de un ítem (respeta mínimo 1 y máximo stock) */
  const cambiarCantidad = useCallback((productoId, cantidad) => {
    setCarritoActual(prev =>
      prev.map(p =>
        p.id === productoId
          ? { ...p, cantidad: Math.max(1, Math.min(cantidad, p.stock)) }
          : p
      )
    );
  }, []);

  /** Quita un producto del carrito */
  const quitarProducto = useCallback((productoId) => {
    setCarritoActual(prev => prev.filter(p => p.id !== productoId));
  }, []);

  /** Resetea el carrito completo */
  const limpiarCarrito = useCallback(() => {
    setCarritoActual([]);
    setClienteActual(null);
    setMetodoPagoId(null);
    setDescuento(0);
    setNotas('');
  }, []);

  // ── Cobrar ────────────────────────────────────────────────────────────
  const handleCobrar = async () => {
    if (!metodoPagoId) { toast.warning('Selecciona un método de pago'); return; }
    if (carritoActual.length === 0) return;

    setCobrando(true);
    try {
      const subtotal  = carritoActual.reduce((s, p) => s + p.cantidad * p.precio_unitario, 0);
      const montoDesc = subtotal * ((Number(descuento) || 0) / 100);
      const total     = subtotal - montoDesc;

      const res = await saleService.create({
        cliente_id:     clienteActual || null,
        metodo_pago_id: metodoPagoId,
        descuento:      Number(descuento || 0),
        notas:          notas || null,
        items: carritoActual.map(p => ({
          producto_id:     p.id,
          cantidad:        p.cantidad,
          precio_unitario: p.precio_unitario,
        })),
      });

      const ventaCreada = res.data?.data ?? res.data;
      limpiarCarrito();
      setTicketVenta(ventaCreada);
      toast.success(`Venta completada — ${formatCurrency(total)}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al procesar la venta');
    } finally {
      setCobrando(false);
    }
  };

  // ── Loader ────────────────────────────────────────────────────────────
  if (loadingData) {
    return (
      <MainLayout title="Punto de Venta">
        <div className="flex flex-col items-center justify-center h-[65vh] gap-6">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-400 animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-indigo-300 animate-spin" style={{ animationDuration: '0.6s', animationDirection: 'reverse' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-gray-700 tracking-wide">Iniciando Punto de Venta</p>
            <div className="flex items-center justify-center gap-1">
              {[0,1,2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
          <div className="flex gap-4 w-full max-w-5xl mt-2 px-4">
            <div className="w-[38%] space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" style={{ opacity: 1 - i * 0.2 }} />)}
            </div>
            <div className="flex-1 grid grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" style={{ opacity: 1 - i * 0.08 }} />
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Punto de Venta">
      {/* Barra superior */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onVolver}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={15} /> Historial de ventas
        </button>

        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors rounded-xl text-sm text-amber-700 font-medium"
        >
          <Clock size={15} />
          Transferencias en espera
        </button>
      </div>

      {/* Layout dividido */}
      <div className="flex gap-4 h-[calc(100vh-180px)]">
        {/* Carrito (38%) */}
        <div className="w-[38%] bg-white rounded-2xl shadow-card border border-gray-100 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm">Carrito activo</h2>
          </div>
          <CarritoActivo
            carritoActual={carritoActual}
            clienteActual={clienteActual}
            metodoPagoId={metodoPagoId}
            descuento={descuento}
            notas={notas}
            clientes={clientes}
            metodosPago={metodosPago}
            onSetClienteActual={setClienteActual}
            onSetMetodoPagoId={setMetodoPagoId}
            onSetDescuento={setDescuento}
            onSetNotas={setNotas}
            onCambiarCantidad={cambiarCantidad}
            onQuitarProducto={quitarProducto}
            onLimpiarCarrito={limpiarCarrito}
            onCompletarVenta={limpiarCarrito}
            onCobrar={handleCobrar}
            onAbrirDrawer={() => setDrawerOpen(true)}
          />
        </div>

        {/* Catálogo (62%) */}
        <div className="flex-1 bg-white rounded-2xl shadow-card border border-gray-100 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm">
              Catálogo de productos
              <span className="ml-2 text-xs text-gray-400 font-normal">
                {productos.filter(p => p.activo && p.stock > 0).length} disponibles
              </span>
            </h2>
          </div>
          <CatalogoProductos
            productos={productos}
            promociones={promociones}
            carritoActual={carritoActual}
            onAgregarProducto={agregarProducto}
            loading={loadingData}
          />
        </div>
      </div>

      {/* Drawer de transferencias pendientes */}
      <DrawerVentasEspera
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onVentaConfirmada={(venta) => setTicketVenta(venta)}
      />

      {/* Ticket de venta */}
      {ticketVenta && (
        <TicketVenta venta={ticketVenta} onClose={() => setTicketVenta(null)} />
      )}

      {/* Overlay cobrando */}
      {cobrando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl space-y-3">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto" />
            <p className="font-semibold text-gray-800">Procesando venta...</p>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
