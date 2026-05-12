import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { ArrowLeft, Clock } from 'lucide-react';
import MainLayout from '../layout/MainLayout';
import CarritoActivo from './CarritoActivo';
import CatalogoProductos from './CatalogoProductos';
import DrawerVentasEspera from './DrawerVentasEspera';
import TicketVenta from './TicketVenta';
import usePosStore from '../../store/usePosStore';
import { clientService, productService, paymentMethodService, saleService } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';

/**
 * PosScreen — Layout principal del Punto de Venta
 *
 * Split design: Catálogo (derecha) | Carrito (izquierda)
 * El drawer de ventas en espera flota sobre el layout.
 */
export default function PosScreen({ onVolver }) {
  const [productos,      setProductos]      = useState([]);
  const [clientes,       setClientes]       = useState([]);
  const [metodosPago,    setMetodosPago]    = useState([]);
  const [loadingData,    setLoadingData]    = useState(true);
  const [cobrando,       setCobrando]       = useState(false);
  const [ticketVenta,    setTicketVenta]    = useState(null); // venta completada para el ticket

  const {
    carritoActual,
    clienteActual,
    metodoPagoId,
    descuento,
    notas,
    completarVenta,
    ventasEnEspera,
    abrirDrawer,
    isDrawerOpen,
  } = usePosStore();

  // ── Cargar catálogos al montar ────────────────────────────────────────
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoadingData(true);
        const [prodRes, clientRes, pagoRes] = await Promise.all([
          productService.getAll(),
          clientService.getAll(),
          paymentMethodService.getAll(),
        ]);

        const unwrap = (res) => {
          const d = res.data?.data ?? res.data;
          return Array.isArray(d) ? d : d?.data ?? d?.items ?? [];
        };

        setProductos(unwrap(prodRes));
        setClientes(unwrap(clientRes));
        setMetodosPago(unwrap(pagoRes));
      } catch (err) {
        console.error(err);
        toast.error('Error al cargar catálogos');
      } finally {
        setLoadingData(false);
      }
    };
    cargarDatos();
  }, []);

  // ── Cobrar: enviar venta al backend ───────────────────────────────────
  const handleCobrar = async () => {
    if (!metodoPagoId) {
      toast.warning('Selecciona un método de pago');
      return;
    }
    if (carritoActual.length === 0) return;

    setCobrando(true);
    try {
      const subtotal  = carritoActual.reduce((s, p) => s + p.cantidad * p.precio_unitario, 0);
      const montoDesc = subtotal * ((Number(descuento) || 0) / 100);
      const total     = subtotal - montoDesc;

      const payload = {
        cliente_id:     clienteActual || null,
        metodo_pago_id: metodoPagoId,
        descuento:      Number(descuento || 0),
        notas:          notas || null,
        items: carritoActual.map(p => ({
          producto_id:     p.id,
          cantidad:        p.cantidad,
          precio_unitario: p.precio_unitario,
        })),
      };

      const res = await saleService.create(payload);
      const ventaCreada = res.data?.data ?? res.data;

      completarVenta(); // Limpia el carrito en Zustand
      setTicketVenta(ventaCreada); // Muestra el ticket
      toast.success(`✅ Venta completada — ${formatCurrency(total)}`);
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al procesar la venta';
      toast.error(msg);
    } finally {
      setCobrando(false);
    }
  };

  // ── Loader mientras cargan los catálogos ─────────────────────────────
  if (loadingData) {
    return (
      <MainLayout title="Punto de Venta">
        <div className="flex flex-col items-center justify-center h-[65vh] gap-6">
          {/* Spinner moderno multicapa */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-400 animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-indigo-300 animate-spin" style={{ animationDuration: '0.6s', animationDirection: 'reverse' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
            </div>
          </div>
          {/* Texto animado */}
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-gray-700 tracking-wide">Iniciando Punto de Venta</p>
            <div className="flex items-center justify-center gap-1">
              {[0,1,2].map(i => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
          {/* Skeleton del layout POS */}
          <div className="flex gap-4 w-full max-w-5xl mt-2 px-4">
            <div className="w-[38%] space-y-3">
              <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" style={{ opacity: 1 - i * 0.2 }} />
              ))}
              <div className="h-12 bg-gray-200 rounded-xl animate-pulse mt-4" />
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
      {/* Barra superior POS */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onVolver}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={15} /> Volver al historial
        </button>

        <button
          onClick={abrirDrawer}
          className="relative flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors rounded-xl text-sm text-amber-700 font-medium"
        >
          <Clock size={15} />
          Transferencias en espera
          {ventasEnEspera.length > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">
              {ventasEnEspera.length}
            </span>
          )}
        </button>
      </div>

      {/* Split layout */}
      <div className="flex gap-4 h-[calc(100vh-180px)]">
        {/* ── Carrito (izquierda, 38%) ── */}
        <div className="w-[38%] bg-white rounded-2xl shadow-card border border-gray-100 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm">Carrito activo</h2>
          </div>
          <CarritoActivo
            clientes={clientes}
            metodosPago={metodosPago}
            onCobrar={handleCobrar}
          />
        </div>

        {/* ── Catálogo (derecha, 62%) ── */}
        <div className="flex-1 bg-white rounded-2xl shadow-card border border-gray-100 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm">
              Catálogo de productos
              {!loadingData && (
                <span className="ml-2 text-xs text-gray-400 font-normal">
                  {productos.filter(p => p.activo && p.stock > 0).length} disponibles
                </span>
              )}
            </h2>
          </div>
          <CatalogoProductos productos={productos} loading={loadingData} />
        </div>
      </div>

      {/* Drawer de ventas en espera */}
      <DrawerVentasEspera />

      {/* Ticket de venta */}
      {ticketVenta && (
        <TicketVenta
          venta={ticketVenta}
          onClose={() => setTicketVenta(null)}
        />
      )}

      {/* Overlay de cobrando */}
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
