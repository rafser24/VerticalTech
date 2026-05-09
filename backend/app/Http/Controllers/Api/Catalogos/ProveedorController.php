<?php

namespace App\Http\Controllers\Api\Catalogos;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalogos\ProveedorRequest;
use App\Http\Resources\Catalogos\ProveedorResource;
use App\Models\Catalogos\Proveedor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProveedorController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Proveedor::query()
            ->when($request->search, fn($q, $s) =>
                $q->where(fn($q) =>
                    $q->where('nombre', 'ilike', "%{$s}%")
                      ->orWhere('nit', 'ilike', "%{$s}%")
                      ->orWhere('email', 'ilike', "%{$s}%")
                      ->orWhere('contacto', 'ilike', "%{$s}%")
                )
            )
            ->when($request->filled('activo'), fn($q) =>
                $q->where('activo', filter_var($request->activo, FILTER_VALIDATE_BOOLEAN))
            )
            ->orderBy($request->get('sort', 'nombre'), $request->get('dir', 'asc'));

        $resultado = $request->filled('per_page')
            ? $query->paginate((int) $request->per_page)
            : $query->get();

        return $this->success(
            ProveedorResource::collection($resultado),
            'OK', 200,
            $this->paginationMeta($resultado)
        );
    }

    public function store(ProveedorRequest $request): JsonResponse
    {
        $proveedor = Proveedor::create($request->validated());

        return $this->success(new ProveedorResource($proveedor), 'Proveedor creado.', 201);
    }

    public function show(Proveedor $proveedor): JsonResponse
    {
        return $this->success(new ProveedorResource($proveedor));
    }

    public function update(ProveedorRequest $request, Proveedor $proveedor): JsonResponse
    {
        $proveedor->update($request->validated());

        return $this->success(new ProveedorResource($proveedor->fresh()), 'Proveedor actualizado.');
    }

    public function destroy(Proveedor $proveedor): JsonResponse
    {
        if ($proveedor->productos()->exists()) {
            return $this->error('No se puede eliminar: tiene productos asociados.', 422);
        }

        if ($proveedor->compras()->exists()) {
            return $this->error('No se puede eliminar: tiene compras registradas.', 422);
        }

        $proveedor->delete();

        return $this->success(message: 'Proveedor eliminado.');
    }
}
