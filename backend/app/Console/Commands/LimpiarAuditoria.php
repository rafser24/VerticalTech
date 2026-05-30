<?php

namespace App\Console\Commands;

use App\Models\Logs\AuditoriaLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * LimpiarAuditoria
 *
 * Elimina registros de auditoría más antiguos que AUDITORIA_RETENER_DIAS días.
 * Los modelos críticos (Venta, Compra, Usuario) se retienen el doble de tiempo.
 *
 * Uso manual:
 *   php artisan auditoria:limpiar
 *   php artisan auditoria:limpiar --dias=60
 *   php artisan auditoria:limpiar --dry-run       (solo muestra cuántos borraría)
 */
class LimpiarAuditoria extends Command
{
    protected $signature = 'auditoria:limpiar
                            {--dias= : Días de retención (sobreescribe .env)}
                            {--dry-run : Solo cuenta, no elimina}';

    protected $description = 'Elimina registros de auditoría antiguos según política de retención';

    /**
     * Modelos de alta criticidad: se retienen el DOBLE de días.
     * Modificar aquí si se añaden nuevos modelos importantes.
     */
    private const CRITICOS = ['Venta', 'Compra', 'Usuario'];

    public function handle(): int
    {
        $diasBase   = (int) ($this->option('dias') ?? env('AUDITORIA_RETENER_DIAS', 90));
        $diasCritico = $diasBase * 2;
        $dryRun     = $this->option('dry-run');

        $this->info("Política de retención:");
        $this->line("  ▸ Modelos normales  : {$diasBase} días");
        $this->line("  ▸ Modelos críticos  : {$diasCritico} días (" . implode(', ', self::CRITICOS) . ")");
        $this->line("  ▸ Modo simulación   : " . ($dryRun ? 'SÍ (no elimina)' : 'NO (elimina real)'));
        $this->newLine();

        // ── Registros normales (más viejos que $diasBase días) ──────────────
        $queryNormal = AuditoriaLog::where('created_at', '<', now()->subDays($diasBase))
            ->whereNotIn('modelo', self::CRITICOS);

        $totalNormal = $queryNormal->count();

        // ── Registros críticos (más viejos que $diasCritico días) ───────────
        $queryCritico = AuditoriaLog::where('created_at', '<', now()->subDays($diasCritico))
            ->whereIn('modelo', self::CRITICOS);

        $totalCritico = $queryCritico->count();

        $totalEliminar = $totalNormal + $totalCritico;

        $this->line("Registros a eliminar:");
        $this->line("  ▸ Normales  : {$totalNormal}");
        $this->line("  ▸ Críticos  : {$totalCritico}");
        $this->line("  ▸ Total     : {$totalEliminar}");

        if ($totalEliminar === 0) {
            $this->info('✅ Nada que limpiar — la base de datos está dentro de los límites.');
            return Command::SUCCESS;
        }

        if ($dryRun) {
            $this->warn("🔍 Modo simulación activo — no se eliminó nada.");
            return Command::SUCCESS;
        }

        // ── Eliminar en lotes de 500 para no bloquear la tabla ──────────────
        $eliminados = 0;

        DB::transaction(function () use ($queryNormal, $queryCritico, &$eliminados) {
            $eliminados += $this->eliminarEnLotes($queryNormal->getQuery());
            $eliminados += $this->eliminarEnLotes($queryCritico->getQuery());
        });

        $this->info("✅ Se eliminaron {$eliminados} registros de auditoría.");

        // ── Registrar la propia limpieza en auditoría ────────────────────────
        AuditoriaLog::create([
            'modelo'             => 'Sistema',
            'modelo_id'          => null,
            'accion'             => 'limpieza_auditoria',
            'valores_anteriores' => null,
            'valores_nuevos'     => [
                'eliminados'      => $eliminados,
                'dias_normal'     => (int) env('AUDITORIA_RETENER_DIAS', 90),
                'dias_critico'    => (int) env('AUDITORIA_RETENER_DIAS', 90) * 2,
                'ejecutado_en'    => now()->toDateTimeString(),
            ],
            'usuario_id'         => null,
            'ip'                 => '127.0.0.1',
            'user_agent'         => 'Scheduler/Laravel',
        ]);

        return Command::SUCCESS;
    }

    private function eliminarEnLotes(\Illuminate\Database\Query\Builder $query): int
    {
        $eliminados = 0;
        do {
            $lote = $query->limit(500)->delete();
            $eliminados += $lote;
        } while ($lote > 0);

        return $eliminados;
    }
}
