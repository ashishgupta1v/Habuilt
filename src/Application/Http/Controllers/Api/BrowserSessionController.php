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
            return $this->jsonNoCache(['error' => 'A refresh token is required.'], 422);
        }

        $refresh = trim($refresh);
        if (strlen($refresh) < 10 || strlen($refresh) > 8192) {
            return $this->jsonNoCache(['error' => 'A refresh token is required.'], 422);
        }

        return $this->exchange($request, $refresh);
    }

    public function show(Request $request): JsonResponse
    {
        $refresh = BrowserRefreshCookie::read($request);
        if ($refresh === null) {
            return $this->jsonNoCache(['error' => 'No session.'], 401);
        }

        return $this->exchange($request, $refresh, true);
    }

    public function destroy(Request $request): JsonResponse
    {
        $refresh = BrowserRefreshCookie::read($request);
        if ($refresh === null && $this->wantsNativeRefresh($request)) {
            $refresh = $this->nativeRefreshFromBody($request);
        }
        if ($refresh !== null) {
            $this->sessions->revoke($refresh);
        }

        return BrowserRefreshCookie::forget($this->jsonNoCache(['ok' => true]));
    }

    private function wantsNativeRefresh(Request $request): bool
    {
        return $request->header('X-Habuilt-Client') === 'native';
    }

    private function nativeRefreshFromBody(Request $request): ?string
    {
        $refresh = $request->input('refresh_token');
        if (!is_string($refresh)) {
            return null;
        }
        $refresh = trim($refresh);
        if (strlen($refresh) < 10 || strlen($refresh) > 8192) {
            return null;
        }

        return $refresh;
    }

    private function exchange(Request $request, string $refresh, bool $clearOnFailure = false): JsonResponse
    {
        $exchanged = $this->sessions->exchange($refresh);
        if (!$exchanged['ok']) {
            $response = $this->jsonNoCache(['error' => 'The session could not be started.'], 401);
            return $clearOnFailure ? BrowserRefreshCookie::forget($response) : $response;
        }

        $payload = [
            'user' => $exchanged['user'],
            'access_token' => $exchanged['access_token'],
            'expires_in' => $exchanged['expires_in'],
        ];
        if ($this->wantsNativeRefresh($request)) {
            $payload['refresh_token'] = $exchanged['refresh_token'];
        }

        $response = $this->jsonNoCache($payload);

        return BrowserRefreshCookie::attach($response, $exchanged['refresh_token']);
    }

    /**
     * @param array<string, mixed> $data
     */
    private function jsonNoCache(array $data, int $status = 200): JsonResponse
    {
        return response()->json($data, $status)
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            ->header('Pragma', 'no-cache');
    }
}
