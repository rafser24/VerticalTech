<?php

use App\Http\Controllers\Api\Auditoria\AuditoriaController;
use App\Http\Controllers\Api\Catalogos\CategoriaController;
use App\Http\Controllers\Api\Catalogos\ClienteController;
use App\Http\Controllers\Api\Catalogos\MetodoPagoController;
use App\Http\Controllers\Api\Catalogos\ProductoController;
use App\Http\Controllers\Api\Catalogos\PromocionController;
use App\Http\Controllers\Api\Catalogos\ProveedorController;
use App\Http\Controllers\Api\Compras\CompraController;
use App\Http\Controllers\Api\Dashboard\DashboardController;
use App\Http\Controllers\Api\Ventas\VentaController;
use App\Http\Controllers\Auth\AuthenticationController;
use App\Http\Controllers\Auth\RolPermissionController;
use App\Http\Controllers\Auth\UserController;
use Illuminate\Support\Facades\Route;
use Spatie\Permission\Middleware\RoleMiddleware;

/*
|--------------------------------------------------------------------------
| API Routes — Sistema de Ventas POS
|--------------------------------------------------------------------------
|
| Autenticación: JWT — campo 'usuario' + 'password' (NO email).
| Guard: api → driver jwt → provier usuarios → model App\Models\Usuario
|
| Formato de respuesta estándar (Trait ApiResponse):
|   { "status": true, "message": "...", "data": {...}, "pagination": {...} }
|
*/

// ═══════════════════════════════════════════════════════════════════════════════
//  AUTENTICACIÓN — Rutas públicas (sin token)
// ═══════════════════════════════════════════════════════════════════════════════
Route::prefix('auth')->group(function () {
    // POST { "usuario": "admin", "password": "Admin123$" }
    Route::post('/login',          [AuthenticationController::class, 'login']);
    Route::post('/valiate-token', [AuthenticationController::class, 'valiatedToken']);

    Route::middleware(['auth:api', 'role:super-admin|admin'])->group(function () {
        Route::post('/logout',  [AuthenticationController::class, 'logout']);
        Route::post('/refresh', [AuthenticationController::class, 'refresh']);
        Route::get('/me',       [AuthenticationController::class, 'me']);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  RUTAS PROTEGiAS — Requieren Bearer token válio
// ═══════════════════════════════════════════════════════════════════════════════
// ── Dashboard — accesible para todos los roles autenticados ─────────────
// Estos endpoints alimentan tanto DashboardPage como ReportsPage
Route::prefix('dashboard')->group(function () {
    // Stats para DashboardPage.jsx → GET /api/dashboard/stats
    Route::get('/stats',                  [DashboardController::class, 'stats']);

    // Resumen con filtro mes/año para ReportsPage → GET /api/dashboard/resumen
    Route::get('/resumen',                [DashboardController::class, 'resumen']);

    // Gráfico 12 meses → GET /api/dashboard/ventas-por-periodo
    Route::get('/ventas-por-periodo',     [DashboardController::class, 'ventasPorPeriodo']);

    // Top productos → GET /api/dashboard/productos-mas-vendios?mes=5&anio=2026
    Route::get('/productos-mas-vendios', [DashboardController::class, 'productosMasVendios']);

    // Top clientes → GET /api/dashboard/top-clientes?mes=5&anio=2026
    Route::get('/top-clientes',           [DashboardController::class, 'topClientes']);

    // Alerta stock → GET /api/dashboard/stock-bajo
    Route::get('/stock-bajo',             [DashboardController::class, 'stockBajo']);

    // Reportes detallados (solo admin) → GET /api/dashboard/reporte-ventas?mes=5&anio=2026
    Route::get('/reporte-ventas',  [DashboardController::class, 'reporteVentas'])
        ->middleware('role:super-admin|admin');

    Route::get('/reporte-compras', [DashboardController::class, 'reporteCompras'])
        ->middleware('role:super-admin|admin|bodeguero');
});


// ── Usuarios (solo admin) ───────────────────────────────────────────────
// Nota: las rutas estáticas DEBEN ir antes que las dinámicas {i}
Route::prefix('users')->middleware(['auth:api', 'role:super-admin|admin'])->group(function () {
        Route::get('/',                                  [UserController::class, 'index']);
        Route::post('/',                                 [UserController::class, 'createUser']);
        Route::put('/{i}',                              [UserController::class, 'update']);
        Route::delete('/{i}',                           [UserController::class, 'destroy']);
        Route::patch('/{i}/toggle',                     [UserController::class, 'toggleActivo']);

        // Solo super-admin puede gestionar roles y permisos indiviuales
        Route::post('/agregar-permisos/{useri}',        [UserController::class, 'AgregarPermisoUsuario'])
            ->middleware('role:super-admin');

        Route::post('/revocar-permisos/{useri}',        [UserController::class, 'RevocarPermisoUsuario'])
            ->middleware('role:super-admin');

        Route::post('/asignar-rol/{useri}',             [UserController::class, 'AsignarRolUsuario'])
            ->middleware('role:super-admin');

        Route::post('/revocar-rol/{useri}',             [UserController::class, 'RevocarRolUsuario'])
            ->middleware('role:super-admin');
    });

    // ── Roles y permisos (solo super-admin) ────────────────────────────────
    Route::prefix('rol-permisos')->middleware('role:super-admin')->group(function () {
        Route::get('/lista-permisos',      [RolPermissionController::class, 'ListPermission']);
        Route::get('/lista-roles',         [RolPermissionController::class, 'ListRole']);
        Route::post('/create-permission',  [RolPermissionController::class, 'createPermission']);
        Route::post('/create-rol',         [RolPermissionController::class, 'createRol']);
        Route::delete('/eliminar-rol/{i}', [RolPermissionController::class, 'eliminarRol']);
        Route::delete('/eliminar-permiso', [RolPermissionController::class, 'eliminarPermisos']);
    });

    // ── Clientes ────────────────────────────────────────────────────────────
    Route::prefix('clientes')->group(function () {
        Route::get('/',              [ClienteController::class, 'index'])
            ->middleware('role:super-admin|admin|vendedor');

        Route::post('/',             [ClienteController::class, 'store'])
            ->middleware('role:super-admin|admin|vendedor');

        Route::get('/{clientes}',          [ClienteController::class, 'show'])
            ->middleware('role:super-admin|admin|vendedor');

        Route::put('/{clientes}',          [ClienteController::class, 'update'])
            ->middleware('role:super-admin|admin');

        Route::patch('/{clientes}/toggle', [ClienteController::class, 'toggleActivo'])
            ->middleware('role:super-admin|admin');
    });

    // ── Proveedores ─────────────────────────────────────────────────────────
    Route::prefix('proveedores')->group(function () {
        Route::get('/',              [ProveedorController::class, 'index'])
            ->middleware('role:super-admin|admin|bodeguero');

        Route::post('/',             [ProveedorController::class, 'store'])
            ->middleware('role:super-admin|admin');

        Route::get('/{proveedor}',          [ProveedorController::class, 'show'])
            ->middleware('role:super-admin|admin|bodeguero');

        Route::put('/{proveedor}',          [ProveedorController::class, 'update'])
            ->middleware('role:super-admin|admin');

        Route::patch('/{proveedor}/toggle', [ProveedorController::class, 'toggleActivo'])
            ->middleware('role:super-admin|admin');
    });

    // ── Categorías ──────────────────────────────────────────────────────────
    Route::prefix('categorias')->group(function () {
        Route::get('/',              [CategoriaController::class, 'index'])
            ->middleware('role:super-admin|admin|vendedor|bodeguero');

        Route::post('/',             [CategoriaController::class, 'store'])
            ->middleware('role:super-admin|admin');

        Route::get('/{categoria}',          [CategoriaController::class, 'show'])
            ->middleware('role:super-admin|admin');

        Route::put('/{categoria}',          [CategoriaController::class, 'update'])
            ->middleware('role:super-admin|admin');

        Route::patch('/{categoria}/toggle', [CategoriaController::class, 'toggleActivo'])
            ->middleware('role:super-admin|admin');
    });

    // ── Métodos de pago ─────────────────────────────────────────────────────
    Route::prefix('metodos-pago')->group(function () {
        Route::get('/',              [MetodoPagoController::class, 'index'])
            ->middleware('role:super-admin|admin|vendedor');

        Route::post('/',             [MetodoPagoController::class, 'store'])
            ->middleware('role:super-admin|admin');

        Route::put('/{i}',          [MetodoPagoController::class, 'update'])
            ->middleware('role:super-admin|admin');

        Route::patch('/{i}/toggle', [MetodoPagoController::class, 'toggleActivo'])
            ->middleware('role:super-admin|admin');
    });

    // ── Productos ───────────────────────────────────────────────────────────
    Route::prefix('productos')->group(function () {
        // stock-bajo va ANTES de /{i} para evitar conflicto de rutas
        Route::get('/stock-bajo',    [ProductoController::class, 'stockBajo'])
            ->middleware('role:super-admin|admin|bodeguero');

        Route::get('/',              [ProductoController::class, 'index'])
            ->middleware('role:super-admin|admin|vendedor|bodeguero|tecnico');

        Route::post('/',             [ProductoController::class, 'store'])
            ->middleware('role:super-admin|admin|bodeguero');

        Route::get('/{i}',          [ProductoController::class, 'show'])
            ->middleware('role:super-admin|admin|vendedor|bodeguero|tecnico');

        Route::put('/{i}',          [ProductoController::class, 'update'])
            ->middleware('role:super-admin|admin|bodeguero');

        Route::patch('/{i}/toggle', [ProductoController::class, 'toggleActivo'])
            ->middleware('role:super-admin|admin');
    });

    // ── Ventas ──────────────────────────────────────────────────────────────
    Route::prefix('ventas')->group(function () {
        Route::get('/',              [VentaController::class, 'index'])
            ->middleware('role:super-admin|admin|vendedor');

        Route::post('/',             [VentaController::class, 'store'])
            ->middleware('role:super-admin|admin|vendedor');

        Route::get('/{i}',          [VentaController::class, 'show'])
            ->middleware('role:super-admin|admin|vendedor');

        Route::patch('/{i}/anular', [VentaController::class, 'anular'])
            ->middleware('role:super-admin|admin');
    });
    // ── Compras ─────────────────────────────────────────────────────────────
    Route::prefix('compras')->group(function () {
        Route::get('/',              [CompraController::class, 'index'])
            ->middleware('role:super-admin|admin|bodeguero');

        Route::post('/',             [CompraController::class, 'store'])
            ->middleware('role:super-admin|admin|bodeguero');

        Route::get('/{i}',          [CompraController::class, 'show'])
            ->middleware('role:super-admin|admin|bodeguero');

        Route::patch('/{i}/anular', [CompraController::class, 'anular'])
            ->middleware('role:super-admin|admin');
    });

    // ── Auditoría (solo admin) ──────────────────────────────────────────────
    Route::prefix('auditoria')->middleware('role:super-admin|admin')->group(function () {
        Route::get('/',     [AuditoriaController::class, 'index']);
        Route::get('/{i}', [AuditoriaController::class, 'show']);
    });

    // ── Promociones (solo super-admin | admin) ─────────────────────────────
    Route::prefix('promociones')->middleware('role:super-admin|admin')->group(function () {
        Route::get('/',                     [PromocionController::class, 'index']);
        Route::post('/',                    [PromocionController::class, 'store']);
        Route::get('/{promocion}',          [PromocionController::class, 'show']);
        Route::put('/{promocion}',          [PromocionController::class, 'update']);
        Route::delete('/{promocion}',       [PromocionController::class, 'destroy']);
        Route::patch('/{promocion}/toggle', [PromocionController::class, 'toggleActivo']);
    });