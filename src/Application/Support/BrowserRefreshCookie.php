<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Symfony\Component\HttpFoundation\Cookie;

/**
 * Refresh token cookie. Page scripts cannot read it.
 * The value is encrypted with the application key.
 */
final class BrowserRefreshCookie
{
    public const NAME = 'habuilt_refresh';

    public static function attach(JsonResponse $response, string $refreshToken): JsonResponse
    {
        return $response->withCookie(self::make(Crypt::encryptString($refreshToken), 60 * 24 * 30));
    }

    public static function forget(JsonResponse $response): JsonResponse
    {
        return $response->withCookie(self::make('', -1));
    }

    public static function read(Request $request): ?string
    {
        $value = $request->cookie(self::NAME);
        if (!is_string($value) || $value === '') {
            return null;
        }

        try {
            $refresh = Crypt::decryptString($value);
        } catch (\Throwable) {
            return null;
        }

        return $refresh !== '' ? $refresh : null;
    }

    private static function make(string $value, int $minutes): Cookie
    {
        return cookie(self::NAME, $value, $minutes, '/', null, true, true, false, 'lax');
    }
}
