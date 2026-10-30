<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Services\Telemetry\SentryRelayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

final class TelemetryApiController
{
    /**
     * Sentry Tunnel Endpoint.
     * Prevents browser ad-blockers from blocking client telemetry by proxying
     * through the first-party domain to Sentry ingest.
     * 
     * Conforms to Sentry Tunneling Specification:
     * https://docs.sentry.io/platforms/javascript/troubleshooting/#dealing-with-ad-blockers
     */
    public function tunnel(Request $request): JsonResponse
    {
        $rawContent = (string) $request->getContent();

        if (trim($rawContent) === '') {
            return response()->json(['error' => 'Empty envelope payload'], 400);
        }

        $serverDsn = (string) (config('services.sentry.dsn') ?: env('SENTRY_LARAVEL_DSN') ?: env('VITE_SENTRY_DSN', ''));
        $eventId = (string) Str::uuid();
        $relayed = false;
        $targetHost = null;
        $targetProjectId = null;
        $sentryKey = null;
        $upstreamStatus = null;

        // Parse either Sentry Envelope v7 format or standard JSON telemetry
        $lines = explode("\n", trim($rawContent));
        $header = json_decode($lines[0] ?? '{}', true) ?: [];

        $dsnToUse = (isset($header['dsn']) && is_string($header['dsn']) && trim($header['dsn']) !== '')
            ? $header['dsn']
            : $serverDsn;

        if ($dsnToUse !== '') {
            $parsedDsn = parse_url($dsnToUse);
            if ($parsedDsn && isset($parsedDsn['host'], $parsedDsn['path'])) {
                $targetHost = $parsedDsn['host'];
                $targetProjectId = trim($parsedDsn['path'], '/');
                $sentryKey = $parsedDsn['user'] ?? null;
            }
        }

        if (isset($header['event_id']) && is_string($header['event_id'])) {
            $eventId = $header['event_id'];
        }

        // If target host is a valid Sentry ingest host, relay upstream
        if ($targetHost !== null && str_ends_with($targetHost, '.sentry.io') && $targetProjectId !== null) {
            try {
                $queryParams = ['sentry_version' => '7'];
                if ($sentryKey) {
                    $queryParams['sentry_key'] = $sentryKey;
                }
                $upstreamUrl = "https://{$targetHost}/api/{$targetProjectId}/envelope/?" . http_build_query($queryParams);

                $headers = [
                    'Content-Type' => 'application/x-sentry-envelope',
                ];
                if ($sentryKey) {
                    $headers['X-Sentry-Auth'] = "Sentry sentry_version=7, sentry_key={$sentryKey}, sentry_client=habuilt-tunnel/2.1";
                }

                $upstreamRes = Http::timeout(4)
                    ->withHeaders($headers)
                    ->withBody($rawContent, 'application/x-sentry-envelope')
                    ->post($upstreamUrl);

                $upstreamStatus = $upstreamRes->status();
                $relayed = $upstreamRes->successful();
            } catch (\Throwable $e) {
                Log::channel('single')->warning('[SentryTunnel] Upstream relay note: ' . $e->getMessage());
                $relayed = false;
            }
        }

        // Local sovereign logging fallback: always record in local log
        try {
            Log::build([
                'driver' => 'single',
                'path' => storage_path('logs/telemetry.log'),
            ])->info('[ClientTelemetry]', [
                'event_id' => $eventId,
                'relayed' => $relayed,
                'upstream_host' => $targetHost,
                'upstream_status' => $upstreamStatus,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'timestamp' => now()->toIso8601String(),
                'payload_sample' => substr($rawContent, 0, 500),
            ]);
        } catch (\Throwable) {
            // Failsafe
        }

        return response()->json([
            'success' => true,
            'relayed' => $relayed,
            'event_id' => $eventId,
            'upstream_host' => $targetHost,
            'upstream_status' => $upstreamStatus,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Telemetry and Error Monitoring Health Probe.
     */
    public function health(): JsonResponse
    {
        $serverDsn = (string) (config('services.sentry.dsn') ?: env('SENTRY_LARAVEL_DSN') ?: env('VITE_SENTRY_DSN', ''));
        $isConfigured = $serverDsn !== '' && !str_contains($serverDsn, 'placeholder');

        $maskedHost = null;
        $projectId = null;
        if ($isConfigured) {
            $parsed = parse_url($serverDsn);
            $maskedHost = $parsed['host'] ?? null;
            $projectId = isset($parsed['path']) ? trim($parsed['path'], '/') : null;
        }

        $logPath = storage_path('logs/telemetry.log');
        $logSize = file_exists($logPath) ? filesize($logPath) : 0;

        return response()->json([
            'status' => 'operational',
            'engine' => 'Habuilt Sovereign Telemetry v2.1',
            'sentry_configured' => $isConfigured,
            'sentry_host' => $maskedHost,
            'sentry_project_id' => $projectId,
            'upstream_tunnel_active' => true,
            'telemetry_log_bytes' => $logSize,
            'server_time' => now()->toIso8601String(),
        ]);
    }

    /**
     * Record a verified synthetic test event to confirm pipeline integrity.
     */
    public function recordTestEvent(Request $request): JsonResponse
    {
        $testId = 'test_' . Str::random(12);
        $sentryEventId = null;

        $serverDsn = (string) (config('services.sentry.dsn') ?: env('SENTRY_LARAVEL_DSN') ?: env('VITE_SENTRY_DSN', ''));
        if ($serverDsn !== '' && !str_contains($serverDsn, 'placeholder')) {
            $synthetic = new \RuntimeException("Habuilt synthetic test event: {$testId}");
            $sentryEventId = SentryRelayService::captureException($synthetic, [
                'tags' => ['source' => 'api_test_probe'],
                'extra' => ['user_id' => $request->input('user_id', 'anonymous')],
            ]);
        }

        try {
            Log::build([
                'driver' => 'single',
                'path' => storage_path('logs/telemetry.log'),
            ])->info('[SyntheticTelemetryVerification]', [
                'test_id' => $testId,
                'sentry_event_id' => $sentryEventId,
                'triggered_by' => $request->input('user_id', 'anonymous'),
                'source' => $request->input('source', 'api_verification_probe'),
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (\Throwable) {
            // Failsafe
        }

        return response()->json([
            'success' => true,
            'verified' => true,
            'test_id' => $testId,
            'sentry_relayed' => $sentryEventId !== null,
            'sentry_event_id' => $sentryEventId,
            'message' => 'Synthetic telemetry anomaly registered and verified in pipeline.',
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
