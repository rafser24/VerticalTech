<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware de caché para respuestas GET de la API.
 *
 * ──────────────────────────────────────────────────────────────
 *  CÓMO FUNCIONA
 * ──────────────────────────────────────────────────────────────
 *  1. Solo actúa en peticiones GET con respuesta 200.
 *  2. Extrae el "módulo" de la URL (/api/categorias → "categorias").
 *  3. Construye una clave versionada:
 *       api_resp:{módulo}:v{version}:{hash(URL+params)}
 *  4. Si la clave existe en caché → devuelve la respuesta almacenada
 *     (X-Cache: HIT) sin tocar la base de datos.
 *  5. Si no existe → pasa la petición al siguiente handler, guarda
 *     la respuesta y añade X-Cache: MISS.
 *
 * ──────────────────────────────────────────────────────────────
 *  INVALIDACIÓN AUTOMÁTICA
 * ──────────────────────────────────────────────────────────────
 *  Cuando un Modelo guarda o elimina un registro, el trait
 *  HasApiCache incrementa `cache_ver:{módulo}`.
 *  Al cambiar la versión, todas las claves antiguas quedan
 *  "huérfanas" (nunca se accederán) y expiran por TTL solas.
 *
 * ──────────────────────────────────────────────────────────────
 *  TTL por módulo (segundos)
 * ──────────────────────────────────────────────────────────────
 *  metodos-pago  → 1800 (30 min)  casi nunca cambia
 *  categorias    →  600 (10 min)
 *  proveedores   →  600 (10 min)
 *  promociones   →  300 ( 5 min)
 *  productos     →  300 ( 5 min)
 *  clientes      →  120 ( 2 min)
 *  compras       →  120 ( 2 min)
 *  ventas        →   60 ( 1 min)  POS, alta frecuencia
 *  dashboard     →   60 ( 1 min)
 *  default       →  180 ( 3 min)
 */
class CacheApiResponse
{
    /**
     * Módulos que NO se cachean (datos sensibles o siempre frescos).
     */
    protected array $skipModules = [
        'auth',
        'auditoria',
        'users',
        'rol-permisos',
    ];

    /**
     * TTL en segundos por módulo.
     */
    protected array $ttlMap = [
        'metodos-pago' => 1800,
        'categorias'   => 600,
        'proveedores'  => 600,
        'promociones'  => 300,
        'productos'    => 300,
        'clientes'     => 120,
        'compras'      => 120,
        'ventas'       => 60,
        'dashboard'    => 60,
    ];

    /** TTL por defecto para módulos no listados. */
    protected int $defaultTtl = 180;

    // ─────────────────────────────────────────────────────────────

    public function handle(Request $request, Closure $next): Response
    {
        // 1 ── Solo cachear GET
        if (! $request->isMethod('GET')) {
            return $next($request);
        }

        // 2 ── Extraer módulo de la URL
        $module = $this->extractModule($request->path());

        // 3 ── Saltar módulos excluidos
        if (in_array($module, $this->skipModules, true)) {
            return $next($request);
        }

        // 4 ── TTL para este módulo
        $ttl = $this->ttlMap[$module] ?? $this->defaultTtl;

        // 5 ── Construir clave de caché (versionada)
        $version  = (int) Cache::get("cache_ver:{$module}", 1);
        $urlHash  = hash('sha256', $request->fullUrl());
        $cacheKey = "api_resp:{$module}:v{$version}:{$urlHash}";

        // 6 ── HIT: devolver respuesta guardada
        if (Cache::has($cacheKey)) {
            /** @var array{body: string, status: int, headers: array} $cached */
            $cached = Cache::get($cacheKey);

            return response($cached['body'], $cached['status'])
                ->withHeaders($cached['headers'])
                ->header('Content-Type', 'application/json')
                ->header('X-Cache',        'HIT')
                ->header('X-Cache-Module', $module)
                ->header('X-Cache-TTL',    (string) $ttl);
        }

        // 7 ── MISS: procesar y guardar
        /** @var Response $response */
        $response = $next($request);

        // Solo cachear respuestas 200 OK
        if ($response->getStatusCode() === 200) {
            Cache::put($cacheKey, [
                'body'    => $response->getContent(),
                'status'  => $response->getStatusCode(),
                'headers' => $this->extractHeaders($response),
            ], $ttl);
        }

        return $response
            ->header('X-Cache',        'MISS')
            ->header('X-Cache-Module', $module)
            ->header('X-Cache-TTL',    (string) $ttl);
    }

    // ─────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────

    /**
     * Extrae el nombre del módulo del path de la petición.
     *
     *   "api/categorias/5"       → "categorias"
     *   "api/dashboard/stats"    → "dashboard"
     *   "api/metodos-pago"       → "metodos-pago"
     */
    private function extractModule(string $path): string
    {
        $parts = explode('/', trim($path, '/'));

        // Quitar el prefijo "api" si lo tiene
        if (isset($parts[0]) && $parts[0] === 'api') {
            array_shift($parts);
        }

        return $parts[0] ?? 'unknown';
    }

    /**
     * Extrae solo los headers de contenido (no los de conexión ni cookies).
     */
    private function extractHeaders(Response $response): array
    {
        $keep    = ['content-type', 'x-ratelimit-limit', 'x-ratelimit-remaining'];
        $headers = [];

        foreach ($response->headers->all() as $name => $values) {
            if (in_array(strtolower($name), $keep, true)) {
                $headers[$name] = implode(', ', $values);
            }
        }

        return $headers;
    }
}
