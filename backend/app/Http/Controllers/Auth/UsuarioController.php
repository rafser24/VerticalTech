<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Usuarios\UsuarioRequest;
use App\Http\Resources\UsuarioResource;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UsuarioController extends Controller
{
    /**
     * GET /api/usuarios
     */
    public function index(Request $request): JsonResponse
    {
        $query = Usuario::with([])
            ->when($request->search, fn($q, $s) =>
                $q->where(fn($q) =>
                    $q->where('nombre', 'ilike', "%{$s}%")
                      ->orWhere('apellido', 'ilike', "%{$s}%")
                      ->orWhere('usuario', 'ilike', "%{$s}%")
                      ->orWhere('email', 'ilike', "%{$s}%")
                )
            )
            ->when($request->filled('activo'), fn($q) =>
                $q->where('activo', filter_var($request->activo, FILTER_VALIDATE_BOOLEAN))
            )
            ->when($request->rol, fn($q, $r) =>
                $q->role($r)
            )
            ->orderBy($request->get('sort', 'nombre'), $request->get('dir', 'asc'));

        $resultado = $request->filled('per_page')
            ? $query->paginate((int) $request->per_page)
            : $query->get();

        return response()->json([
            'status' => true,
            'data'   => UsuarioResource::collection($resultado),
            'meta'   => $this->paginationMeta($resultado),
        ]);
    }

    /**
     * POST /api/usuarios
     */
    public function store(UsuarioRequest $request): JsonResponse
    {
        $data = $request->validated();
        $role = $data['role'];
        unset($data['role']);

        $usuario = Usuario::create($data);
        $usuario->assignRole($role);

        return response()->json([
            'status'  => true,
            'message' => 'Usuario creado exitosamente.',
            'data'    => new UsuarioResource($usuario),
        ], 201);
    }

    /**
     * GET /api/usuarios/{usuario}
     */
    public function show(Usuario $usuario): JsonResponse
    {
        return response()->json([
            'status' => true,
            'data'   => new UsuarioResource($usuario),
        ]);
    }

    /**
     * PUT /api/usuarios/{usuario}
     */
    public function update(UsuarioRequest $request, Usuario $usuario): JsonResponse
    {
        $data = collect($request->validated())
            ->when(
                empty($data['contrasena'] ?? null),
                fn($c) => $c->forget('contrasena')
            )
            ->toArray();

        $role = $data['role'] ?? null;
        unset($data['role']);

        $usuario->update($data);

        if ($role) {
            $usuario->syncRoles([$role]);
        }

        return response()->json([
            'status'  => true,
            'message' => 'Usuario actualizado.',
            'data'    => new UsuarioResource($usuario->fresh()),
        ]);
    }

    /**
     * DELETE /api/usuarios/{usuario}
     */
    public function destroy(Usuario $usuario): JsonResponse
    {
        if ($usuario->id === auth('api')->id()) {
            return response()->json([
                'status'  => false,
                'message' => 'No puede eliminar su propio usuario.',
            ], 422);
        }

        $usuario->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Usuario eliminado.',
        ]);
    }

    /**
     * PATCH /api/usuarios/{usuario}/toggle-activo
     */
    public function toggleActivo(Usuario $usuario): JsonResponse
    {
        $usuario->update(['activo' => ! $usuario->activo]);

        return response()->json([
            'status'  => true,
            'message' => 'Estado actualizado.',
            'activo'  => $usuario->activo,
        ]);
    }

    protected function paginationMeta($resultado): ?array
    {
        if (! method_exists($resultado, 'lastPage')) {
            return null;
        }
        return [
            'total'        => $resultado->total(),
            'per_page'     => $resultado->perPage(),
            'current_page' => $resultado->currentPage(),
            'last_page'    => $resultado->lastPage(),
        ];
    }
}
