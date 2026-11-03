<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Support\Facades\Http;

/**
 * Exchanges a Supabase refresh token. The caller stores the rotated
 * refresh token in an httpOnly cookie and returns only the access token.
 */
final class SupabaseRefreshSession
{
    /**
     * @return array{ok: true, access_token: string, refresh_token: string, expires_in: int, user: array{id: string, email: string, user_metadata: array<string, mixed>}}|array{ok: false}
     */
    public function exchange(string $refreshToken): array
    {
        $url = rtrim((string) config('services.supabase.url'), '/');
        $anon = trim((string) config('services.supabase.anon_key', ''));
        if ($url === '' || $anon === '' || $refreshToken === '') {
            return ['ok' => false];
        }

        try {
            $response = Http::timeout(12)
                ->acceptJson()
                ->withHeaders([
                    'apikey' => $anon,
                    'Authorization' => 'Bearer '.$anon,
                ])
                ->post($url.'/auth/v1/token?grant_type=refresh_token', [
                    'refresh_token' => $refreshToken,
                ]);
        } catch (\Throwable) {
            return ['ok' => false];
        }

        if (!$response->successful()) {
            return ['ok' => false];
        }

        $access = $response->json('access_token');
        $refresh = $response->json('refresh_token');
        $user = $response->json('user');
        if (!is_string($access) || $access === '' || !is_string($refresh) || $refresh === '' || !is_array($user)) {
            return ['ok' => false];
        }

        $id = $user['id'] ?? '';
        if (!is_string($id) || $id === '') {
            return ['ok' => false];
        }

        $metadata = $user['user_metadata'] ?? [];

        return [
            'ok' => true,
            'access_token' => $access,
            'refresh_token' => $refresh,
            'expires_in' => (int) $response->json('expires_in', 3600),
            'user' => [
                'id' => $id,
                'email' => is_string($user['email'] ?? null) ? $user['email'] : '',
                'user_metadata' => is_array($metadata) ? $metadata : [],
            ],
        ];
    }

    public function revoke(string $refreshToken): void
    {
        $exchanged = $this->exchange($refreshToken);
        if (!$exchanged['ok']) {
            return;
        }

        $url = rtrim((string) config('services.supabase.url'), '/');
        $anon = trim((string) config('services.supabase.anon_key', ''));
        if ($url === '' || $anon === '') {
            return;
        }

        try {
            Http::timeout(8)
                ->withHeaders([
                    'apikey' => $anon,
                    'Authorization' => 'Bearer '.$exchanged['access_token'],
                ])
                ->post($url.'/auth/v1/logout');
        } catch (\Throwable) {
            // The cookie is still cleared by the caller.
        }
    }
}
