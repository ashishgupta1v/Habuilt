<?php

return [
    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'sentry' => [
        'dsn' => env('SENTRY_LARAVEL_DSN', env('SENTRY_DSN', env('VITE_SENTRY_DSN'))),
        'environment' => env('APP_ENV', 'production'),
        'traces_sample_rate' => (float) env('SENTRY_TRACES_SAMPLE_RATE', 1.0),
    ],
];
