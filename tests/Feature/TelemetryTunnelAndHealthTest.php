<?php

declare(strict_types=1);

namespace Tests\Feature;

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
            ])
            ->assertJsonStructure([
                'status',
                'engine',
                'sentry_configured',
                'server_time',
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

    public function test_sentry_tunnel_accepts_and_logs_valid_sentry_envelope(): void
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
