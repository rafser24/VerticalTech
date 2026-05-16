<?php

namespace App\Traits;

use Illuminate\Support\Facades\Cache;

/**
 * Trait HasApiCache
 *
 * Invalida automáticamente el caché de respuestas API cuando
 * el modelo es creado, actualizado, eliminado o restaurado.
 *
 * ──────────────────────────────────────────────────────────────
 *  USO BÁSICO — agregar el trait al modelo:
 * ──────────────────────────────────────────────────────────────
 *
 *   class Categoria extends Model
 *   {
 *       use HasApiCache;
 *       // Por defecto usará $this->getTable() como módulo.
 *   }
 *
 * ──────────────────────────────────────────────────────────────
 *  USO AVANZADO — múltiples módulos a invalidar:
 * ──────────────────────────────────────────────────────────────
 *
 *   class Venta extends Model
 *   {
 *       use HasApiCache;
 *
 *       // Cuando se guarda una venta, también se invalida el
 *       // dashboard (porque sus stats cambian).
 *       protected array $cacheModules = ['ventas', 'dashboard'];
 *   }
 *
 * ──────────────────────────────────────────────────────────────
 *  CÓMO FUNCIONA LA INVALIDACIÓN
 * ──────────────────────────────────────────────────────────────
 *
 *  El middleware CacheApiResponse construye claves como:
 *    api_resp:{módulo}:v{version}:{hash}
 *
 *  Al incrementar `cache_ver:{módulo}`, la versión cambia y
 *  todas las claves antiguas quedan "huérfanas": el middleware
 *  nunca las encontrará porque busca la nueva versión.
 *  Las entradas huérfanas expiran solas por TTL.
 */
trait HasApiCache
{
    /**
     * Laravel llama automáticamente bootNombreTrait() al iniciar el modelo.
     * Registramos los eventos aquí para no tocar el constructor del modelo.
     */
    protected static function bootHasApiCache(): void
    {
        $bumpVersion = static function ($model): void {
            foreach ($model->resolveCacheModules() as $module) {
                // Inicializa en 1 si no existe, luego incrementa.
                if (! Cache::has("cache_ver:{$module}")) {
                    Cache::put("cache_ver:{$module}", 1, now()->addDays(7));
                } else {
                    Cache::increment("cache_ver:{$module}");
                }
            }
        };

        static::saved($bumpVersion);    // cubre created + updated
        static::deleted($bumpVersion);

        // SoftDeletes: también al restaurar un registro eliminado
        if (in_array('Illuminate\Database\Eloquent\SoftDeletes', class_uses_recursive(static::class), true)) {
            static::restored($bumpVersion);
        }
    }

    /**
     * Devuelve la lista de módulos de caché a invalidar.
     *
     * Prioridad:
     *  1. Propiedad $cacheModules definida en el modelo
     *  2. Nombre de la tabla del modelo (ej: "categorias")
     */
    protected function resolveCacheModules(): array
    {
        if (property_exists($this, 'cacheModules') && ! empty($this->cacheModules)) {
            return (array) $this->cacheModules;
        }

        return [$this->getTable()];
    }

    /**
     * Invalida manualmente el caché de un módulo específico.
     * Útil para invalidaciones puntuales desde controladores.
     *
     * Uso: $producto->invalidateCache('productos');
     *      $venta->invalidateCache(['ventas', 'dashboard']);
     */
    public function invalidateCache(string|array $modules): void
    {
        foreach ((array) $modules as $module) {
            if (! Cache::has("cache_ver:{$module}")) {
                Cache::put("cache_ver:{$module}", 1, now()->addDays(7));
            } else {
                Cache::increment("cache_ver:{$module}");
            }
        }
    }
}
