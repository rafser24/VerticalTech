<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Tareas programadas del sistema
|--------------------------------------------------------------------------
|
| Estas tareas se ejecutan automáticamente si el Scheduler de Laravel
| está activo. En producción, agregar al crontab del servidor:
|
|   * * * * * cd /ruta/proyecto && php artisan schedule:run >> /dev/null 2>&1
|
*/

// Limpieza de auditoría: cada domingo a medianoche.
// Modelos normales: 90 días | Modelos críticos (Venta, Compra, Usuario): 180 días.
// El valor AUDITORIA_RETENER_DIAS en .env controla los días base.
Schedule::command('auditoria:limpiar')
    ->weekly()
    ->sundays()
    ->at('00:05')
    ->withoutOverlapping()
    ->runInBackground()
    ->onSuccess(function () {
        \Illuminate\Support\Facades\Log::info('[Scheduler] Limpieza de auditoría completada.');
    })
    ->onFailure(function () {
        \Illuminate\Support\Facades\Log::error('[Scheduler] Falló la limpieza de auditoría.');
    });
