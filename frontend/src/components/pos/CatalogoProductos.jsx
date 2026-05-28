import { useState } from 'react';
import { Search, AlertTriangle, Tag, Percent, DollarSign, Plus, CheckCircle2 } from 'lucide-react';
import { formatCurrency, decodeHtml } from '../../utils/helpers';

// ─────────────────────────────────────────────────────────────
// Helpers de promociones
// ─────────────────────────────────────────────────────────────

function getPromocionActiva(producto, promociones) {
  if (!promociones?.length) return null;
  const hoy = new Date().toISOString().split('T')[0];
  const esVigente = (p) =>
    p.activo && p.fecha_inicio <= hoy && (!p.fecha_fin || p.fecha_fin >= hoy);

  return (
    promociones.find(p => p.tipo_aplicacion === 'producto' && p.producto_id === producto.id && esVigente(p)) ??
    promociones.find(p => p.tipo_aplicacion === 'categoria' && p.categoria_id === producto.categoria_id && esVigente(p)) ??
    null
  );
}

function calcularPrecioFinal(precioBase, promo) {
  if (!promo) return precioBase;
  if (promo.tipo_descuento === 'porcentaje')
    return Math.max(0, precioBase * (1 - promo.valor_descuento / 100));
  return Math.max(0, precioBase - Number(promo.valor_descuento));
}

function PromoBadge({ promo }) {
  if (!promo) return null;
  const esPorc = promo.tipo_descuento === 'porcentaje';
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500 text-white leading-none shrink-0">
      {esPorc
        ? <><Percent size={8} />{Number(promo.valor_descuento).toFixed(0)}%OFF</>
        : <><DollarSign size={8} />-{formatCurrency(promo.valor_descuento)}</>}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────

/**
 * CatalogoProductos — Layout de filas
 * Recibe carritoActual y onAgregarProducto como props desde PosScreen.
 * Decodifica entidades HTML en nombres de productos (&quot; → ").
 */
export default function CatalogoProductos({
  productos,
  promociones = [],
  carritoActual = [],
  onAgregarProducto,
  loading,
}) {
  const [busqueda,       setBusqueda]       = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');

  // ── Filtrado ─────────────────────────────────────────────────────────
  const productosFiltrados = productos.filter(p => {
    // activo y stock > 0 ya vienen filtrados desde el servidor;
    // las condiciones se mantienen como guardia de seguridad.
    if (!p.activo || p.stock <= 0) return false;
    const termino = busqueda.toLowerCase();
    const coincide =
      decodeHtml(p.nombre)?.toLowerCase().includes(termino) ||
      p.codigo?.toLowerCase().includes(termino) ||
      p.categoria?.nombre?.toLowerCase().includes(termino);
    const coincideCategoria = categoriaFiltro ? String(p.categoria_id) === categoriaFiltro : true;
    return coincide && coincideCategoria;
  });

  const categorias = [...new Map(
    productos.filter(p => p.categoria).map(p => [p.categoria_id, p.categoria])
  ).values()];

  const cantidadEnCarrito = (id) => carritoActual.find(p => p.id === id)?.cantidad ?? 0;

  const handleAgregar = (producto) => {
    const promo      = getPromocionActiva(producto, promociones);
    const precioFinal = calcularPrecioFinal(producto.precio_venta, promo);
    onAgregarProducto({
      ...producto,
      nombre:          decodeHtml(producto.nombre),
      precio_unitario: precioFinal,
      precio_original: producto.precio_venta,
      promocion:       promo,
    });
  };

  // ── Skeleton ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-3 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" style={{ opacity: 1 - i * 0.12 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Buscador y filtro ── */}
      <div className="p-3 border-b border-gray-100 space-y-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, código o categoría..."
            className="input-field pl-9 text-sm py-2 w-full"
          />
        </div>
        {categorias.length > 1 && (
          <select
            value={categoriaFiltro}
            onChange={e => setCategoriaFiltro(e.target.value)}
            className="input-field text-sm py-2 w-full"
          >
            <option value="">Todas las categorías</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
        )}
      </div>

      {/* ── Lista de productos ── */}
      <div className="flex-1 overflow-y-auto">
        {productosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
            <AlertTriangle size={28} strokeWidth={1.5} />
            <p className="text-sm">No hay productos disponibles</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {productosFiltrados.map(producto => {
              const enCarrito  = cantidadEnCarrito(producto.id);
              const lleno      = enCarrito >= producto.stock;
              const sinStock   = producto.stock <= 0;
              const promo      = getPromocionActiva(producto, promociones);
              const precioFinal = calcularPrecioFinal(producto.precio_venta, promo);
              const tienePromo = promo !== null;
              const stockBajo  = producto.stock <= producto.stock_minimo;
              const nombre     = decodeHtml(producto.nombre);

              return (
                <button
                  key={producto.id}
                  onClick={() => !lleno && !sinStock && handleAgregar(producto)}
                  disabled={sinStock || lleno}
                  className={`
                    w-full text-left px-4 py-3 flex items-center gap-3 transition-all duration-150
                    ${lleno || sinStock
                      ? 'opacity-40 cursor-not-allowed bg-gray-50'
                      : tienePromo
                        ? 'hover:bg-red-50/50 active:bg-red-100/60'
                        : 'hover:bg-blue-50/40 active:bg-blue-100/50'
                    }
                  `}
                >
                  {/* ── Columna izquierda: info ── */}
                  <div className="flex-1 min-w-0">
                    {/* Fila superior: categoría + badges */}
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      {producto.categoria && (
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                          {producto.categoria.nombre}
                        </span>
                      )}
                      {tienePromo && <PromoBadge promo={promo} />}
                      {enCarrito > 0 && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white leading-none">
                          <CheckCircle2 size={8} /> {enCarrito} en carrito
                        </span>
                      )}
                    </div>

                    {/* Nombre del producto */}
                    <p className={`text-sm font-semibold leading-snug truncate ${tienePromo ? 'text-gray-800' : 'text-gray-800'}`}>
                      {nombre}
                    </p>

                    {/* Código + nombre promo */}
                    <div className="flex items-center gap-2 mt-0.5">
                      {producto.codigo && (
                        <span className="text-[10px] text-gray-400 font-mono">{producto.codigo}</span>
                      )}
                      {tienePromo && (
                        <span className="flex items-center gap-0.5 text-[10px] text-red-500">
                          <Tag size={8} className="shrink-0" />
                          {promo.nombre}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── Columna derecha: precio + stock + botón ── */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {/* Precios */}
                    <div className="text-right">
                      {tienePromo && (
                        <p className="text-[10px] text-gray-400 line-through leading-none">
                          {formatCurrency(producto.precio_venta)}
                        </p>
                      )}
                      <p className={`text-sm font-bold leading-tight ${tienePromo ? 'text-red-600' : 'text-green-700'}`}>
                        {formatCurrency(precioFinal)}
                      </p>
                    </div>

                    {/* Stock */}
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                        stockBajo ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        Stock: {producto.stock}
                      </span>

                      {/* Botón agregar */}
                      {!lleno && !sinStock && (
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          tienePromo ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-600'
                        }`}>
                          <Plus size={13} />
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
