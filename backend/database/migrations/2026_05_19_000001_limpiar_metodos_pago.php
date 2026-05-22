<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Deja solo "Efectivo" y "Transferencia Bancaria" en metodo_pago.
 * Elimina o desactiva cualquier otro método que exista.
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1. Asegurar que Efectivo existe y está activo
        DB::table('metodo_pago')->updateOrInsert(
            ['nombre' => 'Efectivo'],
            ['descripcion' => 'Pago en efectivo', 'activo' => true]
        );

        // 2. Asegurar que Transferencia Bancaria existe y está activo
        DB::table('metodo_pago')->updateOrInsert(
            ['nombre' => 'Transferencia Bancaria'],
            ['descripcion' => 'Transferencia bancaria / depósito', 'activo' => true]
        );

        // 3. Desactivar cualquier otro método de pago que no sea los dos anteriores
        DB::table('metodo_pago')
            ->whereNotIn('nombre', ['Efectivo', 'Transferencia Bancaria'])
            ->update(['activo' => false]);
    }

    public function down(): void
    {
        // Reactivar todos los métodos (rollback conservador)
        DB::table('metodo_pago')->update(['activo' => true]);
    }
};
