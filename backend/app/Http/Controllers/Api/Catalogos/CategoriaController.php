<?php

namespace App\Http\Controllers\Api\Catalogos;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalogos\CategoriaRequest;
use App\Http\Resources\Catalogos\CategoriaResource;
use App\Models\Catalogos\Categoria;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoriaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Categoria::withCount('productos')
            ->when($request->search, fn($q, $s) =>
                $q->where('nombre', 'ilike', "%{$s}%")
                  ->orWhere('descripcion', 'ilike', "%{$s}%")
            )
            ->when($request->filled('activo'), fn($q) =>
                $q->where('activo', filter_var($request->activo, FILTER_VALIDATE_BOOLEAN))
            )
            ->orderBy($request->get('sort', 'nombre'), $request->get('dir', 'asc'));

        $resultado = $request->filled('per_page')
            ? $query->paginate((int) $request->per_page)
            : $query->get();

        return $this->success(
            CategoriaResource::collection($resultado),
            'OK',
            200,
            $this->paginationMeta($resultado)
        );
    }

    public function store(CategoriaRequest $request): JsonResponse
    {
        $categoria = Categoria::create($request->validated());

        return $this->success(
            new CategoriaResource($categoria),
            'Categoría creada exitosamente.',
            201
        );
    }

    public function show(Categoria $categoria): JsonResponse
    {
        return $this->success(new CategoriaResource($categoria->loadCount('productos')));
    }

    public function update(CategoriaRequest $request, Categoria $categoria): JsonResponse
    {
        $categoria->update($request->validated());

        return $this->success(
            new CategoriaResource($categoria->fresh()),
            'Categoría actualizada.'
        );
    }

    public function destroy(Categoria $categoria): JsonResponse
    {
        if ($categoria->productos()->exists()) {
            return $this->error('No se puede eliminar: tiene productos asociados.', 422);
        }

        $categoria->delete();

        return $this->success(message: 'Categoría eliminada.');
    }
}
