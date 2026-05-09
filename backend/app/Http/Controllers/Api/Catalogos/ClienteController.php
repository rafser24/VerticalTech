<?php

namespace App\Http\Controllers\Api\Catalogos;

use Illuminate\Validation\Rule;
use App\Http\Controllers\Controller;
use App\Http\Requests\Catalogos\ClienteRequest;
use App\Http\Resources\Catalogos\ClienteResource;
use App\Models\Catalogos\Cliente;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClienteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Cliente::query()
            ->when($request->search, fn($q, $s) =>
                $q->where(fn($q) =>
                    $q->where('nombre', 'ilike', "%{$s}%")
                      ->orWhere('apellido', 'ilike', "%{$s}%")
                      ->orWhere('email', 'ilike', "%{$s}%")
                      ->orWhere('dui', 'ilike', "%{$s}%")
                      ->orWhere('telefono', 'ilike', "%{$s}%")
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
            ClienteResource::collection($resultado),
            'OK', 200,
            $this->paginationMeta($resultado)
        );
    }

    public function store(ClienteRequest $request): JsonResponse
    {
        $cliente = Cliente::create($request->validated());

        return $this->success(new ClienteResource($cliente), 'Cliente creado.', 201);
    }

    public function show(Cliente $cliente): JsonResponse
    {
        return $this->success(new ClienteResource($cliente));
    }

    public function update(ClienteRequest $request, $id): JsonResponse
    {
        $cliente = Cliente::findOrFail($id);

        $cliente->update($request->validated());
        
        return $this->success(new ClienteResource($cliente->fresh()), 'Cliente actualizado.');
    }

    public function destroy(Cliente $cliente): JsonResponse
    {
        if ($cliente->ventas()->exists()) {
            return $this->error('No se puede eliminar: tiene ventas registradas.', 422);
        }

        $cliente->delete();

        return $this->success(message: 'Cliente eliminado.');
    }
}
