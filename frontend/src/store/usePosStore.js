import { create } from 'zustand';

/**
 * usePosStore — Estado global del Punto de Venta
 *
 * Responsabilidad: SOLO el carrito activo en memoria.
 * Las ventas pendientes de transferencia viven en la BD (estado=pendiente)
 * y se consultan directamente desde el DrawerVentasEspera vía API.
 */
const usePosStore = create((set) => ({
  // ── Carrito activo ───────────────────────────────────────────────────────
  carritoActual:  [],
  clienteActual:  null,
  metodoPagoId:   null,
  descuento:      0,
  notas:          '',
  isDrawerOpen:   false,

  // ── Acciones de carrito ──────────────────────────────────────────────────

  /**
   * Agrega un producto al carrito o incrementa su cantidad.
   * Acepta precio_unitario (con promo), precio_original y promocion opcionales.
   */
  agregarProducto: (producto) => set((state) => {
    const existe = state.carritoActual.find(p => p.id === producto.id);
    if (existe) {
      return {
        carritoActual: state.carritoActual.map(p =>
          p.id === producto.id && p.cantidad < p.stock
            ? { ...p, cantidad: p.cantidad + 1 }
            : p
        ),
      };
    }
    const precioUnitario = producto.precio_unitario ?? producto.precio_venta;
    return {
      carritoActual: [
        ...state.carritoActual,
        {
          ...producto,
          cantidad:        1,
          precio_unitario: precioUnitario,
          precio_original: producto.precio_original ?? producto.precio_venta,
          promocion:       producto.promocion ?? null,
        },
      ],
    };
  }),

  /** Cambia la cantidad de un ítem (respeta límites 1..stock) */
  cambiarCantidad: (productoId, cantidad) => set((state) => ({
    carritoActual: state.carritoActual.map(p =>
      p.id === productoId
        ? { ...p, cantidad: Math.max(1, Math.min(cantidad, p.stock)) }
        : p
    ),
  })),

  /** Quita un producto del carrito */
  quitarProducto: (productoId) => set((state) => ({
    carritoActual: state.carritoActual.filter(p => p.id !== productoId),
  })),

  /** Actualiza metadatos del carrito (cliente, método de pago, descuento, notas) */
  setMetadatos: (campos) => set((state) => ({ ...state, ...campos })),

  /** Limpia el carrito completamente (cancelación o fin de venta) */
  limpiarCarrito: () => set({
    carritoActual: [],
    clienteActual: null,
    metodoPagoId:  null,
    descuento:     0,
    notas:         '',
  }),

  /**
   * Llamado tras registrar una venta exitosa (completada o pendiente).
   * Simplemente limpia el carrito; la persistencia ya está en la BD.
   */
  completarVenta: () => set({
    carritoActual: [],
    clienteActual: null,
    metodoPagoId:  null,
    descuento:     0,
    notas:         '',
  }),

  // ── Drawer de transferencias pendientes ──────────────────────────────────
  abrirDrawer:  () => set({ isDrawerOpen: true }),
  cerrarDrawer: () => set({ isDrawerOpen: false }),
}));

export default usePosStore;
