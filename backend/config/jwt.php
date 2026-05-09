<?php

return [

    /*
    |--------------------------------------------------------------------------
    | JWT Authentication Secret
    |--------------------------------------------------------------------------
    | Generar con: php artisan jwt:secret
    */
    'secret' => env('JWT_SECRET'),

    /*
    |--------------------------------------------------------------------------
    | JWT Authentication Keys
    |--------------------------------------------------------------------------
    | Para algoritmos asimétricos (RS256). Con HS256 no son necesarios.
    */
    'keys' => [
        'public'   => env('JWT_PUBLIC_KEY'),
        'private'  => env('JWT_PRIVATE_KEY'),
        'passphrase'=> env('JWT_PASSPHRASE'),
    ],

    /*
    |--------------------------------------------------------------------------
    | JWT time to live
    |--------------------------------------------------------------------------
    | Minutos que el token es válido. null = sin expiración (no recomendado).
    */
    'ttl' => env('JWT_TTL', 60),

    /*
    |--------------------------------------------------------------------------
    | Refresh TTL
    |--------------------------------------------------------------------------
    | Minutos dentro de los que se puede refrescar un token expirado.
    | 2 semanas por defecto: 60 * 24 * 14 = 20160
    */
    'refresh_ttl' => env('JWT_REFRESH_TTL', 20160),

    /*
    |--------------------------------------------------------------------------
    | JWT hashing algorithm
    |--------------------------------------------------------------------------
    */
    'algo' => env('JWT_ALGO', Tymon\JWTAuth\Providers\JWT\Provider::ALGO_HS256),

    /*
    |--------------------------------------------------------------------------
    | Required Claims
    |--------------------------------------------------------------------------
    */
    'required_claims' => [
        'iss', 'iat', 'exp', 'nbf', 'sub', 'jti',
    ],

    /*
    |--------------------------------------------------------------------------
    | Persistent Claims
    |--------------------------------------------------------------------------
    | Claims que se mantienen al refrescar el token.
    */
    'persistent_claims' => [
        'usuario',
    ],

    /*
    |--------------------------------------------------------------------------
    | Lock Subject
    |--------------------------------------------------------------------------
    | Bloquea el subject del token (mejora seguridad al refresh).
    */
    'lock_subject' => true,

    /*
    |--------------------------------------------------------------------------
    | Leeway
    |--------------------------------------------------------------------------
    | Segundos de tolerancia para validación de tiempo (diferencias de reloj).
    */
    'leeway' => env('JWT_LEEWAY', 0),

    /*
    |--------------------------------------------------------------------------
    | Blacklist
    |--------------------------------------------------------------------------
    | Habilitar blacklist para poder invalidar tokens en logout.
    */
    'blacklist_enabled' => env('JWT_BLACKLIST_ENABLED', true),

    'blacklist_grace_period' => env('JWT_BLACKLIST_GRACE_PERIOD', 0),

    'show_black_list_exception' => env('JWT_SHOW_BLACKLIST_EXCEPTION', true),

    /*
    |--------------------------------------------------------------------------
    | Decrypt the Subject
    |--------------------------------------------------------------------------
    */
    'decrypt_subject' => true,

    /*
    |--------------------------------------------------------------------------
    | Providers
    |--------------------------------------------------------------------------
    */
    'providers' => [
        'jwt'   => Tymon\JWTAuth\Providers\JWT\Lcobucci::class,
        'auth'  => Tymon\JWTAuth\Providers\Auth\Illuminate::class,
        'storage'=> Tymon\JWTAuth\Providers\Storage\Illuminate::class,
    ],
];
