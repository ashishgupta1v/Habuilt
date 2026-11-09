<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
        <title inertia>{{ config('app.name', 'Habuilt') }}</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=20260418">
        <link rel="shortcut icon" href="/favicon.svg?v=20260418">
        <link rel="manifest" href="/manifest.webmanifest">
        <meta name="theme-color" content="#F7F8F2">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="Habuilt">
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="description" content="Habuilt is a calm habit tracker for today's list, reminders, a partner's Kept or Not yet, Sunday review, and the reward shop.">
        <meta property="og:title" content="Habuilt">
        <meta property="og:description" content="Keep today's habits, a reminder, a partner's Kept or Not yet, a Sunday review, and a reward shop.">
        <meta name="twitter:title" content="Habuilt">
        <meta name="twitter:description" content="A calm habit tracker for today's list, reminders, Sunday review, and the reward shop.">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Urbanist:wght@500;600;700;800&display=swap" rel="stylesheet">
        <meta name="habuilt-app-env" content="{{ config('services.sentry.environment') ?: config('app.env', 'production') }}">
        <script src="/boot.js"></script>
        @vite('resources/js/app.js')
        @inertiaHead
    </head>
    <body>
        @inertia
    </body>
</html>
