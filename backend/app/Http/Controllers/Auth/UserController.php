<?php

namespace App\Http\Controllers\Auth;

use App\Http\Requests\RolesOrPermission\AsignarRolUsuarioRequest;
use App\Http\Controllers\Controller;
use App\Http\Requests\Usuarios\UsuarioCreateRequest;
use App\Http\Requests\Usuarios\UsuarioUpdateRequest;
use App\Http\Requests\RolesOrPermission\AsignarPermisosUsuarioRequest;
use App\Http\Requests\RolesOrPermission\RevocarPermisoUsuarioRequest;
use App\Http\Requests\RolesOrPermission\RevocarRolUsuarioRequest;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    // ─── GET /api/users ────────────────────────────────────────────────────
    public function index(Request $request)
    {
        try {
            $query = Usuario::with('roles')
                ->when($request->filled('search'), function ($q) use ($request) {
                    $term = $request->search;
                    $q->where(function ($q) use ($term) {
                        $q->where('nombre',  'ilike', "%{$term}%")
                            ->orWhere('apellido', 'ilike', "%{$term}%")
                            ->orWhere('usuario', 'ilike', "%{$term}%")
                            ->orWhere('email', 'ilike', "%{$term}%");
                    });
                })
                ->when($request->filled('rol'), fn($q) => $q->role($request->rol))
                ->when($request->filled('activo'), function ($q) use ($request) {
                    $q->where('activo', filter_var($request->activo, FILTER_VALIDATE_BOOLEAN));
                })
                ->orderBy('id', 'desc');

            $paginated = $query->paginate($request->get('per_page', 15));

            $data = $paginated->map(fn($u) => [
                'id'         => $u->id,
                'id_usuario' => $u->id,
                'nombre'     => $u->nombre,
                'usuario'    => $u->usuario,
                'correo'     => $u->email,
                'rol'        => $u->rol,
                'activo'     => $u->activo,
                'roles'      => $u->roles->pluck('name'),
                'created_at' => $u->created_at,
                'updated_at' => $u->updated_at,
            ]);

            $pagination = [
                'total'       => $paginated->total(),
                'perPage'     => $paginated->perPage(),
                'currentPage' => $paginated->currentPage(),
                'lastPage'    => $paginated->lastPage(),
            ];

            // AQUÍ EL CAMBIO: ($data, $message, $status, $meta)
            return $this->success($data, 'Lista de usuarios', 200, $pagination);
        } catch (\Throwable $th) {
            return $this->error('Error al obtener los usuarios: ' . $th->getMessage());
        }
    }

    // ─── POST /api/users ───────────────────────────────────────────────────
    public function createUser(UsuarioCreateRequest $request)
    {
        DB::beginTransaction();
        try {
            $validated = $request->validated();

            $usuario = Usuario::create([
                'nombre'     => $validated['nombre'],
                'apellido'   => $validated['apellido'],
                'usuario'    => $validated['usuario'],
                'email'      => $validated['correo'] ?? null,
                // El mutador setContrasenaAttribute del modelo ya hace bcrypt()
                // No usar Hash::make() aquí o la contraseña se hashea dos veces
                'contrasena' => $validated['password'],
                'rol'        => $validated['rol'],
                'activo'     => true,
            ]);

            $usuario->syncRoles([$validated['rol']]);

            DB::commit();

            $data = [
                'id'         => $usuario->id,       // <-- CAMBIO
                'id_usuario' => $usuario->id,       // <-- CAMBIO
                'nombre'     => $usuario->nombre,
                'usuario'    => $usuario->usuario,
                'correo'     => $usuario->email,    // <-- CAMBIO
                'rol'        => $usuario->rol,
                'activo'     => $usuario->activo,
            ];

            return $this->success($data, 'Usuario creado correctamente', 201);
        } catch (\Throwable $th) {
            DB::rollBack();
            return $this->error('Error al crear el usuario: ' . $th->getMessage());
        }
    }

    // ─── PUT /api/users/{id} ───────────────────────────────────────────────
    public function update(UsuarioUpdateRequest $request, int $id)
    {
        DB::beginTransaction();
        try {
            $usuario   = Usuario::findOrFail($id);
            $validated = $request->validated();

            // Los admins no pueden editar cuentas Super Admin.
            // Solo otro super-admin puede hacerlo.
            if ($usuario->hasRole('super-admin') && !auth('api')->user()->hasRole('super-admin')) {
                return $this->error('No tienes permiso para editar a un Super Admin.', 403);
            }

            $payload = [
                'nombre'  => $validated['nombre'],
            'apellido'   => $validated['apellido'],
                'usuario' => $validated['usuario'],
                'email'   => $validated['correo'] ?? $usuario->email, // <-- CAMBIO: La llave debe ser 'email'
                'rol'     => $validated['rol'],
                'activo'  => $validated['activo'] ?? $usuario->activo,
            ];

            if (!empty($validated['password'])) {
                // El mutador setContrasenaAttribute ya hace bcrypt()
                // No usar Hash::make() aquí o la contraseña se hashea dos veces
                $payload['contrasena'] = $validated['password'];
            }

            $usuario->update($payload);
            $usuario->syncRoles([$validated['rol']]);

            DB::commit();

            $data = [
                'id'         => $usuario->id,       // <-- CAMBIO: leemos el id
                'id_usuario' => $usuario->id,       // <-- CAMBIO: leemos el id
                'nombre'     => $usuario->nombre,
                'usuario'    => $usuario->usuario,
                'correo'     => $usuario->email,    // <-- CAMBIO: leemos de email, pero lo devolvemos como correo
                'rol'        => $usuario->rol,
                'activo'     => $usuario->activo,
            ];

            return $this->success($data, 'Usuario actualizado correctamente', 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            DB::rollBack();
            return $this->error('Usuario no encontrado', 404);
        } catch (\Throwable $th) {
            DB::rollBack();
            return $this->error('Error al actualizar el usuario: ' . $th->getMessage());
        }
    }

    // ─── DELETE /api/users/{id} ────────────────────────────────────────────
    public function destroy(int $id)
    {
        try {
            $usuario = Usuario::findOrFail($id);

            if ($usuario->id === auth('api')->id()) {
                return $this->error('No puedes eliminar tu propio usuario', 422);
            }

            // Los admins no pueden eliminar cuentas Super Admin.
            if ($usuario->hasRole('super-admin') && !auth('api')->user()->hasRole('super-admin')) {
                return $this->error('No tienes permiso para eliminar a un Super Admin.', 403);
            }

            $usuario->syncRoles([]);
            $usuario->delete();

            return $this->success(null, 'Usuario eliminado correctamente', 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->error('Usuario no encontrado', 404);
        } catch (\Throwable $th) {
            return $this->error('Error al eliminar el usuario: ' . $th->getMessage());
        }
    }

    // ─── PATCH /api/users/{id}/toggle ─────────────────────────────────────
    public function toggleActivo(int $id)
    {
        try {
            $usuario = Usuario::findOrFail($id);

            if ($usuario->id === auth('api')->id()) {
                return $this->error('No puedes desactivar tu propio usuario', 422);
            }

            // Los admins no pueden activar/desactivar cuentas Super Admin.
            if ($usuario->hasRole('super-admin') && !auth('api')->user()->hasRole('super-admin')) {
                return $this->error('No tienes permiso para modificar a un Super Admin.', 403);
            }

            $usuario->update(['activo' => !$usuario->activo]);
            $estado = $usuario->activo ? 'activado' : 'desactivado';

            $data = [
                'id'         => $usuario->id,
                'id_usuario' => $usuario->id,
                'activo'     => $usuario->activo,
            ];

            return $this->success($data, "Usuario {$estado} correctamente", 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->error('Usuario no encontrado', 404);
        } catch (\Throwable $th) {
            return $this->error('Error al cambiar estado: ' . $th->getMessage());
        }
    }

    // ─── POST /api/users/agregar-permisos/{userId} ─────────────────────────
    public function AgregarPermisoUsuario(AsignarPermisosUsuarioRequest $request, int $userId)
    {
        try {
            DB::beginTransaction();
            $validated = $request->validated();
            $usuario   = Usuario::findOrFail($userId);

            foreach ($validated['permisos'] as $permiso) {
                if (!$usuario->hasPermissionTo($permiso)) {
                    $usuario->givePermissionTo($permiso);
                }
            }

            DB::commit();
            return $this->success($usuario->load('permissions'), 'Permisos asignados correctamente', 200);
        } catch (\Throwable $th) {
            DB::rollBack();
            return $this->error('Error al asignar permisos: ' . $th->getMessage());
        }
    }

    // ─── POST /api/users/revocar-permisos/{userId} ─────────────────────────
    public function RevocarPermisoUsuario(RevocarPermisoUsuarioRequest $request, int $userId)
    {
        try {
            DB::beginTransaction();
            $validated = $request->validated();
            $usuario   = Usuario::findOrFail($userId);

            foreach ($validated['permisos'] as $permiso) {
                $usuario->revokePermissionTo($permiso);
            }

            DB::commit();
            return $this->success($usuario, 'Permisos revocados correctamente', 200);
        } catch (\Throwable $th) {
            DB::rollBack();
            return $this->error('Error al revocar permisos: ' . $th->getMessage());
        }
    }

    // ─── POST /api/users/asignar-rol/{userId} ──────────────────────────────
    public function AsignarRolUsuario(AsignarRolUsuarioRequest $request, int $userId)
    {
        try {
            DB::beginTransaction();
            $validated = $request->validated();
            $usuario   = Usuario::findOrFail($userId);
            $usuario->assignRole($validated['rol']);
            DB::commit();
            return $this->success($usuario, 'Rol asignado correctamente', 200);
        } catch (\Throwable $th) {
            DB::rollBack();
            return $this->error('Error al asignar rol: ' . $th->getMessage());
        }
    }

    // ─── POST /api/users/revocar-rol/{userId} ──────────────────────────────
    public function RevocarRolUsuario(RevocarRolUsuarioRequest $request, int $userId)
    {
        try {
            DB::beginTransaction();
            $validated = $request->validated();
            $usuario   = Usuario::findOrFail($userId);
            $usuario->removeRole($validated['rol']);
            DB::commit();
            return $this->success($usuario, 'Rol revocado correctamente', 200);
        } catch (\Throwable $th) {
            DB::rollBack();
            return $this->error('Error al revocar rol: ' . $th->getMessage());
        }
    }
}
