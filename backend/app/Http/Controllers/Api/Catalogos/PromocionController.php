<?php

namespace App\Http\Controllers\Api\Catalogos;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalogos\PromocionRequest;
use App\Http\Resources\Catalogos\CategoriaResource;
use App\Http\Resources\Catalogos\PromocionResource;
use App\Models\Catalogos\Categoria;
use App\Models\Catalogos\Producto;
use App\Models\Catalogos\Promocion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PromocionController extends Controller
{
    /**
     * Inicialización del módulo Promociones.
     * Devuelve promociones + catálogos del formulario en un solo request.
     */
    public function init(): JsonResponse
    {
        $promociones = Promocion::with(['producto:id,nombre,codigo', 'categoria:id,nombre'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Solo id+nombre+codigo para el selector del formulario
        $productos = Producto::where('activo', true)->orderBy('nombre')
            ->get(['id', 'nombre', 'codigo'])
            ->map(fn ($p) => ['id' => $p->id, 'nombre' => $p->nombre, 'codigo' => $p->codigo]);

        $categorias = Categoria::where('activo', true)->orderBy('nombre')->get();

        return $this->success([
            'promociones' => PromocionResource::collection($promociones),
            'productos'   => $productos,
            'categorias'  => CategoriaResource::collection($categorias),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Promocion::with(['producto:id,nombre,codigo', 'categoria:id,nombre'])
            ->when($request->search, fn ($q, $s) =>
                $q->where('nombre', 'ilike', "%{$s}%")
                  ->orWhere('descripcion', 'ilike', "%{$s}%")
            )
            ->when($request->filled('activo'), fn ($q) =>
                $q->where('activo', filter_var($request->activo, FILTER_VALIDATE_BOOLEAN))
            )
            ->when($request->filled('tipo_aplicacion'), fn ($q) =>
                $q->where('tipo_aplicacion', $request->tipo_aplicacion)
            )
            ->when($request->filled('tipo_descuento'), fn ($q) =>
                $q->where('tipo_descuento', $request->tipo_descuento)
            )
            ->when($request->filled('vigente') && filter_var($request->vigente, FILTER_VALIDATE_BOOLEAN), fn ($q) =>
                $q->vigente()
            )
            ->orderBy($request->get('sort', 'created_at'), $request->get('dir', 'desc'));

        $resultado = $request->filled('per_page')
            ? $query->paginate((int) $request->per_page)
            : $query->get();

        return $this->success(
            PromocionResource::collection($resultado),
            'OK',
            200,
            $this->paginationMeta($resultado)
        );
    }

    public function store(PromocionRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['created_by'] = Auth::id();

        // Limpiar el FK que no corresponde según tipo_aplicacion
        if ($data['tipo_aplicacion'] === 'producto') {
            $data['categoria_id'] = null;
        } else {
            $data['producto_id'] = null;
        }

        $promocion = Promocion::create($data);

        return $this->success(
            new PromocionResource($promocion->load(['producto:id,nombre,codigo', 'categoria:id,nombre'])),
            'Promoción creada exitosamente.',
            201
        );
    }

    public function show(Promocion $promocion): JsonResponse
    {
        return $this->success(
            new PromocionResource(
                $promocion->load(['producto:id,nombre,codigo', 'categoria:id,nombre', 'creadoPor:id,nombre'])
            )
        );
    }

    public function update(PromocionRequest $request, Promocion $promocion): JsonResponse
    {
        $data = $request->validated();

        // Si se cambia el tipo_aplicacion, limpiar el FK contrario
        $tipoAplicacion = $data['tipo_aplicacion'] ?? $promocion->tipo_aplicacion;
        if ($tipoAplicacion === 'producto') {
            $data['categoria_id'] = null;
        } else {
            $data['producto_id'] = null;
        }

        $promocion->update($data);

        return $this->success(
            new PromocionResource(
                $promocion->fresh()->load(['producto:id,nombre,codigo', 'categoria:id,nombre'])
            ),
            'Promoción actualizada.'
        );
    }

    public function destroy(Promocion $promocion): JsonResponse
    {
        $promocion->delete();

        return $this->success(message: 'Promoción eliminada.');
    }

    public function toggleActivo(Promocion $promocion): JsonResponse
    {
        $promocion->update(['activo' => !$promocion->activo]);

        $estado = $promocion->activo ? 'activada' : 'desactivada';

        return $this->success(
            new PromocionResource($promocion->fresh()),
            "Promoción {$estado}."
        );
    }
}
