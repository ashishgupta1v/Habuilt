<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\Cookie;
use Tests\TestCase;

final class BrowserSessionAndContentPolicyTest extends TestCase
{
    public function test_session_cookie_is_http_only_and_forged_body_user_id_is_rejected(): void
    {
        config([
            'services.supabase.url' => 'https://auth.test.supabase.co',
            'services.supabase.anon_key' => 'test-anon-key',
        ]);

        $access = $this->createMockJwt('usr_real');
        Http::fake([
            'https://auth.test.supabase.co/auth/v1/*' => function ($request) use ($access) {
                if (str_contains($request->url(), '/auth/v1/logout')) {
                    return Http::response('', 204);
                }

                $data = $request->data();
                if (array_key_exists('user_id', $data)) {
                    return Http::response(['error' => 'user id must not be forwarded'], 500);
                }

                return Http::response([
                    'access_token' => $access,
                    'refresh_token' => 'rotated-refresh-token-value',
                    'expires_in' => 3600,
                    'user' => [
                        'id' => 'usr_real',
                        'email' => 'real@example.com',
                        'user_metadata' => ['full_name' => 'Real'],
                    ],
                ]);
            },
        ]);

        $response = $this->postJson('/api/auth/session', [
            'refresh_token' => 'client-refresh-token-value',
            'user_id' => 'usr_forged',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.id', 'usr_real');
        $this->assertArrayNotHasKey('refresh_token', $response->json());
        $this->assertStringNotContainsString('usr_forged', $response->getContent());
        $this->assertStringNotContainsString('client-refresh-token-value', $response->getContent());
        $this->assertStringNotContainsString('rotated-refresh-token-value', $response->getContent());

        $cookie = $this->cookieNamed($response->headers->getCookies(), 'habuilt_refresh');
        $this->assertInstanceOf(Cookie::class, $cookie);
        $this->assertTrue($cookie->isHttpOnly());
        $this->assertTrue($cookie->isSecure());
        $this->assertSame('lax', strtolower((string) $cookie->getSameSite()));

        $setCookie = (string) $response->headers->get('set-cookie');
        $this->assertStringContainsString('httponly', strtolower($setCookie));
        $this->assertStringContainsString('secure', strtolower($setCookie));
        $this->assertStringNotContainsString('client-refresh-token-value', $setCookie);
        $this->assertStringNotContainsString('rotated-refresh-token-value', $setCookie);

        $this->withHeader('Authorization', 'Bearer '.$access)
            ->postJson('/api/user-settings', [
                'user_id' => 'usr_forged',
                'day_type' => 'home',
            ])
            ->assertStatus(403)
            ->assertJsonPath('error', 'Forbidden: Cannot access or mutate another user\'s records');

        $cleared = $this->deleteJson('/api/auth/session');
        $cleared->assertOk();
        $clearing = $this->cookieNamed($cleared->headers->getCookies(), 'habuilt_refresh');
        $this->assertInstanceOf(Cookie::class, $clearing);
        $this->assertTrue($clearing->isHttpOnly());
        $this->assertLessThan(time(), $clearing->getExpiresTime());
    }

    public function test_boot_script_is_external_and_medical_copy_names_habuilt(): void
    {
        $blade = (string) file_get_contents(base_path('resources/views/app.blade.php'));
        $policy = (string) file_get_contents(base_path('deploy/nginx/security-headers.conf'));
        $logo = (string) file_get_contents(base_path('resources/js/Components/Brand/HabuiltLogo.vue'));
        $disclaimer = (string) file_get_contents(base_path('resources/js/Pages/Disclaimer.vue'));
        $boot = (string) file_get_contents(base_path('public/boot.js'));

        $this->assertStringContainsString('src="/boot.js"', $blade);
        $this->assertDoesNotMatchRegularExpression('/<script(?![^>]*\bsrc=)[^>]*>/', $blade);
        $this->assertStringContainsString('window.__HABUILT_APP_ENV__', $boot);
        $this->assertDoesNotMatchRegularExpression("/script-src[^;]*unsafe-inline/", $policy);
        $this->assertMatchesRegularExpression("/script-src 'self'/", $policy);
        $this->assertStringNotContainsString('by ZoetiCoach', $logo);
        $this->assertStringNotContainsString('coaching reflections', $disclaimer);
        $this->assertStringContainsString('optional server forwarder', $disclaimer);

        foreach ([
            'resources/js/lib/supabase.js',
            'resources/js/lib/browserSession.js',
            'resources/js/Pages/Main.vue',
            'resources/js/Pages/Auth.vue',
            'resources/js/lib/zoetiCoachBridge.js',
            'resources/js/Composables/useNativeWidget.js',
        ] as $path) {
            $source = (string) file_get_contents(base_path($path));
            $this->assertDoesNotMatchRegularExpression(
                "/localStorage\.setItem\(\s*['\"]habuilt_cached_user/",
                $source,
                $path
            );
        }
    }

    /**
     * @param array<int, Cookie> $cookies
     */
    private function cookieNamed(array $cookies, string $name): ?Cookie
    {
        foreach ($cookies as $cookie) {
            if ($cookie->getName() === $name) {
                return $cookie;
            }
        }

        return null;
    }
}
