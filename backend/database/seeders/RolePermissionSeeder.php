<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Resetear cache de Spatie
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // ── Definir todos los permisos ────────────────────────────
        $permisos = [
            // Categorías
            'ver-categorias', 'crear-categorias', 'editar-categorias', 'eliminar-categorias',
            // Proveedores
            'ver-proveedores', 'crear-proveedores', 'editar-proveedores', 'eliminar-proveedores',
            // Clientes
            'ver-clientes', 'crear-clientes', 'editar-clientes', 'eliminar-clientes',
            // Productos
            'ver-productos', 'crear-productos', 'editar-productos', 'eliminar-productos',
            // Ventas
            'ver-ventas', 'crear-ventas', 'cancelar-ventas',
            // Compras
            'ver-compras', 'crear-compras', 'cancelar-compras',
            // Usuarios
            'ver-usuarios', 'crear-usuarios', 'editar-usuarios', 'eliminar-usuarios',
            // Métodos de pago
            'ver-metodos-pago', 'gestionar-metodos-pago',
            // Dashboard
            'ver-dashboard',
            // Auditoría
            'ver-auditoria',
        ];

        foreach ($permisos as $permiso) {
            Permission::firstOrCreate(['name' => $permiso, 'guard_name' => 'api']);
        }

        // ── Crear roles y asignar permisos ────────────────────────

        // Super Admin — acceso total (Spatie lo gestiona con gate)
        $superAdmin = Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'api']);
        $superAdmin->syncPermissions(Permission::where('guard_name', 'api')->get());

        // Admin — todo excepto auditoría detallada
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        $admin->syncPermissions([
            'ver-categorias', 'crear-categorias', 'editar-categorias', 'eliminar-categorias',
            'ver-proveedores', 'crear-proveedores', 'editar-proveedores', 'eliminar-proveedores',
            'ver-clientes', 'crear-clientes', 'editar-clientes', 'eliminar-clientes',
            'ver-productos', 'crear-productos', 'editar-productos', 'eliminar-productos',
            'ver-ventas', 'crear-ventas', 'cancelar-ventas',
            'ver-compras', 'crear-compras', 'cancelar-compras',
            'ver-usuarios', 'crear-usuarios', 'editar-usuarios',
            'ver-metodos-pago', 'gestionar-metodos-pago',
            'ver-dashboard',
        ]);

        // Vendedor — ventas y consultas
        $vendedor = Role::firstOrCreate(['name' => 'vendedor', 'guard_name' => 'api']);
        $vendedor->syncPermissions([
            'ver-categorias',
            'ver-clientes', 'crear-clientes', 'editar-clientes',
            'ver-productos',
            'ver-ventas', 'crear-ventas',
            'ver-metodos-pago',
            'ver-dashboard',
        ]);

        // Bodeguero — inventario y compras
        $bodeguero = Role::firstOrCreate(['name' => 'bodeguero', 'guard_name' => 'api']);
        $bodeguero->syncPermissions([
            'ver-categorias', 'crear-categorias', 'editar-categorias',
            'ver-proveedores', 'crear-proveedores', 'editar-proveedores',
            'ver-productos', 'crear-productos', 'editar-productos',
            'ver-compras', 'crear-compras',
            'ver-metodos-pago',
            'ver-dashboard',
        ]);

        // Técnico — solo lectura
        $tecnico = Role::firstOrCreate(['name' => 'tecnico', 'guard_name' => 'api']);
        $tecnico->syncPermissions([
            'ver-categorias',
            'ver-proveedores',
            'ver-productos',
            'ver-ventas',
            'ver-compras',
            'ver-dashboard',
        ]);
    }
}
