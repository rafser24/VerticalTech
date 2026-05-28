# Temario de Defensa — Sistema de Ventas (st_ventas)
### Backend: Laravel 12 · PHP 8.2 · PostgreSQL | Frontend: React 19 · Vite

---

## ÍNDICE

1. [Arquitectura General del Sistema](#1-arquitectura-general-del-sistema)
2. [Base de Datos y Migraciones](#2-base-de-datos-y-migraciones)
3. [Autenticación JWT](#3-autenticación-jwt)
4. [Roles y Permisos (Spatie)](#4-roles-y-permisos-spatie)
5. [API REST — Rutas, Controladores y FormRequests](#5-api-rest--rutas-controladores-y-formrequests)
6. [Eloquent ORM — Modelos y Relaciones](#6-eloquent-orm--modelos-y-relaciones)
7. [Sistema de Caché](#7-sistema-de-caché)
8. [Auditoría y Trazabilidad](#8-auditoría-y-trazabilidad)
9. [React — Arquitectura Frontend](#9-react--arquitectura-frontend)
10. [Gestión de Estado (Context API + useReducer)](#10-gestión-de-estado-context-api--usereducer)
11. [Formularios (React Hook Form + Zod)](#11-formularios-react-hook-form--zod)
12. [Seguridad Frontend — RouteGuard y Roles](#12-seguridad-frontend--routeguard-y-roles)
13. [Comunicación con el Backend (Axios)](#13-comunicación-con-el-backend-axios)
14. [Módulos de Negocio](#14-módulos-de-negocio)
15. [Preguntas de Diseño y Decisiones Técnicas](#15-preguntas-de-diseño-y-decisiones-técnicas)

---

## 1. Arquitectura General del Sistema

### ¿Qué tipo de arquitectura tiene el proyecto?
El proyecto usa una arquitectura **cliente-servidor desacoplada** (decoupled):
- **Backend**: API REST construida con Laravel 12. Expone endpoints JSON y no renderiza vistas.
- **Frontend**: SPA (Single Page Application) construida con React 19 + Vite. Consume la API vía Axios.
- Ambas partes se comunican exclusivamente por HTTP/JSON. El backend no conoce al frontend y viceversa.

```
[Navegador — React SPA]
        ↕  HTTP/JSON (Axios)
[Laravel API REST — Puerto 8000]
        ↕  PDO / Eloquent
[PostgreSQL — Base de datos]
```

### ¿Por qué separar backend y frontend en lugar de usar Blade/Inertia?
- **Escalabilidad independiente**: el backend puede servir a una app móvil futura sin cambios.
- **Separación de responsabilidades**: el equipo de frontend trabaja sin depender del servidor.
- **Performance**: la SPA carga el HTML una vez; las actualizaciones posteriores son solo datos JSON.

### ¿Qué patrones de diseño usa el backend?
| Patrón | Dónde se aplica |
|--------|----------------|
| MVC | Controladores, Modelos, Recursos (en vez de Vistas) |
| Repository implícito | Eloquent actúa como repositorio de datos |
| Trait / Mixin | `HasApiCache`, `Auditable`, `ApiResponse`, `Sanitizable` |
| Factory | `crudService()` en el frontend genera servicios genéricos |
| Observer (via eventos Eloquent) | `bootHasApiCache()` escucha `saved` / `deleted` |

---

## 2. Base de Datos y Migraciones

### ¿Por qué PostgreSQL y no MySQL?
- Soporte nativo de `ILIKE` para búsquedas case-insensitive sin funciones extra.
- Tipos `jsonb` y columnas generadas (`storedAs`) disponibles en algunas tablas.
- Mayor robustez en transacciones concurrentes (MVCC nativo).
- El proyecto usa `Rule::unique` con `->whereNotNull()` que funciona mejor en PG.

### ¿Qué son las migraciones y para qué sirven?
Las migraciones son clases PHP que describen cambios en el esquema de la BD de forma versionada. Permiten reproducir la estructura exacta en cualquier entorno con `php artisan migrate`.

```php
// Ejemplo: make_codigo_nullable_in_productos_table.php
public function up(): void
{
    Schema::table('productos', function (Blueprint $table) {
        $table->string('codigo', 60)->nullable()->change();
    });
}
public function down(): void
{
    Schema::table('productos', function (Blueprint $table) {
        $table->string('codigo', 60)->nullable(false)->change();
    });
}
```
El método `down()` permite revertir (`php artisan migrate:rollback`).

### ¿Qué es un Seeder y cuándo se usa?
Un Seeder puebla la base de datos con datos iniciales o de prueba. Se ejecuta con `php artisan db:seed`.

```php
// UsuarioSeeder.php
foreach ($usuarios as $datos) {
    $role = $datos['role'];
    unset($datos['role']);
    $usuario = Usuario::updateOrCreate(
        ['usuario' => $datos['usuario']], // clave de búsqueda
        $datos                            // datos a crear/actualizar
    );
    $usuario->syncRoles([$role]); // asigna el rol de Spatie
}
```
`updateOrCreate` evita duplicados al volver a correr el seeder.

### ¿Cómo funciona `SoftDeletes`?
En lugar de borrar físicamente un registro, añade una marca de tiempo en `deleted_at`. El registro sigue en la BD pero Eloquent lo excluye automáticamente de las queries.

```php
// Modelo con SoftDeletes
use Illuminate\Database\Eloquent\SoftDeletes;
class Producto extends Model {
    use SoftDeletes; // añade columna deleted_at
}

// Query normal — excluye eliminados automáticamente
Producto::all(); // WHERE deleted_at IS NULL

// Para incluir eliminados
Producto::withTrashed()->get();
```

---

## 3. Autenticación JWT

### ¿Qué es JWT y cómo funciona en este proyecto?
JWT (JSON Web Token) es un estándar para transmitir información firmada entre partes. En este proyecto se usa la librería `tymon/jwt-auth ^2.2` con el guard `api`.

Un JWT tiene 3 partes separadas por puntos:
```
HEADER.PAYLOAD.SIGNATURE
eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8v...
```
- **Header**: tipo de token y algoritmo (HS256).
- **Payload**: datos del usuario (`sub`, `iat`, `exp`, `rol`...).
- **Signature**: HMAC del header+payload con la clave secreta del servidor.

### ¿Por qué JWT en lugar de sesiones Laravel?
- El backend es **stateless**: no guarda sesión en servidor. Escala horizontalmente.
- El frontend SPA lo almacena en `localStorage` y lo envía en cada request como `Authorization: Bearer {token}`.
- Compatible con múltiples clientes (web, móvil).

### ¿Cómo se implementa el login?
```php
// AuthenticationController.php
$credentials = [
    'usuario'  => $request->validated('usuario'),
    'password' => $request->input('password'),
];

if (! $token = auth('api')->attempt($credentials)) {
    RateLimiter::hit($key, 60); // penaliza intentos fallidos
    return response()->json(['status' => false, 'message' => 'Credenciales inválidas.'], 401);
}

$usuario = auth('api')->user();

if (!$usuario->activo) {
    auth('api')->logout();
    return response()->json(['status' => false, 'message' => 'Usuario inactivo.'], 403);
}
```

### ¿Qué es el RateLimiter y para qué sirve?
Limita el número de intentos de login por IP para prevenir ataques de fuerza bruta.

```php
$key = 'login:' . $request->ip();
if (RateLimiter::tooManyAttempts($key, 5)) { // máx 5 intentos
    $seconds = RateLimiter::availableIn($key);
    return response()->json(['message' => "Intente en {$seconds} segundos."], 429);
}
```

### ¿Cómo se renueva el token?
El endpoint `POST /api/auth/refresh` recibe el token actual (incluso si está por vencer) y devuelve uno nuevo. En el frontend, el interceptor de Axios puede llamarlo automáticamente ante un 401.

---

## 4. Roles y Permisos (Spatie)

### ¿Qué es Spatie Permission y cómo se usa?
`spatie/laravel-permission` es un paquete que agrega roles y permisos a los modelos de Eloquent usando tablas intermedias. En este proyecto usa el guard `api` (JWT).

**Jerarquía de roles:**
```
super-admin → admin → vendedor
```

### ¿Cómo se protegen las rutas por rol?
```php
// api.php — middleware de Spatie en las rutas
Route::middleware(['auth:api', 'role:super-admin|admin'])->group(function () {
    Route::get('/usuarios', [UserController::class, 'index']);
    Route::post('/usuarios', [UserController::class, 'createUser']);
});

Route::middleware(['auth:api', 'role:super-admin'])->group(function () {
    Route::get('/auditoria', [AuditoriaController::class, 'index']);
});
```

### ¿Cómo se asigna un rol a un usuario?
```php
// syncRoles reemplaza todos los roles actuales
$usuario->syncRoles(['admin']);

// assignRole agrega sin quitar los existentes
$usuario->assignRole('vendedor');

// Verificar
$usuario->hasRole('super-admin'); // true/false
$usuario->getRoleNames();          // Collection(['admin'])
```

### ¿Por qué el admin no puede editar al super-admin?
Es una regla de negocio de seguridad. En `UserController.php`:
```php
// update(), destroy(), toggleActivo()
if ($usuario->hasRole('super-admin') && !auth('api')->user()->hasRole('super-admin')) {
    return $this->error('No tienes permiso para modificar a un Super Admin.', 403);
}
```
Solo otro super-admin puede gestionar cuentas super-admin. El admin (`!hasRole('super-admin')`) recibe un 403.

---

## 5. API REST — Rutas, Controladores y FormRequests

### ¿Qué es una API REST y qué convenciones sigue este proyecto?
REST usa los verbos HTTP para definir acciones sobre recursos:
| Verbo | Ruta | Acción |
|-------|------|--------|
| GET | `/api/usuarios` | Listar usuarios |
| POST | `/api/usuarios` | Crear usuario |
| PUT | `/api/usuarios/{id}` | Actualizar usuario |
| DELETE | `/api/usuarios/{id}` | Eliminar usuario |
| PATCH | `/api/usuarios/{id}/toggle` | Acción parcial (activar/desactivar) |

### ¿Qué es el trait ApiResponse?
Estandariza todas las respuestas JSON del sistema en el mismo formato:

```php
// Respuesta exitosa
return $this->success($data, 'Usuario creado correctamente', 201);
// → { "status": true, "message": "...", "data": {...} }

// Respuesta de error
return $this->error('Usuario no encontrado', 404);
// → { "status": false, "message": "Usuario no encontrado" }
```
El frontend siempre puede acceder a `response.data.data` para los datos y `response.data.message` para el mensaje.

### ¿Qué es un FormRequest y por qué se usa?
Es una clase que encapsula las reglas de validación fuera del controlador, manteniendo el código limpio.

```php
// UsuarioCreateRequest.php
public function rules(): array
{
    return [
        'nombre'   => 'required|string|min:2|max:100',
        'usuario'  => ['required', 'string', Rule::unique('usuarios', 'usuario')],
        'password' => 'required|string|min:8|confirmed',
        'rol'      => 'required|string|in:admin,vendedor',
    ];
}

public function messages(): array
{
    return [
        'rol.in' => 'Rol no válido. Valores permitidos: admin, vendedor.',
    ];
}

// Si la validación falla, lanza HttpResponseException con 422
protected function failedValidation(Validator $validator): void
{
    throw new HttpResponseException(response()->json([
        'status'  => false,
        'message' => $validator->errors()->first(),
        'errors'  => $validator->errors(),
    ], 422));
}
```

### ¿Qué es un API Resource?
Transforma modelos Eloquent en JSON con la estructura exacta que necesita el frontend:

```php
// UsuarioResource.php
public function toArray(Request $request): array
{
    return [
        'id'     => $this->id,
        'nombre' => $this->nombre,
        'rol'    => $this->rol,          // campo del modelo
        'roles'  => $this->getRoleNames(), // roles Spatie
        'activo' => $this->activo,
    ];
}
```
Ventaja: si cambia la estructura interna del modelo, el frontend no se rompe; solo se actualiza el Resource.

---

## 6. Eloquent ORM — Modelos y Relaciones

### ¿Qué es Eloquent y qué ventajas tiene?
Eloquent es el ORM (Object-Relational Mapping) de Laravel. Mapea tablas de BD a clases PHP. Evita escribir SQL manualmente y añade funcionalidades como eventos, scopes y relaciones.

### ¿Cuáles son las relaciones usadas en el proyecto?

```php
// Compra tiene muchos DetalleCompra (hasMany)
class Compra extends Model {
    public function detalles() {
        return $this->hasMany(DetalleCompra::class, 'compra_id');
    }
    public function proveedor() {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }
}

// Acceso encadenado
$compra = Compra::with('detalles.producto')->findOrFail($id);
// → carga compra + todos sus detalles + el producto de cada detalle
// en 3 queries (NO en N+1)
```

### ¿Qué es el problema N+1 y cómo se evita?
Si se carga una colección de compras y luego se accede al proveedor de cada una, Eloquent hace 1 query para las compras + N queries para los proveedores = **N+1 problema**.

```php
// ❌ MALO — N+1
$compras = Compra::all();
foreach ($compras as $c) {
    echo $c->proveedor->nombre; // query por cada iteración
}

// ✅ BIEN — Eager Loading
$compras = Compra::with('proveedor')->get();
// 2 queries total, sin importar cuántas compras haya
```

### ¿Qué son los Scopes?
Son filtros reutilizables definidos en el modelo:

```php
// Producto.php
public function scopeActivo($query) {
    return $query->where('activo', true);
}
public function scopeStockBajo($query) {
    return $query->whereColumn('stock', '<=', 'stock_minimo');
}

// Uso
Producto::activo()->stockBajo()->orderBy('stock')->get();
```

### ¿Qué hace `DB::transaction()`?
Agrupa múltiples operaciones de BD en una transacción atómica. Si alguna falla, todas se revierten:

```php
DB::transaction(function () use ($compra) {
    // Si cualquier UPDATE falla, el stock NO cambia parcialmente
    foreach ($compra->detalles as $detalle) {
        DB::table('productos')
            ->where('id', $detalle->producto_id)
            ->update(['stock' => DB::raw("stock + {$detalle->cantidad}")]);
    }
    $compra->update(['estado' => 'recibida', 'fecha_recepcion' => now()]);
});
```

---

## 7. Sistema de Caché

### ¿Cómo funciona el caché del sistema?
El middleware `CacheApiResponse` intercepta los GET y guarda la respuesta. Las claves son versionadas:

```
api_resp:{módulo}:v{versión}:{hash(URL)}
```

```php
// CacheApiResponse.php — flujo simplificado
public function handle(Request $request, Closure $next): Response
{
    if (! $request->isMethod('GET')) return $next($request); // solo GET

    $module  = $this->extractModule($request->path()); // "productos"
    $version = (int) Cache::get("cache_ver:{$module}", 1);
    $key     = "api_resp:{$module}:v{$version}:{$urlHash}";

    if (Cache::has($key)) {
        return response(Cache::get($key)['body'], 200)
            ->header('X-Cache', 'HIT');  // respuesta desde caché
    }

    $response = $next($request); // pasa al controlador
    Cache::put($key, [...], $ttl); // guarda respuesta
    return $response->header('X-Cache', 'MISS');
}
```

### ¿Cómo se invalida el caché automáticamente?
El trait `HasApiCache` escucha los eventos Eloquent:

```php
// HasApiCache.php
protected static function bootHasApiCache(): void
{
    $bumpVersion = static function ($model): void {
        foreach ($model->resolveCacheModules() as $module) {
            Cache::increment("cache_ver:{$module}");
            // La versión cambia → la clave antigua queda "huérfana"
            // → el middleware nunca la encuentra → caché efectivamente inválido
        }
    };
    static::saved($bumpVersion);   // cubre created + updated
    static::deleted($bumpVersion);
}
```

### ¿Por qué se usa versionado en lugar de `Cache::forget()`?
Con `forget()` habría que conocer exactamente cada clave a borrar (incluyendo todos los parámetros de URL posibles). El versionado es más simple: al cambiar el número de versión, **todas** las claves de ese módulo quedan obsoletas automáticamente, sin necesidad de enumerarlas.

### ¿Qué TTL tiene cada módulo y por qué?
| Módulo | TTL | Razón |
|--------|-----|-------|
| metodos-pago | 30 min | Casi nunca cambia |
| categorias / proveedores | 10 min | Cambios poco frecuentes |
| productos | 5 min | Cambios moderados |
| compras | 2 min | Operaciones frecuentes |
| ventas / dashboard | 1 min | Alta frecuencia (POS) |

---

## 8. Auditoría y Trazabilidad

### ¿Qué es el trait Auditable y qué registra?
Registra automáticamente en `auditoria_logs` cada creación, actualización y eliminación de modelos que lo usen.

```php
// Auditable.php — ejemplo de lo que registra
protected static function bootAuditable(): void
{
    static::created(fn($m) => AuditoriaLog::create([
        'modelo'     => class_basename($m),
        'modelo_id'  => $m->getKey(),
        'accion'     => 'created',
        'usuario_id' => auth('api')->id(),
        'ip'         => request()->ip(),
    ]));
    // similar para updated y deleted
}
```

### ¿Por qué es importante la auditoría en un sistema de ventas?
- **Trazabilidad**: saber quién creó/modificó un precio o eliminó un producto.
- **Resolución de disputas**: si un cliente reclama un precio, hay registro del cambio.
- **Cumplimiento normativo**: muchas regulaciones comerciales exigen historial de cambios.
- **Seguridad**: detectar accesos no autorizados o modificaciones sospechosas.

---

## 9. React — Arquitectura Frontend

### ¿Qué es una SPA y cómo la gestiona React Router?
Una SPA (Single Page Application) carga el HTML una sola vez. La navegación posterior no recarga la página; React Router intercepta los cambios de URL y renderiza el componente correspondiente.

```jsx
// App.jsx
<BrowserRouter>
  <Routes>
    <Route path="/login"     element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
    <Route path="/auditoria" element={<SuperAdminRoute><AuditoriaPage /></SuperAdminRoute>} />
  </Routes>
</BrowserRouter>
```

### ¿Cuál es la estructura de componentes del proyecto?
```
src/
├── context/         # Estado global (AuthContext, AppContext)
├── components/
│   ├── layout/      # MainLayout, Sidebar, RouteGuard
│   └── ui/          # DataTable, Modal, ConfirmDialog, FormFields
├── pages/           # Una página por módulo de negocio
├── services/        # api.js — Axios + crudService factory
├── schemas/         # Validaciones Zod
└── utils/           # helpers (formatCurrency, formatDate...)
```

### ¿Qué es el crudService factory?
Una función que genera servicios CRUD genéricos para no repetir código:

```js
// services/api.js
const crudService = (endpoint) => ({
    getAll:  (params) => api.get(endpoint, { params }),
    getById: (id)     => api.get(`${endpoint}/${id}`),
    create:  (data)   => api.post(endpoint, data),
    update:  (id, data) => api.put(`${endpoint}/${id}`, data),
    remove:  (id)     => api.delete(`${endpoint}/${id}`),
    toggle:  (id)     => api.patch(`${endpoint}/${id}/toggle`),
});

export const productService  = crudService('/productos');
export const clientService   = crudService('/clientes');
export const purchaseService = crudService('/compras');
```

---

## 10. Gestión de Estado (Context API + useReducer)

### ¿Por qué se usa Context API en lugar de Zustand?
- **Sin dependencia externa**: React lo provee de serie; menos dependencias = menos riesgos de incompatibilidad.
- **El estado de auth cambia pocas veces** (login/logout/updateUser), lo que minimiza el overhead de re-renders de Context.
- Zustand fue migrado porque la versión usada tenía incompatibilidades con React 19.

### ¿Cómo funciona el AuthContext?
```jsx
// AuthContext.jsx — flujo simplificado
function authReducer(state, action) {
    switch (action.type) {
        case 'LOGIN':
            return { user: action.user, token: action.token,
                     roles: action.roles, isAuthenticated: true };
        case 'LOGOUT':
            return { ...defaultState }; // limpia todo
        case 'UPDATE_USER':
            return { ...state, user: { ...state.user, ...action.payload } };
    }
}

// useEffect sincroniza el estado con localStorage
useEffect(() => {
    if (state.isAuthenticated) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
    } else {
        localStorage.removeItem(AUTH_STORAGE_KEY); // limpia al logout
    }
}, [state]);
```

### ¿Por qué se persiste el estado en localStorage?
Porque al refrescar el navegador el estado de React se pierde. localStorage permite recuperar la sesión sin necesidad de volver a hacer login. Se carga en la inicialización del reducer:

```js
function loadInitialState() {
    const raw = localStorage.getItem('auth-storage');
    if (!raw) return null;
    const data = JSON.parse(raw).state ?? JSON.parse(raw);
    // Normalizar: derivar 'rol' si no existe (compatibilidad con sesiones antiguas)
    if (data?.user && !data.user.rol) {
        data.user.rol = data.user.roles?.[0] ?? data.roles?.[0] ?? null;
    }
    return data;
}
```

---

## 11. Formularios (React Hook Form + Zod)

### ¿Por qué React Hook Form + Zod y no solo HTML validation?
- **React Hook Form**: maneja el estado del formulario con re-renders mínimos (usa refs en lugar de state para los campos).
- **Zod**: define el esquema de validación con TypeScript-friendly y da mensajes de error descriptivos.
- Combinados: validación del lado del cliente antes de enviar al servidor.

### ¿Cómo se define un schema Zod?
```js
// schemas/index.js
export const productSchema = z.object({
    nombre:      z.string().min(2, 'Mínimo 2 caracteres').max(150),
    precio_venta: z.coerce.number().positive('El precio debe ser positivo'),
    categoria_id: z.coerce.number().int().positive('Seleccione una categoría'),
    codigo:       z.string().max(60).optional(), // campo opcional
    activo:       z.coerce.boolean().default(true),
});
```
`z.coerce` convierte strings de inputs HTML al tipo correcto (number, boolean).

### ¿Cómo se conecta Zod con React Hook Form?
```jsx
const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(productSchema), // conecta los dos
});

// En el JSX
<input {...register('nombre')} />
{errors.nombre && <p>{errors.nombre.message}</p>}

// Al hacer submit, Zod valida antes de llamar onSubmit
<form onSubmit={handleSubmit(onSubmit)}>
```

### ¿Cómo se usan `useFieldArray` para listas dinámicas?
En el formulario de compras, los items (productos) son dinámicos:

```jsx
const { fields, append, remove } = useFieldArray({ control, name: 'items' });

// Agregar un ítem vacío
<button onClick={() => append({ product_id: '', quantity: 1, unit_price: 0 })}>
    + Agregar
</button>

// Renderizar los ítems
{fields.map((field, i) => (
    <div key={field.id}>
        <input {...register(`items.${i}.quantity`)} type="number" />
        <button onClick={() => remove(i)}>Eliminar</button>
    </div>
))}
```

---

## 12. Seguridad Frontend — RouteGuard y Roles

### ¿Cómo se protegen las rutas en el frontend?
Con componentes wrapper que verifican el rol antes de renderizar:

```jsx
// RouteGuard.jsx
export function SuperAdminRoute({ children }) {
    const { isAuthenticated, isSuperAdmin } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!isSuperAdmin())  return <Navigate to="/dashboard" replace />;
    return children;
}

// Uso en App.jsx
<Route path="/auditoria"
    element={<SuperAdminRoute><AuditoriaPage /></SuperAdminRoute>} />
```

Si un admin intenta acceder a `/auditoria` directamente por URL, es redirigido al dashboard.

### ¿Cómo se ocultan elementos en el Sidebar según el rol?
```jsx
// Sidebar.jsx — cada ítem tiene roles permitidos
const navGroups = [{
    label: 'Sistema',
    items: [
        { to: '/usuarios',      roles: ['super-admin', 'admin'] },
        { to: '/auditoria',     roles: ['super-admin'] },  // solo SA
        { to: '/configuracion', roles: ['super-admin'] },  // solo SA
    ],
}];

// Filtro al renderizar
const itemsVisibles = group.items.filter(
    item => item.roles.some(r => hasRole(r))
);
```

### ¿Es suficiente la seguridad en el frontend?
**No**. La seguridad del frontend es solo UX (experiencia de usuario). Un usuario malintencionado puede:
- Modificar el token en localStorage
- Enviar requests directos con Postman/curl

Por eso **toda la seguridad real está en el backend**:
- `middleware('auth:api')` verifica el JWT en cada request.
- `middleware('role:super-admin')` verifica el rol en BD.
- El frontend solo mejora la experiencia ocultando opciones que el usuario no puede usar.

---

## 13. Comunicación con el Backend (Axios)

### ¿Cómo se configura Axios en el proyecto?
```js
// services/api.js
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
});

// Interceptor de REQUEST: añade el token JWT automáticamente
api.interceptors.request.use((config) => {
    const stored = localStorage.getItem('auth-storage');
    const token  = stored ? JSON.parse(stored).token : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Interceptor de RESPONSE: maneja expiración de sesión
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth-storage'); // limpia sesión
            window.location.href = '/login';          // redirige
        }
        return Promise.reject(error);
    }
);
```

### ¿Por qué se usa el interceptor de request en lugar de poner el token manualmente?
Porque hay decenas de llamadas al backend. Sin el interceptor, cada `api.get()` / `api.post()` tendría que incluir manualmente `headers: { Authorization: ... }`. El interceptor centraliza esa lógica en un solo lugar.

### ¿Qué es el endpoint `/init` y por qué existe?
Es una optimización que agrupa en **una sola request** todos los datos que una página necesita al cargar:

```php
// CompraController::init()
return $this->success([
    'compras'      => CompraResource::collection($compras),
    'proveedores'  => ProveedorResource::collection($proveedores),
    'productos'    => $productos,
    'metodos_pago' => MetodoPagoResource::collection($metodosPago),
]);
```

Sin `init`, el frontend haría 4 requests separados al cargar la página de compras. Con `init`, hace 1. Reduce latencia y el número de validaciones JWT procesadas.

---

## 14. Módulos de Negocio

### ¿Cuál es el flujo de una venta en el POS?
1. El cajero (vendedor) abre el POS (`/pos`).
2. Selecciona productos y cantidades → se calcula el subtotal en tiempo real.
3. Elige el método de pago (efectivo, transferencia, etc.).
4. Al confirmar, `VentaRequest` valida los datos en el backend.
5. Se crea la `Venta` con sus `DetalleVenta`.
6. Se decrementa el stock de cada producto con `decrementarStock()`.
7. La venta queda en estado `completada`.

### ¿Cuál es el flujo de una compra?
El sistema usa un **flujo de estados** (`pendiente → confirmada → recibida`):

```
[Registrar] → pendiente
                 ↓ confirmar()    (proveedor acepta, sin stock)
             confirmada
                 ↓ recibir()      (mercancía llega, stock sube)
             recibida
```
- **pendiente → confirmada**: el proveedor aceptó el pedido, pero no llegó nada aún.
- **confirmada → recibida**: la mercancía llegó físicamente. Aquí se actualiza el stock.
- Solo se puede anular desde `pendiente` o `confirmada` (no de `recibida`, el stock ya entró).

### ¿Por qué el stock solo se mueve en compras y ventas, no en el formulario de producto?
Para mantener **integridad del inventario y trazabilidad**. Si el formulario de producto pudiera modificar el stock:
- Cualquier admin podría cambiar el stock arbitrariamente sin dejar rastro.
- El historial de auditoría no reflejaría la causa real del cambio.
- Habría inconsistencias entre el stock real y los registros de movimientos.

El stock solo sube con `recibir()` (compras) y baja con la creación de ventas.

### ¿Cómo funciona el cálculo del total de una compra?
```php
// CompraController::store()
foreach ($data['items'] as $item) {
    $lineSubtotal = ($item['cantidad'] * $item['precio_unitario']) - $item['descuento'];
    $subtotal    += $lineSubtotal;
}
$montoDescuento = $descuento > 0 ? round($subtotal * ($descuento / 100), 2) : 0;
$base           = $subtotal - $montoDescuento;
$montoImpuesto  = $impuesto > 0 ? round($base * ($impuesto / 100), 2) : 0;
$total          = $base + $montoImpuesto;
```

---

## 15. Preguntas de Diseño y Decisiones Técnicas

### ¿Por qué se usa `DB::table()` en lugar de Eloquent para actualizar el stock?
Cuando se recibe una compra con múltiples productos, usar Eloquent en un loop dispara:
- **N+1 queries** (un SELECT por producto).
- **Múltiples eventos Eloquent** que invalidan el caché N veces.

Con `DB::table()->update()`, el UPDATE es directo (sin SELECT previo) y no dispara eventos. El caché se invalida **una sola vez** al final:

```php
// ANTES (lento, N productos = ~3N queries + 2N operaciones de caché)
foreach ($compra->detalles as $detalle) {
    $producto = Producto::find($detalle->producto_id); // SELECT
    $producto->incrementarStock($detalle->cantidad);   // UPDATE + caché
    $producto->update(['precio_compra' => $detalle->precio_unitario]); // UPDATE + caché
}

// DESPUÉS (optimizado, N productos = N queries + 4 operaciones de caché)
foreach ($compra->detalles as $detalle) {
    DB::table('productos')
        ->where('id', $detalle->producto_id)
        ->update([
            'stock'         => DB::raw("stock + {$detalle->cantidad}"),
            'precio_compra' => $detalle->precio_unitario,
            'updated_at'    => now(),
        ]);
}
(new Producto)->invalidateCache(['productos', 'pos', 'dashboard', 'compras']); // una vez
```

### ¿Por qué el código de producto se autogenera si no se proporciona?
El formulario trata el `codigo` como opcional para facilitar la carga rápida de productos. Si el usuario no lo ingresa, el backend genera `PROD-{id_con_ceros}` (ej: `PROD-0042`), garantizando unicidad sin requerir que el usuario conozca los códigos del sistema.

```php
// ProductoController::store()
if ($codigoEsAutogenerado) {
    $data['codigo'] = 'TMP-' . uniqid(); // temporal único para el INSERT
}
$producto = Producto::create($data);
if ($codigoEsAutogenerado) {
    $producto->update(['codigo' => 'PROD-' . str_pad($producto->id, 4, '0', STR_PAD_LEFT)]);
}
```

### ¿Cuál es la diferencia entre autenticación y autorización?
| Concepto | Descripción | Dónde se aplica |
|----------|-------------|----------------|
| **Autenticación** | Verificar *quién eres* (¿es válido el JWT?) | `middleware('auth:api')` |
| **Autorización** | Verificar *qué puedes hacer* (¿tienes el rol?) | `middleware('role:admin')` |

Primero se autentica, luego se autoriza. Si el JWT no es válido, el middleware `auth:api` devuelve 401 antes de llegar al check de rol.

### ¿Cómo se evitan inyecciones SQL?
Eloquent y el Query Builder de Laravel usan **prepared statements** con parámetros enlazados:

```php
// VULNERABLE (nunca hacer esto)
DB::select("SELECT * FROM usuarios WHERE nombre = '{$nombre}'");

// SEGURO — Eloquent usa PDO bindings internamente
Usuario::where('nombre', $nombre)->first();

// SEGURO — DB::table con bindings explícitos
DB::table('usuarios')->where('nombre', $nombre)->first();

// SEGURO — solo al usar DB::raw, los valores se pasan aparte
DB::table('productos')->whereRaw('stock > ?', [$cantidad])->get();
```

### ¿Qué sucede si dos usuarios venden el último stock simultáneamente?
El sistema usa transacciones de BD. En el backend de ventas, se verifica el stock dentro de la misma transacción que lo decrementa, con bloqueo pesimista (`lockForUpdate()`):

```php
DB::transaction(function () use ($items) {
    foreach ($items as $item) {
        $producto = Producto::lockForUpdate()->find($item['producto_id']);
        if ($producto->stock < $item['cantidad']) {
            throw new \Exception("Stock insuficiente para {$producto->nombre}");
        }
        $producto->decrement('stock', $item['cantidad']);
    }
});
```
`lockForUpdate()` bloquea la fila durante la transacción para que otra transacción concurrente no pueda leerla hasta que la primera termine.

---

## RESUMEN RÁPIDO — Tecnologías y su propósito

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| Laravel | 12 | Framework PHP — API REST |
| PHP | 8.2 | Lenguaje backend |
| PostgreSQL | 15+ | Base de datos relacional |
| tymon/jwt-auth | ^2.2 | Autenticación stateless con JWT |
| spatie/laravel-permission | ^7.3 | Roles y permisos granulares |
| React | 19 | Framework UI — SPA |
| Vite | 5 | Bundler y dev server para React |
| Axios | 1.x | Cliente HTTP para consumir la API |
| React Hook Form | 7.x | Gestión de formularios sin re-renders |
| Zod | 3.x | Validación de esquemas en frontend |
| React Router | 6.x | Navegación SPA client-side |
| Tailwind CSS | 3.x | Estilos utility-first |

---

*Temario preparado para defensa de proyecto — Sistema de Ventas st_ventas*
