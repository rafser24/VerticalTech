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
            [
                'nombre'    => 'María',
                'apellido'  => 'García',
                'usuario'   => 'bodeguero1',
                'email'     => 'bodeguero1@sistema.com',
                'contrasena'=> 'Bode123$!',
                'activo'    => true,
                'role'      => 'bodeguero',
            ],
            [
                'nombre'    => 'Carlos',
                'apellido'  => 'López',
                'usuario'   => 'tecnico1',
                'email'     => 'tecnico1@sistema.com',
                'contrasena'=> 'Tec1123$!',
                'activo'    => true,
                'role'      => 'tecnico',
            ],
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
