<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clientes', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100);
            $table->string('apellido', 100)->nullable();
            $table->string('email', 150)->nullable()->unique();
            $table->string('telefono', 25)->nullable();
            $table->string('direccion', 250)->nullable();
            $table->string('dui', 20)->nullable()->unique();
            $table->string('nit', 50)->nullable()->unique();
            $table->decimal('limite_credito', 12, 2)->default(0.00);
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('activo');
            $table->index('dui');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clientes');
    }
};
