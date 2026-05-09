<?php

namespace Database\Factories;

use App\Models\Usuario;
use Illuminate\Database\Eloquent\Factories\Factory;

class UsuarioFactory extends Factory
{
    protected $model = Usuario::class;

    public function definition(): array
    {
        return [
            'nombre'    => fake()->firstName(),
            'apellido'  => fake()->lastName(),
            'usuario'   => fake()->unique()->userName(),
            'email'     => fake()->unique()->safeEmail(),
            'contrasena'=> bcrypt('Password123$'),
            'activo'    => true,
        ];
    }

    public function inactivo(): static
    {
        return $this->state(fn(array $attributes) => ['activo' => false]);
    }
}
