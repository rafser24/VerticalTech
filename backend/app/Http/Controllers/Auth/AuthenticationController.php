<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\AuthLoginRequest;
use App\Http\Resources\UsuarioResource;
use App\Models\Logs\AuditoriaLog;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\RateLimiter;

class AuthenticationController extends Controller
{
    /**
     * POST /api/auth/login
     */
    public function login(AuthLoginRequest $request): JsonResponse
    {
        $key = 'login:' . $request->ip();

       
        if (RateLimiter::tooManyAttempts($key, (int) config('auth.login_max_attempts', 5))) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'status'  => false,
                'message' => "Demasiados intentos. Intente en {$seconds} segundos.",
            ], 429);
        }

        $credentials = [
            'usuario'  => $request->validated('usuario'),
            'password' => $request->input('password'),
        ];

        if (! $token = auth()->attempt($credentials)) {
            RateLimiter::hit($key, (int) config('auth.login_decay_seconds', 60));

            return response()->json([
                'status'  => false,
                'message' => 'Credenciales inválidas.',
            ], 401);
        }

        /** @var Usuario $usuario */
        $usuario = auth('api')->user();

        
        if (!$usuario->activo) {
            auth('api')->logout(); 
            return response()->json([
                'status'  => false,
                'message' => 'Usuario inactivo. Contacte al administrador.',
            ], 403);
        }

        // 4. Éxito: Limpiar intentos del limitador
        RateLimiter::clear($key);

        // 5. Auditoría de login
        AuditoriaLog::create([
            'modelo'     => 'Usuario',
            'modelo_id'  => $usuario->id,
            'accion'     => 'login',
            'usuario_id' => $usuario->id,
            'ip'         => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        // 6. Responder con token formateado
        return $this->respondWithToken($token, $usuario);
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(): JsonResponse
    {
        $usuario = auth('api')->user();

        if ($usuario) {
            AuditoriaLog::create([
                'modelo'     => 'Usuario',
                'modelo_id'  => $usuario->id,
                'accion'     => 'logout',
                'usuario_id' => $usuario->id,
                'ip'         => request()->ip(),
            ]);
        }
        /** @var \Tymon\JWTAuth\JWTGuard $auth */
        $auth = auth('api');
        $auth->logout();

        return response()->json([
            'status'  => true,
            'message' => 'Sesión cerrada correctamente.',
        ]);
    }

    /**
     * POST /api/auth/refresh
     */
    public function refresh(): JsonResponse
    {
        /** @var \Tymon\JWTAuth\JWTGuard $auth */
        $auth = auth('api');
        $token   = $auth->refresh();
        /** @var Usuario $usuario */
        $usuario = $auth->user();

        return $this->respondWithToken($token, $usuario);
    }

    /**
     * GET /api/auth/me
     */
    public function me(): JsonResponse
    {
        return response()->json([
            'status' => true,
            'data'   => new UsuarioResource(auth('api')->user()),
        ]);
    }

    /**
     * Formatear respuesta de autenticación
     */
    private function respondWithToken(string $token, Usuario $usuario): JsonResponse
    {
        return response()->json([
            'status'       => true,
            'access_token' => $token,
            'token_type'   => 'bearer',
            'expires_in'   => auth('api')->factory()->getTTL() * 60,
            'user'         => new UsuarioResource($usuario),
            'roles'        => $usuario->getRoleNames(),
            'permissions'  => $usuario->getAllPermissions()->pluck('name'),
        ]);
    }
}
