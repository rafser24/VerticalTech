<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Elimina definitivamente cualquier método de pago que no sea
 * Efectivo o Transferencia Bancaria, y asegura que ambos estén activos.
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1. Asegurar que los dos métodos correctos existen y están activos
        DB::table('metodo_pago')->updateOrInsert(
            ['nombre' => 'Efectivo'],
            ['descripcion' => 'Pago en efectivo', 'activo' => true]
        );
        DB::table('metodo_pago')->updateOrInsert(
            ['nombre' => 'Transferencia Bancaria'],
            ['descripcion' => 'Transferencia bancaria / depósito', 'activo' => true]
        );

        // 2. Obtener IDs de ventas que usan métodos que vamos a eliminar
        $idsAEliminar = DB::table('metodo_pago')
            ->whereNotIn('nombre', ['Efectivo', 'Transferencia Bancaria'])
            ->pluck('id');

        if ($idsAEliminar->isNotEmpty()) {
            // Reasignar ventas que usaban esos métodos → Efectivo (como fallback)
            $idEfectivo = DB::table('metodo_pago')->where('nombre', 'Efectivo')->value('id');
            DB::table('ventas')
                ->whereIn('metodo_pago_id', $idsAEliminar)
                ->update(['metodo_pago_id' => $idEfectivo]);
            DB::table('compras')
                ->whereIn('metodo_pago_id', $idsAEliminar)
                ->update(['metodo_pago_id' => $idEfectivo]);

            // 3. Eliminar los métodos sobrantes
            DB::table('metodo_pago')
                ->whereIn('id', $idsAEliminar)
                ->delete();
        }
    }

    public function down(): void
    {
        // No restaurar — la eliminación es intencional
    }
};
