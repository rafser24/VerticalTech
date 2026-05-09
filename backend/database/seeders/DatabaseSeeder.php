<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,  // 1. Roles y permisos primero
            UsuarioSeeder::class,          // 2. Usuarios con roles asignados
            SistemaVentasSeeder::class,    // 3. Catálogos + datos de demostración
        ]);
    }
}
