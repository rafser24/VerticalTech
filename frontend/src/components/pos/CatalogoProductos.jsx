import { useState } from 'react';
import { Search, Plus, AlertTriangle } from 'lucide-react';
import usePosStore from '../../store/usePosStore';
import { formatCurrency } from '../../utils/helpers';

/**
 * CatalogoProductos
 * Grilla de productos con búsqueda en tiempo real.
 * Al hacer clic en un producto se agrega al carritoActual via Zustand.
 */
export default function CatalogoProductos({ productos, loading }) {
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
              const enCarrito = cantidadEnCarrito(producto.id);
              const sinStock  = producto.stock <= 0;
              const lleno     = enCarrito >= producto.stock;

              return (
                <button
                  key={producto.id}
                  onClick={() => !lleno && agregarProducto(producto)}
                  disabled={sinStock || lleno}
                  className={`
                    relative text-left p-3 rounded-xl border transition-all duration-150
                    ${lleno || sinStock
                      ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50'
                      : 'border-gray-200 bg-white hover:border-blue-400 hover:shadow-sm hover:bg-blue-50/30 active:scale-[0.98]'
                    }
                  `}
                >
                  {/* Badge cantidad en carrito */}
                  {enCarrito > 0 && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                      {enCarrito}
                    </span>
                  )}

                  {/* Categoría */}
                  {producto.categoria && (
                    <p className="text-xs text-gray-400 mb-1 truncate">{producto.categoria.nombre}</p>
                  )}

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
                    <span className="text-sm font-bold text-green-700">
                      {formatCurrency(producto.precio_venta)}
                    </span>
                    <span className={`text-xs ${producto.stock <= producto.stock_minimo ? 'text-orange-500' : 'text-gray-400'}`}>
                      Stock: {producto.stock}
                    </span>
                  </div>

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
