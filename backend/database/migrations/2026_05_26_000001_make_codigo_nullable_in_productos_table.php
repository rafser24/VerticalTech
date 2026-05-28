<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * El campo 'codigo' era NOT NULL, lo que impedía crear productos
     * sin ingresar un código manualmente. Se convierte a nullable para
     * que el backend pueda autogenerarlo (PROD-XXXX) cuando no se provea.
     */
    public function up(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            // Solo cambiamos nullability — el índice unique ya existe, no lo tocamos
            $table->string('codigo', 60)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->string('codigo', 60)->nullable(false)->change();
        });
    }
};
