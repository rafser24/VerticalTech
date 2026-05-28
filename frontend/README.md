# VerticalTech – Sistema de Ventas 

Frontend React moderno para gestión de inventario, compras y ventas.

## Tecnologías
- **React 19** + Vite
- **React Router DOM** – enrutamiento
- **React Hook Form + Zod** – formularios con validación
- **Axios** – consumo de API REST
- **TailwindCSS** – UI con paleta pastel
- **Lucide React** – iconografía
- **React Toastify** – notificaciones

## Estructura del proyecto
```
src/
├── components/
│   ├── layout/         # Sidebar, Header, MainLayout, RouteGuard
│   └── ui/             # Modal, DataTable, StatCard, FormFields, CrudPage, ConfirmDialog
├── pages/              # Dashboard, Products, Categories, Suppliers, Clients, Purchases, Sales, Users, Login
├── store/              # authStore (Zustand), appStore (Zustand)
├── services/           # api.js (Axios + interceptors), mockData.js
├── schemas/            # Validaciones Zod
└── utils/              # Helpers (formateo, paginación, filtros)
```

## Instalación
```bash
npm install
cp .env.example .env
# Editar .env con la URL de tu API
npm run dev
```

## Seguridad implementada
- JWT almacenado en memoria (no localStorage) → protege de XSS
- Interceptores de Axios para adjuntar token automáticamente
- Sanitización de inputs en el interceptor de request
- Rutas protegidas por rol (PrivateRoute / AdminRoute)
- Validación robusta con Zod en todos los formularios
- Manejo global de errores 401 → logout automático

## API REST esperada
El frontend consume los siguientes endpoints:
- POST   /api/auth/login
- GET    /api/products
- POST   /api/products
- PUT    /api/products/:id
- DELETE /api/products/:id
- GET    /api/categories
- GET    /api/suppliers
- GET    /api/clients
- GET    /api/users          (solo admin)
- GET    /api/purchases
- POST   /api/purchases
- GET    /api/sales
- POST   /api/sales
- GET    /api/payment-methods
- GET    /api/dashboard/stats

## Demo
En modo demo (sin backend), cualquier email/contraseña funciona para iniciar sesión.
