<?php

use App\Http\Middleware\CacheApiResponse;
use App\Http\Middleware\RoleOrPermissionMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__ . '/../routes/api.php',
        apiPrefix: 'api',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // ── Registrar alias de middleware ──────────────────────
        $middleware->alias([
            'role'               => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission'         => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
            'rolePermission'     => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'cache.api'          => CacheApiResponse::class,
        ]);

        // ── API middleware stack ───────────────────────────────
        // CacheApiResponse solo actúa en GET y respuestas 200,
        // los demás métodos pasan transparentes.
        $middleware->api(append: [
            \Illuminate\Http\Middleware\HandleCors::class,
            CacheApiResponse::class,
        ]);

       
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
     
    })
    ->create();
