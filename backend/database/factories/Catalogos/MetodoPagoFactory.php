<?php

namespace Database\Factories\Catalogos;

use App\Models\Catalogos\MetodoPago;
use Illuminate\Database\Eloquent\Factories\Factory;

class MetodoPagoFactory extends Factory
{
    protected $model = MetodoPago::class;

    public function definition(): array
    {
        return [
            'nombre'      => fake()->unique()->word(),
            'descripcion' => fake()->sentence(),
            'activo'      => true,
        ];
    }
}
