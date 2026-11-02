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
     * Same-origin Sentry tunnel.
     * Relays only to the DSN in server config. Envelope host and project must match.
     * The DSN secret is not logged and is not required from the browser.
     */
    public function tunnel(Request $request): JsonResponse
    {
        $rawContent = (string) $request->getContent();

        if (trim($rawContent) === '') {
            return response()->json(['error' => 'Empty envelope payload'], 400);
        }

        $configured = $this->configuredDsn();
        if ($configured === null) {
            return response()->json(['error' => 'Telemetry relay is not configured'], 503);
        }

        $lines = explode("\n", trim($rawContent));
        $header = json_decode($lines[0] ?? '{}', true);
        if (!is_array($header)) {
            $header = [];
        }

        $eventId = (isset($header['event_id']) && is_string($header['event_id']) && $header['event_id'] !== '')
            ? $header['event_id']
            : (string) Str::uuid();

        if (isset($header['dsn']) && is_string($header['dsn']) && trim($header['dsn']) !== '') {
            $envelope = $this->parseDsn($header['dsn']);
            if ($envelope === null
                || $envelope['host'] !== $configured['host']
                || $envelope['project'] !== $configured['project']) {
                return response()->json([
                    'error' => 'Envelope target does not match the configured Sentry project',
                ], 403);
            }
        }

        $relayed = false;
        $upstreamStatus = null;

        try {
            $queryParams = [
                'sentry_version' => '7',
                'sentry_key' => $configured['key'],
            ];
            $upstreamUrl = "https://{$configured['host']}/api/{$configured['project']}/envelope/?".http_build_query($queryParams);

            $upstreamRes = Http::timeout(4)
                ->withHeaders([
                    'Content-Type' => 'application/x-sentry-envelope',
                    'X-Sentry-Auth' => 'Sentry sentry_version=7, sentry_key='.$configured['key'].', sentry_client=habuilt-tunnel/2.1',
                ])
                ->withBody($rawContent, 'application/x-sentry-envelope')
                ->post($upstreamUrl);

            $upstreamStatus = $upstreamRes->status();
            $relayed = $upstreamRes->successful();
        } catch (\Throwable) {
            Log::channel('single')->warning('[SentryTunnel] Upstream relay failed');
            $relayed = false;
        }

        try {
            Log::build([
                'driver' => 'single',
                'path' => storage_path('logs/telemetry.log'),
            ])->info('[ClientTelemetry]', [
                'event_id' => $eventId,
                'relayed' => $relayed,
                'upstream_status' => $upstreamStatus,
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (\Throwable) {
            // Failsafe
        }

        return response()->json([
            'success' => true,
            'relayed' => $relayed,
            'event_id' => $eventId,
            'upstream_host' => $configured['host'],
            'upstream_status' => $upstreamStatus,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Telemetry health. Reports whether a DSN is configured without revealing the secret.
     */
    public function health(): JsonResponse
    {
        $configured = $this->configuredDsn();
        $logPath = storage_path('logs/telemetry.log');
        $logSize = file_exists($logPath) ? filesize($logPath) : 0;

        return response()->json([
            'status' => 'operational',
            'engine' => 'Habuilt Sovereign Telemetry v2.1',
            'sentry_configured' => $configured !== null,
            'sentry_host' => $configured['host'] ?? null,
            'sentry_project_id' => $configured['project'] ?? null,
            'upstream_tunnel_active' => true,
            'telemetry_log_bytes' => $logSize,
            'server_time' => now()->toIso8601String(),
        ]);
    }

    /**
     * @return array{host: string, project: string, key: string}|null
     */
    private function configuredDsn(): ?array
    {
        $dsn = trim((string) config('services.sentry.dsn', ''));
        if ($dsn === '' || str_contains($dsn, 'placeholder')) {
            return null;
        }

        $parsed = $this->parseDsn($dsn);
        if ($parsed === null || !str_ends_with($parsed['host'], '.sentry.io')) {
            return null;
        }

        return $parsed;
    }

    /**
     * @return array{host: string, project: string, key: string}|null
     */
    private function parseDsn(string $dsn): ?array
    {
        $parsed = parse_url(trim($dsn));
        if (!is_array($parsed) || empty($parsed['host']) || empty($parsed['path']) || empty($parsed['user'])) {
            return null;
        }

        $project = trim((string) $parsed['path'], '/');
        if ($project === '') {
            return null;
        }

        return [
            'host' => strtolower((string) $parsed['host']),
            'project' => $project,
            'key' => (string) $parsed['user'],
        ];
    }
}
