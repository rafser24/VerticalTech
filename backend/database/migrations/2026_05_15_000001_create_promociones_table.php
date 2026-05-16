<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promociones', function (Blueprint $table) {
            $table->id();

            $table->string('nombre', 150);
            $table->text('descripcion')->nullable();

            // 'porcentaje' | 'monto_fijo'
            $table->enum('tipo_descuento', ['porcentaje', 'monto_fijo'])->default('porcentaje');
            $table->decimal('valor_descuento', 12, 2);

            // 'producto' | 'categoria'
            $table->enum('tipo_aplicacion', ['producto', 'categoria']);

            $table->foreignId('producto_id')
                ->nullable()
                ->constrained('productos')
                ->nullOnDelete();

            $table->foreignId('categoria_id')
                ->nullable()
                ->constrained('categorias')
                ->nullOnDelete();

            $table->date('fecha_inicio');
            $table->date('fecha_fin')->nullable();

            $table->boolean('activo')->default(true);

            // Quién creó la promoción
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('usuarios')
                ->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            // Índices útiles
            $table->index('activo');
            $table->index('tipo_aplicacion');
            $table->index('fecha_inicio');
            $table->index('fecha_fin');
            $table->index('producto_id');
            $table->index('categoria_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promociones');
    }
};
