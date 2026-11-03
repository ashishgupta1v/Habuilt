<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Support\BrowserRefreshCookie;
use App\Support\SupabaseRefreshSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Browser session. The refresh token is an httpOnly cookie.
 * A user id in the body is ignored. The subject comes from Supabase.
 */
final class BrowserSessionController
{
    public function __construct(
        private readonly SupabaseRefreshSession $sessions,
    ) {
    }

    public function store(Request $request): JsonResponse
    {
        $refresh = $request->input('refresh_token');
        if (!is_string($refresh)) {
            return response()->json(['error' => 'A refresh token is required.'], 422);
        }

        $refresh = trim($refresh);
        if (strlen($refresh) < 10 || strlen($refresh) > 8192) {
            return response()->json(['error' => 'A refresh token is required.'], 422);
        }

        return $this->exchange($refresh);
    }

    public function show(Request $request): JsonResponse
    {
        $refresh = BrowserRefreshCookie::read($request);
        if ($refresh === null) {
            return response()->json(['error' => 'No session.'], 401);
        }

        return $this->exchange($refresh, true);
    }

    public function destroy(Request $request): JsonResponse
    {
        $refresh = BrowserRefreshCookie::read($request);
        if ($refresh !== null) {
            $this->sessions->revoke($refresh);
        }

        return BrowserRefreshCookie::forget(response()->json(['ok' => true]));
    }

    private function exchange(string $refresh, bool $clearOnFailure = false): JsonResponse
    {
        $exchanged = $this->sessions->exchange($refresh);
        if (!$exchanged['ok']) {
            $response = response()->json(['error' => 'The session could not be started.'], 401);
            return $clearOnFailure ? BrowserRefreshCookie::forget($response) : $response;
        }

        $response = response()->json([
            'user' => $exchanged['user'],
            'access_token' => $exchanged['access_token'],
            'expires_in' => $exchanged['expires_in'],
        ]);

        return BrowserRefreshCookie::attach($response, $exchanged['refresh_token']);
    }
}
