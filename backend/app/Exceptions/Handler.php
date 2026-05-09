<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Exceptions\UnauthorizedException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;

class Handler extends ExceptionHandler
{
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
        'contrasena',
    ];

    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render todas las excepciones como JSON para la API.
     */
    public function render($request, Throwable $e): JsonResponse|\Symfony\Component\HttpFoundation\Response
    {
        // Siempre JSON para rutas /api
        if ($request->is('api/*') || $request->expectsJson()) {
            return $this->renderApiException($e);
        }

        return parent::render($request, $e);
    }

    private function renderApiException(Throwable $e): JsonResponse
    {
        // ── JWT ──────────────────────────────────────
        if ($e instanceof TokenExpiredException) {
            return $this->error('Token expirado.', 401, 'token_expired');
        }

        if ($e instanceof TokenInvalidException) {
            return $this->error('Token inválido.', 401, 'token_invalid');
        }

        if ($e instanceof JWTException) {
            return $this->error('Token ausente o malformado.', 401, 'token_missing');
        }

        // ── Auth ─────────────────────────────────────
        if ($e instanceof AuthenticationException) {
            return $this->error('No autenticado.', 401, 'unauthenticated');
        }

        // ── Autorización Spatie ───────────────────────
        if ($e instanceof UnauthorizedException) {
            return $this->error('Acceso denegado. Permisos insuficientes.', 403, 'forbidden');
        }

        // ── Validación ───────────────────────────────
        if ($e instanceof ValidationException) {
            return response()->json([
                'status'  => false,
                'message' => 'Error de validación.',
                'errors'  => $e->errors(),
            ], 422);
        }

        // ── Modelo no encontrado ──────────────────────
        if ($e instanceof ModelNotFoundException) {
            $model = class_basename($e->getModel());
            return $this->error("Recurso {$model} no encontrado.", 404, 'not_found');
        }

        if ($e instanceof NotFoundHttpException) {
            return $this->error('Ruta no encontrada.', 404, 'route_not_found');
        }

        // ── HTTP genérico ─────────────────────────────
        if ($e instanceof HttpException) {
            return $this->error($e->getMessage() ?: 'Error HTTP.', $e->getStatusCode());
        }

        // ── Error interno ─────────────────────────────
        $debug = config('app.debug');
        return response()->json([
            'status'  => false,
            'message' => 'Error interno del servidor.',
            'error'   => $debug ? $e->getMessage() : 'Contacte al administrador.',
            'trace'   => $debug ? array_slice($e->getTrace(), 0, 5) : null,
        ], 500);
    }

    private function error(string $message, int $status, string $code = 'error'): JsonResponse
    {
        return response()->json([
            'status'  => false,
            'code'    => $code,
            'message' => $message,
        ], $status);
    }
}
