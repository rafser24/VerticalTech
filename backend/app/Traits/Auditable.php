<?php

namespace App\Traits;

use App\Models\Logs\AuditoriaLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function ($model) {
            self::registrarLog($model, 'created', [], $model->toArray());
        });

        static::updated(function ($model) {
            self::registrarLog(
                $model,
                'updated',
                $model->getOriginal(),
                $model->getChanges()
            );
        });

        static::deleted(function ($model) {
            self::registrarLog($model, 'deleted', $model->toArray(), []);
        });
    }

    private static function registrarLog($model, string $accion, array $anterior, array $nuevo): void
    {
        try {
            $hidden  = $model->getHidden();
            $limpiar = fn(array $data) => array_diff_key($data, array_flip($hidden));

            AuditoriaLog::create([
                'modelo'             => class_basename($model),
                'modelo_id'          => $model->getKey(),
                'accion'             => $accion,
                'valores_anteriores' => $limpiar($anterior) ?: null,
                'valores_nuevos'     => $limpiar($nuevo) ?: null,
                'usuario_id'         => Auth::guard('api')->id(),
                'ip'                 => Request::ip(),
                'user_agent'         => Request::userAgent(),
            ]);
        } catch (\Throwable) {
            // No bloquear la operación principal si falla la auditoría
        }
    }
}
