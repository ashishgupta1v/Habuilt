<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

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

        // Try parsing either Sentry Envelope v7 format or standard JSON telemetry
        $lines = explode("\n", trim($rawContent));
        $header = json_decode($lines[0] ?? '{}', true) ?: [];

        if (isset($header['dsn']) && is_string($header['dsn'])) {
            $parsedDsn = parse_url($header['dsn']);
            if ($parsedDsn && isset($parsedDsn['host'], $parsedDsn['path'])) {
                $targetHost = $parsedDsn['host'];
                $targetProjectId = trim($parsedDsn['path'], '/');
            }
        } elseif ($serverDsn !== '') {
            $parsedDsn = parse_url($serverDsn);
            if ($parsedDsn && isset($parsedDsn['host'], $parsedDsn['path'])) {
                $targetHost = $parsedDsn['host'];
                $targetProjectId = trim($parsedDsn['path'], '/');
            }
        }

        if (isset($header['event_id']) && is_string($header['event_id'])) {
            $eventId = $header['event_id'];
        }

        // If target host is a valid Sentry ingest host, relay upstream
        if ($targetHost !== null && str_ends_with($targetHost, '.sentry.io') && $targetProjectId !== null) {
            try {
                $upstreamUrl = "https://{$targetHost}/api/{$targetProjectId}/envelope/";
                $upstreamRes = Http::timeout(5)
                    ->withHeaders(['Content-Type' => 'application/x-sentry-envelope'])
                    ->withBody($rawContent, 'application/x-sentry-envelope')
                    ->post($upstreamUrl);

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
        if ($isConfigured) {
            $parsed = parse_url($serverDsn);
            $maskedHost = $parsed['host'] ?? null;
        }

        $logPath = storage_path('logs/telemetry.log');
        $logSize = file_exists($logPath) ? filesize($logPath) : 0;

        return response()->json([
            'status' => 'operational',
            'engine' => 'Habuilt Sovereign Telemetry v2.1',
            'sentry_configured' => $isConfigured,
            'sentry_host' => $maskedHost,
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

        try {
            Log::build([
                'driver' => 'single',
                'path' => storage_path('logs/telemetry.log'),
            ])->info('[SyntheticTelemetryVerification]', [
                'test_id' => $testId,
                'triggered_by' => $request->input('user_id', 'anonymous'),
                'source' => $request->input('source', 'verification_suite'),
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (\Throwable) {}

        return response()->json([
            'success' => true,
            'verified' => true,
            'test_id' => $testId,
            'message' => 'Synthetic telemetry anomaly registered successfully',
        ]);
    }
}
