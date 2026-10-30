<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Services\Telemetry\SentryRelayService;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

final class TelemetryTunnelAndHealthTest extends TestCase
{
    public function test_telemetry_health_endpoint_returns_operational_status(): void
    {
        $response = $this->getJson('/api/telemetry/health');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'operational',
                'engine' => 'Habuilt Sovereign Telemetry v2.1',
                'upstream_tunnel_active' => true,
            ])
            ->assertJsonStructure([
                'status',
                'engine',
                'sentry_configured',
                'upstream_tunnel_active',
                'server_time',
            ]);
    }

    public function test_telemetry_health_reflects_sentry_dsn_configuration(): void
    {
        Config::set('services.sentry.dsn', 'https://testkey123@o999999.ingest.sentry.io/4508900');

        $response = $this->getJson('/api/telemetry/health');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'operational',
                'sentry_configured' => true,
                'sentry_host' => 'o999999.ingest.sentry.io',
                'sentry_project_id' => '4508900',
            ]);
    }

    public function test_sentry_tunnel_rejects_empty_payload(): void
    {
        $response = $this->call(
            'POST',
            '/api/telemetry/tunnel',
            [],
            [],
            [],
            ['CONTENT_TYPE' => 'text/plain'],
            ''
        );

        $response->assertStatus(400)
            ->assertJson(['error' => 'Empty envelope payload']);
    }

    public function test_sentry_tunnel_accepts_and_logs_valid_sentry_envelope_in_sovereign_mode(): void
    {
        $eventId = '9ec6b95b45c24e6ca6f4b68ef5c1114b';
        $header = json_encode(['event_id' => $eventId, 'sent_at' => now()->toIso8601String()]);
        $itemHeader = json_encode(['type' => 'event', 'content_type' => 'application/json']);
        $payload = json_encode([
            'event_id' => $eventId,
            'message' => 'PHPUnit Test Telemetry Interception',
            'level' => 'error',
            'platform' => 'javascript',
        ]);

        $envelopeContent = "{$header}\n{$itemHeader}\n{$payload}";

        $response = $this->call(
            'POST',
            '/api/telemetry/tunnel',
            [],
            [],
            [],
            ['CONTENT_TYPE' => 'text/plain'],
            $envelopeContent
        );

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'event_id' => $eventId,
            ]);
    }

    public function test_sentry_tunnel_relays_upstream_when_target_host_is_sentry(): void
    {
        Http::fake([
            '*ingest.sentry.io*' => Http::response(['id' => 'sentry_upstream_ok'], 200),
        ]);

        $eventId = '8ab7c65d45c24e6ca6f4b68ef5c2225c';
        $header = json_encode([
            'event_id' => $eventId,
            'sent_at' => now()->toIso8601String(),
            'dsn' => 'https://testkey123@o999999.ingest.sentry.io/4508900',
        ]);
        $itemHeader = json_encode(['type' => 'event', 'content_type' => 'application/json']);
        $payload = json_encode(['event_id' => $eventId, 'level' => 'error']);

        $envelopeContent = "{$header}\n{$itemHeader}\n{$payload}";

        $response = $this->call(
            'POST',
            '/api/telemetry/tunnel',
            [],
            [],
            [],
            ['CONTENT_TYPE' => 'text/plain'],
            $envelopeContent
        );

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'relayed' => true,
                'upstream_host' => 'o999999.ingest.sentry.io',
                'upstream_status' => 200,
            ]);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'o999999.ingest.sentry.io/api/4508900/envelope')
                && str_contains($request->url(), 'sentry_key=testkey123');
        });
    }

    public function test_sentry_backend_relay_service_dispatches_envelope(): void
    {
        Http::fake([
            '*ingest.sentry.io*' => Http::response(['id' => 'backend_sentry_ok'], 200),
        ]);

        Config::set('services.sentry.dsn', 'https://backendkey@o888888.ingest.sentry.io/123456');

        $exception = new \RuntimeException('Backend Laravel unhandled test exception');
        $eventId = SentryRelayService::captureException($exception, [
            'tags' => ['module' => 'phpunit_test'],
        ]);

        $this->assertNotNull($eventId);
        $this->assertEquals(32, strlen($eventId));

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'o888888.ingest.sentry.io/api/123456/envelope')
                && $request->header('Content-Type')[0] === 'application/x-sentry-envelope'
                && str_contains($request->body(), 'Backend Laravel unhandled test exception');
        });
    }

    public function test_artisan_sentry_test_command_executes(): void
    {
        Http::fake([
            '*ingest.sentry.io*' => Http::response(['id' => 'cli_ok'], 200),
        ]);

        $this->artisan('sentry:test', [
            'dsn' => 'https://clikey@o777777.ingest.sentry.io/987654',
        ])
            ->expectsOutputToContain('Testing Sentry upstream connectivity with DSN: https://***@o777777.ingest.sentry.io/987654')
            ->expectsOutputToContain('SUCCESS: Synthetic event')
            ->assertExitCode(0);
    }

    public function test_telemetry_test_event_registers_synthetic_anomaly(): void
    {
        $response = $this->postJson('/api/telemetry/test-event', [
            'user_id' => 'ashish_probe',
            'source' => 'phpunit_verification',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'verified' => true,
            ])
            ->assertJsonStructure([
                'success',
                'verified',
                'test_id',
                'message',
            ]);
    }
}
