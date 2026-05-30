<?php

namespace App\Traits;

use App\Models\Logs\AuditoriaLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

/**
 * Trait Auditable
 *
 * Registra automáticamente create / update / delete en auditoria_logs.
 *
 * Estrategias de reducción de volumen:
 *  1. UPDATED DIFERENCIAL: solo guarda los campos que cambiaron, no el registro completo.
 *  2. MODELOS DE BAJO VALOR: Categoria y MetodoPago no generan log en updates.
 *  3. CAMPOS SENSIBLES: password, remember_token y updated_at nunca se persisten.
 *  4. LOGS VACÍOS: si no quedan campos relevantes, no se crea el registro.
 */
trait Auditable
{
    public static function bootAuditable(): void
    {
        // Modelos donde los updates no tienen valor de auditoría
        $soloCreatedDeleted = ['Categoria', 'MetodoPago', 'ConfiguracionEmpresa'];

        // Campos que NUNCA se guardan en el log
        $camposOcultos = ['password', 'remember_token', 'updated_at', 'user_agent'];

        static::created(function ($model) use ($camposOcultos) {
            if ($model->auditExcluido ?? false) return;
            self::registrarLog($model, 'created', [], $model->toArray(), $camposOcultos);
        });

        static::updated(function ($model) use ($soloCreatedDeleted, $camposOcultos) {
            if ($model->auditExcluido ?? false) return;

            // Para modelos de bajo impacto, omitir updates
            if (in_array(class_basename($model), $soloCreatedDeleted, true)) return;

            // Solo los campos que cambiaron (diferencial)
            $cambios = $model->getChanges();
            if (empty($cambios)) return;

            $original = array_intersect_key($model->getOriginal(), $cambios);
            self::registrarLog($model, 'updated', $original, $cambios, $camposOcultos);
        });

        static::deleted(function ($model) use ($camposOcultos) {
            if ($model->auditExcluido ?? false) return;
            self::registrarLog($model, 'deleted', $model->toArray(), [], $camposOcultos);
        });
    }

    private static function registrarLog(
        $model,
        string $accion,
        array $anterior,
        array $nuevo,
        array $camposOcultos = []
    ): void {
        try {
            $hidden  = array_merge($model->getHidden(), $camposOcultos);
            $limpiar = fn(array $data) => array_diff_key($data, array_flip($hidden));

            $anteriorLimpio = $limpiar($anterior) ?: null;
            $nuevoLimpio    = $limpiar($nuevo)    ?: null;

            // No crear log vacío
            if ($accion === 'updated' && $anteriorLimpio === null && $nuevoLimpio === null) {
                return;
            }

            AuditoriaLog::create([
                'modelo'             => class_basename($model),
                'modelo_id'          => $model->getKey(),
                'accion'             => $accion,
                'valores_anteriores' => $anteriorLimpio,
                'valores_nuevos'     => $nuevoLimpio,
                'usuario_id'         => Auth::guard('api')->id(),
                'ip'                 => Request::ip(),
                'user_agent'         => Request::userAgent(),
            ]);
        } catch (\Throwable) {
            // No bloquear la operación principal si falla la auditoría
        }
    }
}
