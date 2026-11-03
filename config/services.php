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

    'supabase' => [
        'jwt_secret' => env('SUPABASE_JWT_SECRET', ''),
        'jwks_url' => env('SUPABASE_JWKS_URL', ''),
        'url' => env('SUPABASE_URL', ''),
        'service_role_key' => env('SUPABASE_SERVICE_ROLE_KEY', ''),
    ],

    'zoeticoach' => [
        'api_url' => env('ZOETICOACH_API_URL', ''),
        'api_key' => env('ZOETICOACH_API_KEY', ''),
    ],

    'sentry' => [
        'dsn' => env('SENTRY_LARAVEL_DSN', env('SENTRY_DSN', '')),
        'environment' => env('APP_ENV', 'production'),
        'traces_sample_rate' => (float) env('SENTRY_TRACES_SAMPLE_RATE', 1.0),
    ],
];
