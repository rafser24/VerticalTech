<?php

namespace Database\Factories\Catalogos;

use App\Models\Catalogos\Categoria;
use App\Models\Catalogos\Producto;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductoFactory extends Factory
{
    protected $model = Producto::class;

    public function definition(): array
    {
        $compra = fake()->randomFloat(2, 10, 500);
        return [
            'codigo'        => fake()->unique()->bothify('PRD-###??'),
            'nombre'        => fake()->words(3, true),
            'descripcion'   => fake()->sentence(),
            'precio_compra' => $compra,
            'precio_venta'  => $compra * fake()->randomFloat(2, 1.1, 2.0),
            'stock'         => fake()->numberBetween(0, 200),
            'stock_minimo'  => fake()->numberBetween(1, 10),
            'unidad'        => 'unidad',
            'activo'        => true,
            'categoria_id'  => Categoria::factory(),
        ];
    }

    public function sinStock(): static
    {
        return $this->state(fn(array $attributes) => ['stock' => 0]);
    }
}
