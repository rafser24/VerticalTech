<?php

/*
|--------------------------------------------------------------------------
| CORS Configuration — config/cors.php
|--------------------------------------------------------------------------
|
| Permite que el frontend React (Vite en localhost:5173) pueda hacer
| peticiones al backend Laravel (localhost:8000).
|
| IMPORTANTE: En producción cambiar 'allowed_origins' por el dominio real.
|
*/

return [

    /*
     * Rutas a las que aplica CORS.
     * 'api/*' cubre todos los endpoints de la API.
     */
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    /*
     * Métodos HTTP permitidos.
     * Incluir OPTIONS es obligatorio para las peticiones preflight del navegador.
     */
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    /*
     * Orígenes permitidos.
     * Agrega aquí todos los puertos que uses en desarrollo.
     *
     * ⚠️  En producción reemplazar con tu dominio real:
     *     'https://tuapp.com'
     */
    'allowed_origins' => [
        'http://localhost:5173',    // Vite dev server (puerto por defecto)
        'http://localhost:5174',    // Vite cuando 5173 está ocupado
        'http://localhost:3000',    // Create React App / alternativo
        'http://127.0.0.1:5173',   // Alias IPv4
        'http://127.0.0.1:5174',
        'http://127.0.0.1:3000',
    ],

    /*
     * Patrones de orígenes (regex). Déjalo vacío si usas 'allowed_origins'.
     */
    'allowed_origins_patterns' => [],

    /*
     * Headers que el frontend puede enviar.
     * 'Authorization' es obligatorio para el Bearer token de JWT.
     */
    'allowed_headers' => [
        'Content-Type',
        'Authorization',
        'Accept',
        'X-Requested-With',
        'Origin',
    ],

    /*
     * Headers que el navegador puede leer de la respuesta.
     */
    'exposed_headers' => [],

    /*
     * Tiempo en segundos que el navegador puede cachear la respuesta preflight.
     */
    'max_age' => 0,

    /*
     * Permite enviar cookies / credenciales en las peticiones.
     * Requerido si usas withCredentials: true en Axios.
     */
    'supports_credentials' => true,

];
