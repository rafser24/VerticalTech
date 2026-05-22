<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Eliminar el CHECK constraint viejo PRIMERO
        DB::statement('ALTER TABLE compras DROP CONSTRAINT IF EXISTS compras_estado_check');

        // 2. Ahora sí migrar los valores viejos sin restricción
        DB::statement("UPDATE compras SET estado = 'recibida' WHERE estado = 'completada'");
        DB::statement("UPDATE compras SET estado = 'anulada'  WHERE estado = 'cancelada'");

        // 3. Agregar el nuevo CHECK constraint con los valores correctos
        DB::statement("
            ALTER TABLE compras
            ADD CONSTRAINT compras_estado_check
            CHECK (estado IN ('pendiente','confirmada','recibida','anulada'))
        ");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE compras DROP CONSTRAINT IF EXISTS compras_estado_check');

        DB::statement("UPDATE compras SET estado = 'completada' WHERE estado = 'recibida'");
        DB::statement("UPDATE compras SET estado = 'cancelada'  WHERE estado IN ('anulada','confirmada')");

        DB::statement("
            ALTER TABLE compras
            ADD CONSTRAINT compras_estado_check
            CHECK (estado IN ('pendiente','completada','cancelada'))
        ");
    }
};
