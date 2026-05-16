import { useState } from 'react';
import { Search, Plus, AlertTriangle, Tag, Percent, DollarSign } from 'lucide-react';
import usePosStore from '../../store/usePosStore';
import { formatCurrency } from '../../utils/helpers';

// ─────────────────────────────────────────────────────────────
// Helpers de promociones
// ─────────────────────────────────────────────────────────────

/**
 * Devuelve la primera promoción activa y vigente para un producto.
 * Prioridad: promoción por producto > promoción por categoría.
 */
function getPromocionActiva(producto, promociones) {
  if (!promociones?.length) return null;
  const hoy = new Date().toISOString().split('T')[0];

  const esVigente = (p) => {
    if (!p.activo) return false;
    if (p.fecha_inicio > hoy) return false;
    if (p.fecha_fin && p.fecha_fin < hoy) return false;
    return true;
  };

  // Buscar primero por producto específico
  const porProducto = promociones.find(
    p => p.tipo_aplicacion === 'producto' && p.producto_id === producto.id && esVigente(p)
  );
  if (porProducto) return porProducto;

  // Luego buscar por categoría
  return promociones.find(
    p => p.tipo_aplicacion === 'categoria' && p.categoria_id === producto.categoria_id && esVigente(p)
  ) ?? null;
}

/**
 * Calcula el precio final con el descuento de la promoción.
 */
function calcularPrecioFinal(precioBase, promo) {
  if (!promo) return precioBase;
  if (promo.tipo_descuento === 'porcentaje') {
    return Math.max(0, precioBase * (1 - promo.valor_descuento / 100));
  }
  return Math.max(0, precioBase - Number(promo.valor_descuento));
}

// ─────────────────────────────────────────────────────────────
// Badge de promoción
// ─────────────────────────────────────────────────────────────
function PromoBadge({ promo }) {
  if (!promo) return null;
  const esPorc = promo.tipo_descuento === 'porcentaje';
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-red-500 text-white leading-none">
      {esPorc
        ? <><Percent size={9} />{Number(promo.valor_descuento).toFixed(0)}% OFF</>
        : <><DollarSign size={9} />-{formatCurrency(promo.valor_descuento)}</>
      }
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────

/**
 * CatalogoProductos
 * Grilla de productos con búsqueda en tiempo real.
 * Aplica automáticamente las promociones activas vigentes.
 */
export default function CatalogoProductos({ productos, promociones = [], loading }) {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const { agregarProducto, carritoActual } = usePosStore();

  // ── Filtrado local ────────────────────────────────────────────────────
  const productosFiltrados = productos.filter(p => {
    const termino = busqueda.toLowerCase();
    const coincideBusqueda =
      p.nombre?.toLowerCase().includes(termino) ||
      p.codigo?.toLowerCase().includes(termino) ||
      p.categoria?.nombre?.toLowerCase().includes(termino);
    const coincideCategoria = categoriaFiltro
      ? String(p.categoria_id) === categoriaFiltro
      : true;
    return coincideBusqueda && coincideCategoria && p.activo && p.stock > 0;
  });

  // Extraer categorías únicas para el filtro
  const categorias = [...new Map(
    productos
      .filter(p => p.categoria)
      .map(p => [p.categoria_id, p.categoria])
  ).values()];

  // Cuántas unidades hay ya en el carrito
  const cantidadEnCarrito = (id) =>
    carritoActual.find(p => p.id === id)?.cantidad ?? 0;

  // ── Handler para agregar con promoción ───────────────────────────────
  const handleAgregar = (producto) => {
    const promo = getPromocionActiva(producto, promociones);
    const precioFinal = calcularPrecioFinal(producto.precio_venta, promo);

    agregarProducto({
      ...producto,
      precio_unitario: precioFinal,
      precio_original: producto.precio_venta,
      promocion:       promo,
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
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
            placeholder="Buscar por nombre o código..."
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

      {/* ── Grilla de productos ── */}
      <div className="flex-1 overflow-y-auto p-3">
        {productosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
            <AlertTriangle size={28} strokeWidth={1.5} />
            <p className="text-sm">No hay productos disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
            {productosFiltrados.map(producto => {
              const enCarrito  = cantidadEnCarrito(producto.id);
              const sinStock   = producto.stock <= 0;
              const lleno      = enCarrito >= producto.stock;
              const promo      = getPromocionActiva(producto, promociones);
              const precioFinal = calcularPrecioFinal(producto.precio_venta, promo);
              const tienePromo = promo !== null;

              return (
                <button
                  key={producto.id}
                  onClick={() => !lleno && handleAgregar(producto)}
                  disabled={sinStock || lleno}
                  className={`
                    relative text-left p-3 rounded-xl border transition-all duration-150
                    ${lleno || sinStock
                      ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50'
                      : tienePromo
                        ? 'border-red-200 bg-red-50/30 hover:border-red-400 hover:shadow-sm active:scale-[0.98]'
                        : 'border-gray-200 bg-white hover:border-blue-400 hover:shadow-sm hover:bg-blue-50/30 active:scale-[0.98]'
                    }
                  `}
                >
                  {/* Badge cantidad en carrito */}
                  {enCarrito > 0 && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold z-10">
                      {enCarrito}
                    </span>
                  )}

                  {/* Badge de promoción (esquina superior izquierda) */}
                  {tienePromo && (
                    <div className="absolute top-2 left-2 z-10">
                      <PromoBadge promo={promo} />
                    </div>
                  )}

                  {/* Categoría */}
                  {producto.categoria && (
                    <p className={`text-xs text-gray-400 mb-1 truncate ${tienePromo ? 'mt-4' : ''}`}>
                      {producto.categoria.nombre}
                    </p>
                  )}
                  {!producto.categoria && tienePromo && <div className="mt-4" />}

                  {/* Nombre */}
                  <p className="text-sm font-medium text-gray-800 leading-tight mb-1 line-clamp-2">
                    {producto.nombre}
                  </p>

                  {/* Código */}
                  {producto.codigo && (
                    <p className="text-xs text-gray-400 font-mono mb-2">{producto.codigo}</p>
                  )}

                  {/* Precio y stock */}
                  <div className="flex items-end justify-between mt-auto">
                    <div className="flex flex-col">
                      {tienePromo && (
                        <span className="text-xs text-gray-400 line-through leading-none">
                          {formatCurrency(producto.precio_venta)}
                        </span>
                      )}
                      <span className={`text-sm font-bold ${tienePromo ? 'text-red-600' : 'text-green-700'}`}>
                        {formatCurrency(precioFinal)}
                      </span>
                    </div>
                    <span className={`text-xs ${producto.stock <= producto.stock_minimo ? 'text-orange-500' : 'text-gray-400'}`}>
                      Stock: {producto.stock}
                    </span>
                  </div>

                  {/* Nombre de la promoción (solo si hay promo) */}
                  {tienePromo && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <Tag size={9} className="text-red-400 flex-shrink-0" />
                      <p className="text-[10px] text-red-500 truncate">{promo.nombre}</p>
                    </div>
                  )}

                  {/* Indicador agregar */}
                  {!lleno && !sinStock && (
                    <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Plus size={11} className="text-gray-500" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
