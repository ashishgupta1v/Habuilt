<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class VerifyApiAuthorization
{
    /**
     * Handle an incoming API request.
     * Enforces token validation, expiration checks, and prevents IDOR user mismatch.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. In testing environment, allow test bypass if test header is explicitly set
        if (app()->environment('testing') && $request->hasHeader('X-Test-User-Id')) {
            $testUserId = (string) $request->header('X-Test-User-Id');
            $request->attributes->set('auth_user_id', $testUserId);
            $targetUserId = $request->input('user_id') ?: $request->query('user_id');
            if ($targetUserId !== null && $targetUserId !== '' && (string) $targetUserId !== $testUserId) {
                return new JsonResponse(['error' => 'Forbidden: user mismatch'], 403);
            }
            return $next($request);
        }

        // 2. Extract Bearer token from Authorization header
        $authHeader = (string) $request->header('Authorization', '');
        if (!preg_match('/^Bearer\s+(.+)$/i', $authHeader, $matches)) {
            return new JsonResponse([
                'error' => 'Unauthenticated: Bearer authorization token required',
            ], 401);
        }

        $token = trim($matches[1]);
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return new JsonResponse([
                'error' => 'Unauthenticated: Malformed token structure',
            ], 401);
        }

        [$headerB64, $payloadB64, $sigB64] = $parts;

        $payloadJson = $this->base64UrlDecode($payloadB64);
        $payload = json_decode($payloadJson, true);

        if (!is_array($payload) || !isset($payload['sub'])) {
            return new JsonResponse([
                'error' => 'Unauthenticated: Invalid token payload',
            ], 401);
        }

        // 3. Expiration check
        if (isset($payload['exp']) && is_numeric($payload['exp']) && (int) $payload['exp'] < time()) {
            return new JsonResponse([
                'error' => 'Unauthenticated: Token has expired',
            ], 401);
        }

        // 4. Cryptographic signature check (when secret configured)
        $jwtSecret = (string) (config('services.supabase.jwt_secret') ?: env('SUPABASE_JWT_SECRET', ''));
        if ($jwtSecret !== '') {
            $expectedSignature = hash_hmac('sha256', "{$headerB64}.{$payloadB64}", $jwtSecret, true);
            $actualSignature = $this->base64UrlDecode($sigB64);

            if (!hash_equals($expectedSignature, $actualSignature)) {
                return new JsonResponse([
                    'error' => 'Unauthenticated: Invalid cryptographic signature',
                ], 401);
            }
        }

        $authenticatedUserId = (string) $payload['sub'];
        $request->attributes->set('auth_user_id', $authenticatedUserId);

        // 5. Prevent Insecure Direct Object Reference (IDOR)
        $targetUserId = $request->input('user_id') ?: $request->query('user_id');
        if ($targetUserId !== null && $targetUserId !== '' && (string) $targetUserId !== $authenticatedUserId) {
            return new JsonResponse([
                'error' => 'Forbidden: Cannot access or mutate another user\'s records',
            ], 403);
        }

        // If target user_id wasn't provided, ensure request body/params receive authenticated user
        if ($targetUserId === null || $targetUserId === '') {
            $request->merge(['user_id' => $authenticatedUserId]);
        }

        return $next($request);
    }

    /**
     * Decode standard Base64URL string.
     */
    private function base64UrlDecode(string $input): string
    {
        $remainder = strlen($input) % 4;
        if ($remainder) {
            $padLen = 4 - $remainder;
            $input .= str_repeat('=', $padLen);
        }
        $decoded = base64_decode(strtr($input, '-_', '+/'), true);
        return $decoded !== false ? $decoded : '';
    }
}
