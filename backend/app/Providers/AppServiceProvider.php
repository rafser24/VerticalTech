<?php

namespace App\Providers;

use App\Models\Usuario;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Bind del handler personalizado
        $this->app->singleton(
            \Illuminate\Contracts\Debug\ExceptionHandler::class,
            \App\Exceptions\Handler::class
        );
    }

    public function boot(): void
    {
        // ── Spatie morphMap ─────────────────────────────────────────
        // Evita que Spatie guarde 'App\Models\Usuario' en model_type;
        // usa el alias corto 'usuario' para mayor portabilidad.
        \Spatie\Permission\Models\Role::resolveRelationUsing('permissions', function ($role) {
            return $role->morphToMany(Permission::class, 'model', 'model_has_permissions');
        });

        \Illuminate\Database\Eloquent\Relations\Relation::morphMap([
            'usuario' => Usuario::class,
        ]);

        // ── Rate Limiter global para la API ─────────────────────────
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        // ── Rate Limiter específico del login ───────────────────────
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinutes(
                (int) config('auth.login_decay_minutes', 1),
                (int) config('auth.login_max_attempts', 5)
            )->by($request->ip());
        });
    }
}
