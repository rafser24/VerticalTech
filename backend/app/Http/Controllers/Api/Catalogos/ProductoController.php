<?php

namespace App\Http\Controllers\Api\Catalogos;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalogos\ProductoRequest;
use App\Http\Resources\Catalogos\ProductoResource;
use App\Models\Catalogos\Producto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Producto::with(['categoria', 'proveedor'])
            ->when($request->search, fn($q, $s) =>
                $q->where(fn($q) =>
                    $q->where('nombre', 'ilike', "%{$s}%")
                      ->orWhere('codigo', 'ilike', "%{$s}%")
                      ->orWhere('descripcion', 'ilike', "%{$s}%")
                )
            )
            ->when($request->filled('activo'), fn($q) =>
                $q->where('activo', filter_var($request->activo, FILTER_VALIDATE_BOOLEAN))
            )
            ->when($request->filled('categoria_id'), fn($q) =>
                $q->where('categoria_id', $request->categoria_id)
            )
            ->when($request->filled('proveedor_id'), fn($q) =>
                $q->where('proveedor_id', $request->proveedor_id)
            )
            ->when($request->filled('stock_bajo') && $request->boolean('stock_bajo'), fn($q) =>
                $q->whereColumn('stock', '<=', 'stock_minimo')
            )
            ->orderBy($request->get('sort', 'nombre'), $request->get('dir', 'asc'));

        $resultado = $request->filled('per_page')
            ? $query->paginate((int) $request->per_page)
            : $query->get();

        return $this->success(
            ProductoResource::collection($resultado),
            'OK', 200,
            $this->paginationMeta($resultado)
        );
    }

    public function store(ProductoRequest $request): JsonResponse
    {
        $producto = Producto::create($request->validated());
        $producto->load(['categoria', 'proveedor']);

        return $this->success(new ProductoResource($producto), 'Producto creado.', 201);
    }

    public function show(int $i): JsonResponse
    {
        $producto = Producto::with(['categoria', 'proveedor'])->findOrFail($i);

        return $this->success(new ProductoResource($producto));
    }

    public function update(ProductoRequest $request, int $i): JsonResponse
    {
        /*
         * CORRECCIÓN: la ruta usa /{i} pero el método original recibía
         * Producto $producto (route model binding por nombre 'producto').
         * Como los nombres no coinciden, Laravel no hacía el binding
         * y el Request no podía obtener el ID para el Rule::unique()->ignore().
         * Ahora se busca manualmente con findOrFail($i).
         */
        $producto = Producto::findOrFail($i);
        $producto->update($request->validated());
        $producto->load(['categoria', 'proveedor']);

        return $this->success(new ProductoResource($producto), 'Producto actualizado.');
    }

    public function toggleActivo(int $i): JsonResponse
    {
        $producto = Producto::findOrFail($i);
        $producto->update(['activo' => !$producto->activo]);
        $estado = $producto->activo ? 'activado' : 'desactivado';

        return $this->success(new ProductoResource($producto), "Producto {$estado}.");
    }

    public function destroy(int $i): JsonResponse
    {
        $producto = Producto::findOrFail($i);

        if ($producto->detallesVenta()->exists() || $producto->detallesCompra()->exists()) {
            return $this->error(
                'No se puede eliminar: el producto tiene movimientos registrados.',
                422
            );
        }

        $producto->delete();

        return $this->success(null, 'Producto eliminado.');
    }

    public function stockBajo(): JsonResponse
    {
        $productos = Producto::with(['categoria', 'proveedor'])
            ->activo()
            ->stockBajo()
            ->orderBy('stock')
            ->get();

        return $this->success(ProductoResource::collection($productos));
    }
}
