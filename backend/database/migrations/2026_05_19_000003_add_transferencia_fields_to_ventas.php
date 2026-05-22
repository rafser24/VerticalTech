<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Agrega columnas necesarias para el flujo de transferencias pendientes:
 * - referencia_transferencia : número de referencia / comprobante bancario
 * - cliente_nombre_manual    : nombre escrito a mano cuando no hay cliente registrado
 *
 * También extiende el CHECK de estado para incluir 'anulada' (el controller
 * ya la usaba pero no estaba en la restricción).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ventas', function (Blueprint $table) {
            $table->string('referencia_transferencia', 120)->nullable()->after('notas');
            $table->string('cliente_nombre_manual', 120)->nullable()->after('cliente_id');
        });

        // En PostgreSQL el enum se implementa como CHECK CONSTRAINT.
        // Eliminamos el viejo y creamos uno nuevo que incluye 'anulada'.
        DB::statement("ALTER TABLE ventas DROP CONSTRAINT IF EXISTS ventas_estado_check");
        DB::statement("ALTER TABLE ventas ADD CONSTRAINT ventas_estado_check
            CHECK (estado IN ('pendiente','completada','cancelada','anulada'))");
    }

    public function down(): void
    {
        Schema::table('ventas', function (Blueprint $table) {
            $table->dropColumn(['referencia_transferencia', 'cliente_nombre_manual']);
        });

        DB::statement("ALTER TABLE ventas DROP CONSTRAINT IF EXISTS ventas_estado_check");
        DB::statement("ALTER TABLE ventas ADD CONSTRAINT ventas_estado_check
            CHECK (estado IN ('pendiente','completada','cancelada'))");
    }
};
