<?php

namespace Database\Seeders;

use App\Models\Usuario;
use Illuminate\Database\Seeder;

class UsuarioSeeder extends Seeder
{
    public function run(): void
    {
        $usuarios = [
            [
                'nombre'    => 'Super',
                'apellido'  => 'Admin',
                'usuario'   => 'superadmin',
                'email'     => 'superadmin@sistema.com',
                'contrasena'=> 'Admin123$',
                'activo'    => true,
                'role'      => 'super-admin',
            ],
            [
                'nombre'    => 'Administrador',
                'apellido'  => 'Sistema',
                'usuario'   => 'admin',
                'email'     => 'admin@sistema.com',
                'contrasena'=> 'Admin123$',
                'activo'    => true,
                'role'      => 'admin',
            ],
            [
                'nombre'    => 'Juan',
                'apellido'  => 'Pérez',
                'usuario'   => 'vendedor1',
                'email'     => 'vendedor1@sistema.com',
                'contrasena'=> 'Venta123$',
                'activo'    => true,
                'role'      => 'vendedor',
            ],
            // bodeguero1 y tecnico1 eliminados — roles bodeguero/tecnico ya no existen
        ];

        foreach ($usuarios as $datos) {
            $role = $datos['role'];
            unset($datos['role']);

            $usuario = Usuario::updateOrCreate(
                ['usuario' => $datos['usuario']],
                $datos
            );

            $usuario->syncRoles([$role]);
        }
    }
}
