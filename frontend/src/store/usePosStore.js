import { create } from 'zustand';

/**
 * usePosStore — Estado global del Punto de Venta
 *
 * Flujo principal:
 *  1. Vendedor agrega productos → carritoActual
 *  2. Cliente paga por transferencia → pausarVenta() mueve el carrito a ventasEnEspera
 *  3. Cuando la transferencia se confirma → retomarVenta() regresa al carritoActual
 *  4. Se cobra → completarVenta() envía al backend y limpia el carrito
 */
const usePosStore = create((set, get) => ({
  // ── Estado ──────────────────────────────────────────────────────────────
  carritoActual:   [],   // Productos del cliente en atención ahora
  ventasEnEspera:  [],   // Ventas pausadas por transferencia pendiente
  clienteActual:   null, // Cliente seleccionado en el carrito activo
  metodoPagoId:    null, // Método de pago seleccionado
  descuento:       0,    // Descuento global en %
  notas:           '',   // Notas del pedido
  isDrawerOpen:    false,// Panel lateral de ventas en espera

  // ── Acciones de carrito ──────────────────────────────────────────────────

  /**
   * Agrega un producto al carrito o incrementa su cantidad si ya existe.
   * @param {object} producto — objeto del API con id, nombre, precio_venta, stock
   */
  /**
   * Agrega un producto al carrito o incrementa su cantidad si ya existe.
   *
   * El objeto `producto` puede incluir:
   *   - precio_unitario   → precio final tras aplicar promoción (opcional)
   *   - precio_original   → precio_venta sin descuento (opcional, para mostrarlo tachado)
   *   - promocion         → objeto de la promoción activa (opcional)
   *
   * Si no vienen precio_unitario/precio_original, se usa precio_venta como precio_unitario.
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
    // precio_unitario puede venir pre-calculado con el descuento de promoción
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

  /** Cambia la cantidad de un ítem directamente (desde el input del carrito) */
  cambiarCantidad: (productoId, cantidad) => set((state) => ({
    carritoActual: state.carritoActual.map(p =>
      p.id === productoId
        ? { ...p, cantidad: Math.max(1, Math.min(cantidad, p.stock)) }
        : p
    ),
  })),

  /** Elimina un producto del carrito */
  quitarProducto: (productoId) => set((state) => ({
    carritoActual: state.carritoActual.filter(p => p.id !== productoId),
  })),

  /** Actualiza cliente, método de pago, descuento y notas del carrito activo */
  setMetadatos: (campos) => set((state) => ({ ...state, ...campos })),

  /** Limpia el carrito sin pausar (descarte o nueva venta desde cero) */
  limpiarCarrito: () => set({
    carritoActual: [],
    clienteActual: null,
    metodoPagoId:  null,
    descuento:     0,
    notas:         '',
  }),

  // ── Ventas en espera ────────────────────────────────────────────────────

  /**
   * PAUSAR: mueve el carritoActual completo a ventasEnEspera.
   * Se genera un ID local único y se guarda info del cliente.
   * El carrito queda vacío para atender al siguiente cliente.
   * @param {object} infoAdicional — { clienteNombre, referencia, notas }
   */
  pausarVenta: (infoAdicional = {}) => {
    const { carritoActual, clienteActual, metodoPagoId, descuento, notas } = get();
    if (carritoActual.length === 0) return;

    const nuevaEspera = {
      id:             `ESP-${Date.now()}`,          // ID temporal local
      items:          [...carritoActual],
      clienteActual,
      metodoPagoId,
      descuento,
      notas:          infoAdicional.notas ?? notas,
      clienteNombre:  infoAdicional.clienteNombre ?? 'Cliente General',
      referencia:     infoAdicional.referencia ?? '',  // N° de transferencia bancaria
      pausadoEn:      new Date().toISOString(),
    };

    set((state) => ({
      ventasEnEspera: [...state.ventasEnEspera, nuevaEspera],
      // Limpiar carrito para atender al siguiente cliente
      carritoActual:  [],
      clienteActual:  null,
      metodoPagoId:   null,
      descuento:      0,
      notas:          '',
    }));
  },

  /**
   * RETOMAR: saca la venta de ventasEnEspera y la coloca en carritoActual.
   * El DrawerVentasEspera se cierra automáticamente.
   * @param {string} idVenta — ID local de la venta en espera
   */
  retomarVenta: (idVenta) => {
    const { ventasEnEspera, carritoActual } = get();

    // Si hay items en el carrito activo, no se puede retomar sin pausar primero
    if (carritoActual.length > 0) return false;

    const venta = ventasEnEspera.find(v => v.id === idVenta);
    if (!venta) return false;

    set((state) => ({
      carritoActual:  venta.items,
      clienteActual:  venta.clienteActual,
      metodoPagoId:   venta.metodoPagoId,
      descuento:      venta.descuento,
      notas:          venta.notas,
      // Remover de la lista de espera
      ventasEnEspera: state.ventasEnEspera.filter(v => v.id !== idVenta),
      isDrawerOpen:   false,
    }));
    return true;
  },

  /** Elimina definitivamente una venta en espera (transferencia no confirmada) */
  anularVentaEnEspera: (idVenta) => set((state) => ({
    ventasEnEspera: state.ventasEnEspera.filter(v => v.id !== idVenta),
  })),

  /**
   * COMPLETAR: envía la venta al backend y limpia el carrito.
   * La llamada real al API se hace desde el componente para manejar
   * el loading/error correctamente con toast.
   */
  completarVenta: () => set({
    carritoActual: [],
    clienteActual: null,
    metodoPagoId:  null,
    descuento:     0,
    notas:         '',
  }),

  // ── Drawer ───────────────────────────────────────────────────────────────
  abrirDrawer:  () => set({ isDrawerOpen: true }),
  cerrarDrawer: () => set({ isDrawerOpen: false }),
}));

export default usePosStore;
