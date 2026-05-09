<?php

return [

    'defaults' => [
        'guard'     => 'api',
        'passwords' => 'usuarios',
    ],

    'guards' => [
        'web' => [
            'driver'   => 'session',
            'provider' => 'users',
        ],

        'api' => [
            'driver'   => 'jwt',
            'provider' => 'usuarios',
        ],
    ],

    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model'  => App\Models\Usuario::class,
        ],

        'usuarios' => [
            'driver' => 'eloquent',
            'model'  => App\Models\Usuario::class,
        ],
    ],

    'passwords' => [
        'usuarios' => [
            'provider' => 'usuarios',
            'table'    => 'password_reset_tokens',
            'expire'   => 60,
            'throttle' => 60,
        ],
    ],

    'password_timeout' => 10800,

    // Rate limiting para login
    'login_max_attempts' => env('LOGIN_MAX_ATTEMPTS', 5),
    'login_decay_minutes'=> env('LOGIN_DECAY_MINUTES', 1),
    'login_decay_seconds'=> env('LOGIN_DECAY_MINUTES', 1) * 60,
];
