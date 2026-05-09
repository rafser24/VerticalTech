<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleOrPermissionMiddleware
{
    
    public function handle(Request $request, Closure $next, string ...$rolesOPermisos): Response
    {
        $usuario = auth('api')->user();

        if (! $usuario) {
            return response()->json([
                'status'  => false,
                'message' => 'No autenticado.',
            ], 401);
        }

        if (! $usuario->activo) {
            auth('api')->logout();
            return response()->json([
                'status'  => false,
                'message' => 'Usuario inactivo.',
            ], 403);
        }

        foreach ($rolesOPermisos as $roleOPermiso) {
            if ($usuario->hasRole($roleOPermiso) || $usuario->hasPermissionTo($roleOPermiso)) {
                return $next($request);
            }
        }

        return response()->json([
            'status'  => false,
            'message' => 'Acceso denegado. Permisos insuficientes.',
            'required'=> $rolesOPermisos,
        ], 403);
    }
}
