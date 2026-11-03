<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Support\SupabaseAccessToken;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class VerifyApiAuthorization
{
    public function __construct(
        private readonly SupabaseAccessToken $tokens,
    ) {
    }

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

        $verified = $this->tokens->verify(trim($matches[1]));
        if (!$verified['ok']) {
            return new JsonResponse([
                'error' => $verified['error'],
            ], 401);
        }

        $authenticatedUserId = $verified['sub'];
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
}
