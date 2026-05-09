<?php

use App\Models\Catalogos\Categoria;
use App\Models\Catalogos\MetodoPago;
use App\Models\Catalogos\Producto;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ── Helpers ────────────────────────────────────────────────────
function crearAdminConToken(): array
{
    \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
    \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'vendedor', 'guard_name' => 'api']);

    $admin = Usuario::factory()->create([
        'contrasena' => bcrypt('Admin123$'),
        'activo'     => true,
    ]);
    $admin->assignRole('admin');

    $token = auth('api')->login($admin);
    return [$admin, $token];
}

// ══════════════════════════════════════════════════════════════
// PRODUCTOS
// ══════════════════════════════════════════════════════════════

test('listar productos requiere autenticación', function () {
    $this->getJson('/api/productos')->assertStatus(401);
});

test('listar productos retorna 200 con token válido', function () {
    [, $token] = crearAdminConToken();

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/productos')
        ->assertStatus(200)
        ->assertJsonStructure(['status', 'data']);
});

test('crear producto exitosamente', function () {
    [, $token] = crearAdminConToken();

    $categoria = Categoria::factory()->create();

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/productos', [
            'codigo'       => 'TEST-001',
            'nombre'       => 'Producto de Prueba',
            'precio_venta' => 99.99,
            'stock'        => 50,
            'stock_minimo' => 5,
            'categoria_id' => $categoria->id,
        ])
        ->assertStatus(201)
        ->assertJsonPath('data.codigo', 'TEST-001')
        ->assertJsonPath('data.nombre', 'Producto de Prueba');
});

test('validación falla al crear producto sin campos requeridos', function () {
    [, $token] = crearAdminConToken();

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/productos', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['codigo', 'nombre', 'precio_venta', 'categoria_id']);
});

test('no permite crear producto con código duplicado', function () {
    [, $token] = crearAdminConToken();
    $categoria  = Categoria::factory()->create();

    Producto::factory()->create(['codigo' => 'DUP-001', 'categoria_id' => $categoria->id]);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/productos', [
            'codigo'       => 'DUP-001',
            'nombre'       => 'Otro Producto',
            'precio_venta' => 50.00,
            'categoria_id' => $categoria->id,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['codigo']);
});

// ══════════════════════════════════════════════════════════════
// VENTAS
// ══════════════════════════════════════════════════════════════

test('crear venta decrementa stock del producto', function () {
    [, $token] = crearAdminConToken();

    $categoria = Categoria::factory()->create();
    $metodo    = MetodoPago::factory()->create();
    $producto  = Producto::factory()->create([
        'stock'        => 20,
        'precio_venta' => 100.00,
        'categoria_id' => $categoria->id,
    ]);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/ventas', [
            'metodo_pago_id' => $metodo->id,
            'items' => [
                [
                    'producto_id'     => $producto->id,
                    'cantidad'        => 3,
                    'precio_unitario' => 100.00,
                ],
            ],
        ])
        ->assertStatus(201);

    expect($producto->fresh()->stock)->toBe(17);
});

test('crear venta falla si stock insuficiente', function () {
    [, $token] = crearAdminConToken();

    $categoria = Categoria::factory()->create();
    $metodo    = MetodoPago::factory()->create();
    $producto  = Producto::factory()->create([
        'stock'        => 2,
        'precio_venta' => 100.00,
        'categoria_id' => $categoria->id,
    ]);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/ventas', [
            'metodo_pago_id' => $metodo->id,
            'items' => [
                [
                    'producto_id'     => $producto->id,
                    'cantidad'        => 10,
                    'precio_unitario' => 100.00,
                ],
            ],
        ])
        ->assertStatus(422);
});

test('cancelar venta restaura el stock', function () {
    [, $token] = crearAdminConToken();

    $categoria = Categoria::factory()->create();
    $metodo    = MetodoPago::factory()->create();
    $producto  = Producto::factory()->create([
        'stock'        => 20,
        'precio_venta' => 100.00,
        'categoria_id' => $categoria->id,
    ]);

    // Crear venta
    $ventaResponse = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/ventas', [
            'metodo_pago_id' => $metodo->id,
            'items' => [
                ['producto_id' => $producto->id, 'cantidad' => 5, 'precio_unitario' => 100.00],
            ],
        ]);

    $ventaId = $ventaResponse->json('data.id');
    expect($producto->fresh()->stock)->toBe(15);

    // Cancelar
    $this->withHeader('Authorization', "Bearer {$token}")
        ->patchJson("/api/ventas/{$ventaId}/cancelar")
        ->assertStatus(200);

    expect($producto->fresh()->stock)->toBe(20);
});
