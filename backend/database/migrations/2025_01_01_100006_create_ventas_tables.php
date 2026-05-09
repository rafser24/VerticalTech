<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ventas', function (Blueprint $table) {
            $table->id();
            $table->string('numero_venta', 30)->unique();
            $table->foreignId('cliente_id')
                ->nullable()
                ->constrained('clientes')
                ->nullOnDelete();
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
            $table->enum('estado', ['pendiente', 'completada', 'cancelada'])->default('completada');
            $table->text('notas')->nullable();
            $table->timestamp('fecha_venta')->useCurrent();
            $table->timestamps();
            $table->softDeletes();

            $table->index('numero_venta');
            $table->index('estado');
            $table->index('fecha_venta');
            $table->index('cliente_id');
            $table->index('usuario_id');
        });

        Schema::create('detalle_venta', function (Blueprint $table) {
            $table->id();
            $table->foreignId('venta_id')
                ->constrained('ventas')
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

            $table->index('venta_id');
            $table->index('producto_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('detalle_venta');
        Schema::dropIfExists('ventas');
    }
};
