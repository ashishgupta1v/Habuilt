<?php

declare(strict_types=1);

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected const TEST_JWT_SECRET = 'habuilt-test-only-jwt-secret';

    protected function setUp(): void
    {
        parent::setUp();

        $secret = config('services.supabase.jwt_secret');
        if (!is_string($secret) || $secret === '') {
            config(['services.supabase.jwt_secret' => self::TEST_JWT_SECRET]);
        }

        // Keep real server credentials out of the test process even if a local env file is present.
        config([
            'services.zoeticoach.api_key' => '',
            'services.zoeticoach.api_url' => '',
            'services.supabase.service_role_key' => '',
            'services.supabase.url' => '',
        ]);
    }

    /**
     * Sign a test JWT the same way VerifyApiAuthorization checks it:
     * HMAC-SHA256 over base64url(header).base64url(payload).
     */
    protected function createMockJwt(string $userId, int $ttl = 3600, ?string $secret = null): string
    {
        $signingSecret = $secret ?? (string) config('services.supabase.jwt_secret');
        $header = $this->base64UrlEncode((string) json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = $this->base64UrlEncode((string) json_encode([
            'sub' => $userId,
            'exp' => time() + $ttl,
            'aud' => 'authenticated',
            'role' => 'authenticated',
        ]));
        $signature = $this->base64UrlEncode(hash_hmac('sha256', $header.'.'.$payload, $signingSecret, true));

        return $header.'.'.$payload.'.'.$signature;
    }

    protected function base64UrlEncode(string $input): string
    {
        return rtrim(strtr(base64_encode($input), '+/', '-_'), '=');
    }
}
