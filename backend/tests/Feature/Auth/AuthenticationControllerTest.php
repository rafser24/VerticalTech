<?php

use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Crear roles necesarios para los tests
    \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
    \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'vendedor', 'guard_name' => 'api']);
});

// ──────────────────────────────────────────────────────────────
// Login exitoso
// ──────────────────────────────────────────────────────────────
test('login exitoso con credenciales correctas', function () {
    $usuario = Usuario::factory()->create([
        'usuario'    => 'testuser',
        'contrasena' => bcrypt('Password123$'),
        'activo'     => true,
    ]);
    $usuario->assignRole('admin');

    $response = $this->postJson('/api/auth/login', [
        'usuario'  => 'testuser',
        'password' => 'Password123$',
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'status',
            'access_token',
            'token_type',
            'expires_in',
            'user',
            'roles',
            'permissions',
        ])
        ->assertJson([
            'status'     => true,
            'token_type' => 'bearer',
        ]);
});

// ──────────────────────────────────────────────────────────────
// Login fallido — contraseña incorrecta
// ──────────────────────────────────────────────────────────────
test('login fallido con contraseña incorrecta', function () {
    Usuario::factory()->create([
        'usuario'    => 'testuser',
        'contrasena' => bcrypt('Password123$'),
        'activo'     => true,
    ]);

    $response = $this->postJson('/api/auth/login', [
        'usuario'  => 'testuser',
        'password' => 'wrongpassword',
    ]);

    $response->assertStatus(401)
        ->assertJson(['status' => false]);
});

// ──────────────────────────────────────────────────────────────
// Login fallido — usuario inactivo
// ──────────────────────────────────────────────────────────────
test('login rechazado si usuario está inactivo', function () {
    $usuario = Usuario::factory()->create([
        'usuario'    => 'inactivo',
        'contrasena' => bcrypt('Password123$'),
        'activo'     => false,
    ]);
    $usuario->assignRole('vendedor');

    $response = $this->postJson('/api/auth/login', [
        'usuario'  => 'inactivo',
        'password' => 'Password123$',
    ]);

    $response->assertStatus(403);
});

// ──────────────────────────────────────────────────────────────
// Validación de campos requeridos
// ──────────────────────────────────────────────────────────────
test('login falla si faltan campos', function () {
    $response = $this->postJson('/api/auth/login', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['usuario', 'password']);
});

// ──────────────────────────────────────────────────────────────
// Logout
// ──────────────────────────────────────────────────────────────
test('logout exitoso con token válido', function () {
    $usuario = Usuario::factory()->create([
        'contrasena' => bcrypt('Password123$'),
        'activo'     => true,
    ]);
    $usuario->assignRole('admin');

    $token = auth('api')->login($usuario);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/auth/logout');

    $response->assertStatus(200)
        ->assertJson(['status' => true]);
});

// ──────────────────────────────────────────────────────────────
// Rutas protegidas sin token
// ──────────────────────────────────────────────────────────────
test('acceso denegado a rutas protegidas sin token', function () {
    $this->getJson('/api/productos')
        ->assertStatus(401);

    $this->getJson('/api/clientes')
        ->assertStatus(401);

    $this->getJson('/api/dashboard/stats')
        ->assertStatus(401);
});

// ──────────────────────────────────────────────────────────────
// Me — obtener usuario autenticado
// ──────────────────────────────────────────────────────────────
test('me retorna datos del usuario autenticado', function () {
    $usuario = Usuario::factory()->create([
        'contrasena' => bcrypt('Password123$'),
        'activo'     => true,
    ]);
    $usuario->assignRole('admin');

    $token = auth('api')->login($usuario);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/auth/me');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'status',
            'data' => ['id', 'nombre', 'usuario', 'email', 'roles'],
        ]);
});
