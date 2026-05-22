<?php

namespace Database\Seeders;

use App\Models\Catalogos\Categoria;
use App\Models\Catalogos\Cliente;
use App\Models\Catalogos\MetodoPago;
use App\Models\Catalogos\Producto;
use App\Models\Catalogos\Proveedor;
use App\Models\Compras\Compra;
use App\Models\Ventas\Venta;
use App\Models\Usuario;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SistemaVentasSeeder extends Seeder
{
    public function run(): void
    {
        // ── Métodos de Pago ────────────────────────────────────────
        $metodos = collect([
            ['nombre' => 'Efectivo',              'descripcion' => 'Pago en efectivo'],
          //  ['nombre' => 'Tarjeta de Crédito',    'descripcion' => 'Visa, Mastercard, etc.'],
           // ['nombre' => 'Tarjeta de Débito',     'descripcion' => 'Débito bancario'],
            ['nombre' => 'Transferencia Bancaria','descripcion' => 'ACH / wire transfer'],
          //  ['nombre' => 'Cheque',                'descripcion' => 'Cheque bancario'],
        ])->map(fn($m) => MetodoPago::firstOrCreate(['nombre' => $m['nombre']], $m));

        // ── Categorías ─────────────────────────────────────────────
        $categorias = collect([
            ['nombre' => 'Electrónicos',    'descripcion' => 'Dispositivos electrónicos'],
            ['nombre' => 'Periféricos',     'descripcion' => 'Accesorios para computadora'],
            ['nombre' => 'Redes',           'descripcion' => 'Equipos de conectividad'],
            ['nombre' => 'Almacenamiento',  'descripcion' => 'Discos y memorias'],
            ['nombre' => 'Audio y Video',   'descripcion' => 'Equipos multimedia'],
            ['nombre' => 'Oficina',         'descripcion' => 'Artículos de oficina'],
        ])->map(fn($c) => Categoria::firstOrCreate(['nombre' => $c['nombre']], $c));

        // ── Proveedores ────────────────────────────────────────────
        $proveedores = collect([
            [
                'nombre'       => 'TechDistrib S.A.',
                'razon_social' => 'Tecnología Distribuida S.A. de C.V.',
                'nit'          => '0614-010191-001-0',
                'email'        => 'ventas@techdistrib.com',
                'telefono'     => '2222-3333',
                'contacto'     => 'Carlos López',
            ],
            [
                'nombre'       => 'ElectroParts Corp',
                'razon_social' => 'Electro Parts Corporation',
                'nit'          => '0614-020282-002-1',
                'email'        => 'info@electroparts.com',
                'telefono'     => '2333-4444',
                'contacto'     => 'María Pérez',
            ],
            [
                'nombre'       => 'GlobalTech Supply',
                'razon_social' => 'Global Technology Supply S.R.L.',
                'nit'          => '0614-030373-003-2',
                'email'        => 'orders@globaltech.com',
                'telefono'     => '2444-5555',
                'contacto'     => 'Juan Martínez',
            ],
        ])->map(fn($p) => Proveedor::firstOrCreate(['nit' => $p['nit']], $p));

        // ── Clientes ───────────────────────────────────────────────
        collect([
            [
                'nombre'         => 'Empresa ABC',
                'apellido'       => 'S.A.',
                'email'          => 'compras@abc.com',
                'telefono'       => '2111-2222',
                'dui'            => null,
                'nit'            => '0614-123456-101-5',
                'limite_credito' => 5000.00,
            ],
            [
                'nombre'         => 'Inversiones XYZ',
                'apellido'       => null,
                'email'          => 'admin@xyz.com',
                'telefono'       => '2222-3333',
                'dui'            => null,
                'nit'            => '0614-234567-102-6',
                'limite_credito' => 10000.00,
            ],
            [
                'nombre'         => 'Pedro',
                'apellido'       => 'Ramírez',
                'email'          => 'pedro@mail.com',
                'telefono'       => '7777-8888',
                'dui'            => '01234567-8',
                'nit'            => null,
                'limite_credito' => 0,
            ],
        ])->each(fn($c) => Cliente::firstOrCreate(['email' => $c['email']], $c));

        // ── Productos ──────────────────────────────────────────────
        $productosDatos = [
            [
                'codigo'       => 'LAP-001',
                'nombre'       => 'Laptop Pro 15"',
                'precio_compra'=> 1200.00,
                'precio_venta' => 1500.00,
                'stock'        => 24,
                'stock_minimo' => 5,
                'unidad'       => 'unidad',
                'categoria_id' => $categorias[0]->id,
                'proveedor_id' => $proveedores[0]->id,
            ],
            [
                'codigo'       => 'MOU-001',
                'nombre'       => 'Mouse Inalámbrico',
                'precio_compra'=> 20.00,
                'precio_venta' => 45.00,
                'stock'        => 150,
                'stock_minimo' => 20,
                'unidad'       => 'unidad',
                'categoria_id' => $categorias[1]->id,
                'proveedor_id' => $proveedores[1]->id,
            ],
            [
                'codigo'       => 'TEC-001',
                'nombre'       => 'Teclado Mecánico RGB',
                'precio_compra'=> 80.00,
                'precio_venta' => 200.00,
                'stock'        => 3,
                'stock_minimo' => 10,
                'unidad'       => 'unidad',
                'categoria_id' => $categorias[1]->id,
                'proveedor_id' => $proveedores[1]->id,
            ],
            [
                'codigo'       => 'MON-001',
                'nombre'       => 'Monitor 4K 27"',
                'precio_compra'=> 350.00,
                'precio_venta' => 600.00,
                'stock'        => 18,
                'stock_minimo' => 5,
                'unidad'       => 'unidad',
                'categoria_id' => $categorias[0]->id,
                'proveedor_id' => $proveedores[0]->id,
            ],
            [
                'codigo'       => 'SSD-001',
                'nombre'       => 'SSD 1TB NVMe',
                'precio_compra'=> 70.00,
                'precio_venta' => 120.00,
                'stock'        => 45,
                'stock_minimo' => 10,
                'unidad'       => 'unidad',
                'categoria_id' => $categorias[3]->id,
                'proveedor_id' => $proveedores[2]->id,
            ],
            [
                'codigo'       => 'SWI-001',
                'nombre'       => 'Switch 8 Puertos',
                'precio_compra'=> 40.00,
                'precio_venta' => 85.00,
                'stock'        => 32,
                'stock_minimo' => 5,
                'unidad'       => 'unidad',
                'categoria_id' => $categorias[2]->id,
                'proveedor_id' => $proveedores[2]->id,
            ],
        ];

        $productos = collect($productosDatos)
            ->map(fn($p) => Producto::firstOrCreate(['codigo' => $p['codigo']], $p));

        // ── Ventas de ejemplo ─────────────────────────────────────
        $admin     = Usuario::where('usuario', 'admin')->first();
        $vendedor  = Usuario::where('usuario', 'vendedor1')->first();
        $cliente1  = Cliente::where('email', 'compras@abc.com')->first();
        $efectivo  = MetodoPago::where('nombre', 'Efectivo')->first();
        $transferencia = MetodoPago::where('nombre', 'Transferencia Bancaria')->first();

        if ($admin && $efectivo && $productos->count() >= 2) {
            $this->crearVenta($admin, $cliente1, $efectivo, [
                ['producto' => $productos[0], 'cantidad' => 2, 'precio' => 1500.00],
                ['producto' => $productos[1], 'cantidad' => 5, 'precio' => 45.00],
            ]);

            $this->crearVenta($vendedor ?? $admin, null, $transferencia ?? $efectivo, [
                ['producto' => $productos[3], 'cantidad' => 1, 'precio' => 600.00],
                ['producto' => $productos[4], 'cantidad' => 2, 'precio' => 120.00],
            ]);
        }

        // ── Compra de ejemplo ──────────────────────────────────────
        $bodeguero = Usuario::where('usuario', 'bodeguero1')->first();
        if ($bodeguero && $proveedores->count() > 0) {
            $this->crearCompra($bodeguero, $proveedores[0], $transferencia ?? $efectivo, [
                ['producto' => $productos[0], 'cantidad' => 10, 'precio' => 1200.00],
                ['producto' => $productos[3], 'cantidad' => 5,  'precio' => 350.00],
            ]);
        }
    }

    private function crearVenta(
        Usuario $usuario,
        ?Cliente $cliente,
        MetodoPago $metodoPago,
        array $items
    ): void {
        $subtotal = collect($items)->sum(fn($i) => $i['cantidad'] * $i['precio']);

        $venta = Venta::create([
            'numero_venta'   => 'VTA-' . now()->format('Y') . '-' . str_pad(
                Venta::count() + 1, 6, '0', STR_PAD_LEFT
            ),
            'cliente_id'     => $cliente?->id,
            'metodo_pago_id' => $metodoPago->id,
            'usuario_id'     => $usuario->id,
            'subtotal'       => $subtotal,
            'descuento'      => 0,
            'impuesto'       => 0,
            'total'          => $subtotal,
            'estado'         => 'completada',
            'fecha_venta'    => now()->subDays(rand(1, 30)),
        ]);

        foreach ($items as $item) {
            $venta->detalles()->create([
                'producto_id'     => $item['producto']->id,
                'cantidad'        => $item['cantidad'],
                'precio_unitario' => $item['precio'],
                'descuento'       => 0,
            ]);
        }
    }

    private function crearCompra(
        Usuario $usuario,
        Proveedor $proveedor,
        MetodoPago $metodoPago,
        array $items
    ): void {
        $subtotal = collect($items)->sum(fn($i) => $i['cantidad'] * $i['precio']);

        $compra = Compra::create([
            'numero_compra'  => 'CMP-' . now()->format('Y') . '-' . str_pad(
                Compra::count() + 1, 6, '0', STR_PAD_LEFT
            ),
            'proveedor_id'   => $proveedor->id,
            'metodo_pago_id' => $metodoPago->id,
            'usuario_id'     => $usuario->id,
            'subtotal'       => $subtotal,
            'descuento'      => 0,
            'impuesto'       => 0,
            'total'          => $subtotal,
            'estado'         => 'completada',
            'fecha_compra'   => now()->subDays(rand(1, 30)),
        ]);

        foreach ($items as $item) {
            $compra->detalles()->create([
                'producto_id'     => $item['producto']->id,
                'cantidad'        => $item['cantidad'],
                'precio_unitario' => $item['precio'],
                'descuento'       => 0,
            ]);
        }
    }
}
