# 🏪 Sistema de Gestión de Inventario, Compras y Ventas
### Backend Laravel 12 — API RESTful

---

## 🧱 Stack Tecnológico

| Componente        | Tecnología                           |
|-------------------|--------------------------------------|
| Framework         | Laravel 12 (PHP 8.2+)               |
| Autenticación     | `tymon/jwt-auth` v2.2               |
| Roles/Permisos    | `spatie/laravel-permission` v7      |
| Base de datos     | PostgreSQL 17                        |
| Cache / Tokens    | Redis (`predis/predis`)             |
| Documentación API | `dedoc/scramble`                    |
| Tests             | Pest PHP v3                          |
| Contenedor        | Docker + Laravel Sail               |

---

## ⚡ Instalación desde cero

```bash
# 1. Clonar e instalar dependencias
composer install

# 2. Configurar entorno
cp .env.example .env

# Editar .env:
#   DB_DATABASE=sistema_ventas
#   DB_USERNAME=postgres
#   DB_PASSWORD=tu_password
#   REDIS_HOST=127.0.0.1

# 3. Generar claves
php artisan key:generate
php artisan jwt:secret

# 4. Crear base de datos PostgreSQL
psql -U postgres -c "CREATE DATABASE sistema_ventas;"

# 5. Ejecutar migraciones y seeders
php artisan migrate --seed

# 6. Arrancar servidor
php artisan serve
```

### Con Docker
```bash
cp .env.example .env
# Ajustar DB_HOST=pgsql en .env para Docker
docker-compose up -d
docker exec -it laravel-app php artisan migrate --seed
```

---

## 👥 Usuarios semilla

| Usuario      | Password    | Rol         |
|--------------|-------------|-------------|
| `superadmin` | `Admin123$` | super-admin |
| `admin`      | `Admin123$` | admin       |
| `vendedor1`  | `Venta123$` | vendedor    |
| `bodeguero1` | `Bode123$!` | bodeguero   |
| `tecnico1`   | `Tec1123$!` | tecnico     |

---

## 🔐 Autenticación JWT

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "usuario": "admin",
  "password": "Admin123$"
}
```

**Respuesta:**
```json
{
  "status": true,
  "access_token": "eyJ0eXAiOiJKV1Q...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": { "id": 2, "nombre": "Administrador", "usuario": "admin" },
  "roles": ["admin"],
  "permissions": ["ver-productos", "crear-ventas", ...]
}
```

### Uso del token
```http
Authorization: Bearer eyJ0eXAiOiJKV1Q...
```

### Refresh
```http
POST /api/auth/refresh
Authorization: Bearer <token_expirado>
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

---

## 📡 Endpoints de la API

### 🔓 Públicos
| Método | Endpoint         | Descripción                   |
|--------|------------------|-------------------------------|
| POST   | `/api/auth/login`| Iniciar sesión (JWT)          |

### 🔐 Protegidos (`Authorization: Bearer <token>`)

#### Auth
| Método | Endpoint            | Descripción            |
|--------|---------------------|------------------------|
| POST   | `/api/auth/logout`  | Cerrar sesión          |
| POST   | `/api/auth/refresh` | Refrescar token        |
| GET    | `/api/auth/me`      | Usuario autenticado    |

#### Dashboard
| Método | Endpoint                          | Descripción               |
|--------|-----------------------------------|---------------------------|
| GET    | `/api/dashboard/stats`            | KPIs generales            |
| GET    | `/api/dashboard/ventas-por-mes`   | Ventas por mes (gráfico)  |
| GET    | `/api/dashboard/top-productos`    | Productos más vendidos    |
| GET    | `/api/dashboard/top-clientes`     | Clientes top              |
| GET    | `/api/dashboard/actividad-reciente`| Últimas transacciones   |

#### Catálogos (GET/POST/PUT/DELETE)
| Recurso        | Endpoint             | Rol mínimo  |
|----------------|----------------------|-------------|
| Categorías     | `/api/categorias`    | vendedor    |
| Proveedores    | `/api/proveedores`   | bodeguero   |
| Clientes       | `/api/clientes`      | vendedor    |
| Productos      | `/api/productos`     | vendedor    |
| Métodos de Pago| `/api/metodos-pago`  | todos       |

#### Transacciones
| Método | Endpoint                        | Descripción              | Rol mínimo |
|--------|---------------------------------|--------------------------|------------|
| GET    | `/api/ventas`                   | Listar ventas            | vendedor   |
| POST   | `/api/ventas`                   | Registrar venta          | vendedor   |
| GET    | `/api/ventas/{id}`              | Ver detalle de venta     | vendedor   |
| PATCH  | `/api/ventas/{id}/cancelar`     | Cancelar venta           | vendedor   |
| GET    | `/api/compras`                  | Listar compras           | bodeguero  |
| POST   | `/api/compras`                  | Registrar compra         | bodeguero  |
| GET    | `/api/compras/{id}`             | Ver detalle de compra    | bodeguero  |
| PATCH  | `/api/compras/{id}/cancelar`    | Cancelar compra          | bodeguero  |

#### Usuarios (solo admin/super-admin)
| Método | Endpoint                                | Descripción            |
|--------|-----------------------------------------|------------------------|
| GET    | `/api/usuarios`                         | Listar usuarios        |
| POST   | `/api/usuarios`                         | Crear usuario          |
| GET    | `/api/usuarios/{id}`                    | Ver usuario            |
| PUT    | `/api/usuarios/{id}`                    | Actualizar usuario     |
| DELETE | `/api/usuarios/{id}`                    | Eliminar usuario       |
| PATCH  | `/api/usuarios/{id}/toggle-activo`      | Activar/desactivar     |

#### Auditoría (solo super-admin)
| Método | Endpoint         | Descripción          |
|--------|------------------|----------------------|
| GET    | `/api/auditoria` | Logs de auditoría    |

---

## 🔎 Parámetros de Query comunes

| Parámetro    | Tipo    | Descripción                      |
|--------------|---------|----------------------------------|
| `search`     | string  | Búsqueda de texto                |
| `activo`     | boolean | Filtrar por estado               |
| `per_page`   | integer | Items por página (paginación)    |
| `sort`       | string  | Campo de ordenamiento            |
| `dir`        | string  | `asc` o `desc`                   |
| `desde`      | date    | Fecha inicio (Y-m-d)             |
| `hasta`      | date    | Fecha fin (Y-m-d)                |
| `estado`     | string  | `pendiente/completada/cancelada` |

---

## 📦 Registrar una Venta

```http
POST /api/ventas
Authorization: Bearer <token>
Content-Type: application/json

{
  "cliente_id": 1,
  "metodo_pago_id": 1,
  "descuento": 10,
  "impuesto": 13,
  "notas": "Venta con descuento especial",
  "items": [
    {
      "producto_id": 1,
      "cantidad": 2,
      "precio_unitario": 1500.00,
      "descuento": 0
    },
    {
      "producto_id": 2,
      "cantidad": 5,
      "precio_unitario": 45.00
    }
  ]
}
```

El sistema automáticamente:
- ✅ Valida stock disponible antes de procesar
- ✅ Calcula subtotales, descuentos e impuestos
- ✅ Genera número de venta correlativo (`VTA-2025-000001`)
- ✅ Decrementa el stock de cada producto
- ✅ Registra auditoría de la operación
- ✅ Todo en una transacción atómica

---

## 🏗️ Arquitectura del proyecto

```
app/
├── Exceptions/
│   └── Handler.php                     ← Manejo global de errores
├── Http/
│   ├── Controllers/
│   │   ├── Controller.php              ← Base con success()/error()/paginationMeta()
│   │   ├── Auth/
│   │   │   ├── AuthenticationController.php  ← login/logout/refresh/me
│   │   │   └── UsuarioController.php         ← CRUD usuarios
│   │   └── Api/
│   │       ├── Catalogos/              ← Categoria, Proveedor, Cliente, Producto, MetodoPago
│   │       ├── Ventas/VentaController.php
│   │       ├── Compras/CompraController.php
│   │       ├── Dashboard/DashboardController.php
│   │       └── Auditoria/AuditoriaController.php
│   ├── Middleware/
│   │   └── RoleOrPermissionMiddleware.php   ← Verifica activo + rol/permiso
│   ├── Requests/                       ← FormRequests con Sanitizable
│   └── Resources/                      ← API Resources por módulo
├── Models/
│   ├── Usuario.php                     ← Autenticable + JWT + Spatie
│   ├── Catalogos/                      ← Categoria, Proveedor, Cliente, Producto, MetodoPago
│   ├── Ventas/                         ← Venta, DetalleVenta
│   ├── Compras/                        ← Compra, DetalleCompra
│   └── Logs/AuditoriaLog.php
├── Providers/
│   └── AppServiceProvider.php         ← morphMap + RateLimiters
└── Traits/
    ├── Auditable.php                   ← Auto-audit created/updated/deleted
    └── Sanitizable.php                 ← XSS sanitization en FormRequests

database/
├── migrations/                         ← Todas las tablas en orden correcto
├── seeders/
│   ├── RolePermissionSeeder.php        ← 25 permisos + 5 roles
│   ├── UsuarioSeeder.php
│   ├── SistemaVentasSeeder.php         ← Datos de demostración
│   └── DatabaseSeeder.php
└── factories/                          ← Para tests con Pest

routes/
└── api.php                             ← Todas las rutas con middleware de roles

config/
├── auth.php                            ← Guard jwt + provider usuarios
├── jwt.php                             ← Configuración JWT completa
└── cors.php                            ← CORS para React (localhost:5173)
```

---

## 🔒 Seguridad implementada

| Amenaza        | Protección                                               |
|----------------|----------------------------------------------------------|
| SQL Injection  | Eloquent ORM — queries parametrizadas siempre            |
| XSS            | `Sanitizable` trait — `strip_tags` + `htmlspecialchars` |
| CSRF           | Desactivado para API (usa JWT stateless)                |
| Auth           | JWT con blacklist en logout                              |
| Brute Force    | Rate limiter: 5 intentos/minuto en login                |
| Auth bypass    | Middleware `auth:api` en todas las rutas privadas        |
| Privilege esc. | `RoleOrPermissionMiddleware` por cada grupo de rutas    |
| Datos sensibles| `$hidden` en modelos + `$dontFlash` en Handler          |
| Contraseñas    | Bcrypt con 12 rondas (`BCRYPT_ROUNDS=12`)               |
| Inactivos      | Verificación de `activo=true` en login y middleware      |

---

## 🧪 Tests

```bash
# Crear BD de test
psql -U postgres -c "CREATE DATABASE sistema_ventas_test;"

# Ejecutar todos los tests
php artisan test

# Con coverage (requiere Xdebug)
php artisan test --coverage

# Solo un test específico
php artisan test --filter="login exitoso"
```

---

## 📖 Documentación API automática

```bash
# Ver docs interactivos (Scramble)
# Acceder a: http://localhost:8000/docs/api
```

---

## 🔄 Integración con el Frontend React

En el `.env` del frontend:
```env
VITE_API_URL=http://localhost:8000/api
```

El token JWT debe enviarse en cada petición:
```javascript
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

---

## 🚀 Comandos útiles

```bash
# Limpiar caché tras cambios de roles/permisos
php artisan cache:clear
php artisan permission:cache-reset

# Refrescar base de datos y re-sembrar
php artisan migrate:fresh --seed

# Ver todas las rutas
php artisan route:list --path=api

# Generar nuevo JWT secret
php artisan jwt:secret

# Documentación Scramble
php artisan scramble:export
```
