<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ config('app.name', 'Habuilt') }}</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=20260418">
        <link rel="shortcut icon" href="/favicon.svg?v=20260418">
        @vite('resources/js/app.js')
        @inertiaHead
    </head>
    <body>
        @inertia
    </body>
</html>
