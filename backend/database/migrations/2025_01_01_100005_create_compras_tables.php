<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('compras', function (Blueprint $table) {
            $table->id();
            $table->string('numero_compra', 30)->unique();
            $table->foreignId('proveedor_id')
                ->constrained('proveedores')
                ->restrictOnDelete();
            $table->foreignId('metodo_pago_id')
                ->constrained('metodo_pago')
                ->restrictOnDelete();
            $table->foreignId('usuario_id')
                ->constrained('usuarios')
                ->restrictOnDelete();
            $table->decimal('subtotal', 12, 2)->default(0.00);
            $table->decimal('impuesto', 12, 2)->default(0.00);
            $table->decimal('descuento', 12, 2)->default(0.00);
            $table->decimal('total', 12, 2)->default(0.00);
            $table->enum('estado', ['pendiente', 'completada', 'cancelada'])->default('pendiente');
            $table->text('notas')->nullable();
            $table->timestamp('fecha_compra')->useCurrent();
            $table->timestamps();
            $table->softDeletes();

            $table->index('numero_compra');
            $table->index('estado');
            $table->index('fecha_compra');
            $table->index('proveedor_id');
        });

        Schema::create('detalle_compra', function (Blueprint $table) {
            $table->id();
            $table->foreignId('compra_id')
                ->constrained('compras')
                ->cascadeOnDelete();
            $table->foreignId('producto_id')
                ->constrained('productos')
                ->restrictOnDelete();
            $table->integer('cantidad');
            $table->decimal('precio_unitario', 12, 2);
            $table->decimal('descuento', 12, 2)->default(0.00);
            $table->decimal('subtotal', 12, 2)
                ->storedAs('(cantidad * precio_unitario) - descuento');
            $table->timestamps();

            $table->index('compra_id');
            $table->index('producto_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('detalle_compra');
        Schema::dropIfExists('compras');
    }
};
