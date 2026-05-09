<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proveedores', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 120);
            $table->string('razon_social', 200)->nullable();
            $table->string('nit', 50)->nullable()->unique();
            $table->string('email', 150)->nullable();
            $table->string('telefono', 25)->nullable();
            $table->string('direccion', 250)->nullable();
            $table->string('contacto', 100)->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('activo');
            $table->index('nit');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proveedores');
    }
};
