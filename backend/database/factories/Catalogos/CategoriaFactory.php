<?php

namespace Database\Factories\Catalogos;

use App\Models\Catalogos\Categoria;
use Illuminate\Database\Eloquent\Factories\Factory;

class CategoriaFactory extends Factory
{
    protected $model = Categoria::class;

    public function definition(): array
    {
        return [
            'nombre'      => fake()->unique()->words(2, true),
            'descripcion' => fake()->sentence(),
            'activo'      => true,
        ];
    }
}
