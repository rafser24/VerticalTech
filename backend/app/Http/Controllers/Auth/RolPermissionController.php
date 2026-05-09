<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Http\JsonResponse;

class RolPermissionController extends Controller
{
    /**
     * Listar todos los permisos disponibles
     */
    public function ListPermission(): JsonResponse
    {
        $permissions = Permission::all();
        return response()->json([
            'status' => true,
            'data' => $permissions
        ]);
    }

    /**
     * Listar todos los roles con sus permisos
     */
    public function ListRole(): JsonResponse
    {
        $roles = Role::with('permissions')->get();
        return response()->json([
            'status' => true,
            'data' => $roles
        ]);
    }

    /**
     * Crear un nuevo permiso
     */
    public function createPermission(Request $request): JsonResponse
    {
        $request->validate(['name' => 'required|unique:permissions,name']);

        $permission = Permission::create(['name' => $request->name, 'guard_name' => 'api']);

        return response()->json([
            'status' => true,
            'message' => 'Permiso creado correctamente',
            'data' => $permission
        ], 201);
    }

    /**
     * Crear un nuevo rol
     */
    public function createRol(Request $request): JsonResponse
    {
        $request->validate(['name' => 'required|unique:roles,name']);

        $role = Role::create(['name' => $request->name, 'guard_name' => 'api']);

        return response()->json([
            'status' => true,
            'message' => 'Rol creado correctamente',
            'data' => $role
        ], 201);
    }

    /**
     * Eliminar un rol por ID
     */
    public function eliminarRol($id): JsonResponse
    {
        $role = Role::findById($id, 'api');
        $role->delete();

        return response()->json([
            'status' => true,
            'message' => 'Rol eliminado correctamente'
        ]);
    }

    /**
     * Eliminar un permiso (recibiendo el nombre o ID)
     */
    public function eliminarPermisos(Request $request): JsonResponse
    {
        $request->validate(['name' => 'required']);
        $permission = Permission::findByName($request->name, 'api');
        $permission->delete();

        return response()->json([
            'status' => true,
            'message' => 'Permiso eliminado correctamente'
        ]);
    }
}
