<?php

declare(strict_types=1);

namespace App\Services\Telemetry;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

final class SentryRelayService
{
    /**
     * Report an unhandled exception or synthetic event to the configured Sentry DSN.
     *
     * @param Throwable $e
     * @param array<string, mixed> $context
     * @param string|null $overrideDsn
     * @return string|null The Sentry event UUID if relayed successfully, or null
     */
    public static function captureException(Throwable $e, array $context = [], ?string $overrideDsn = null): ?string
    {
        $dsn = (string) ($overrideDsn ?: config('services.sentry.dsn') ?: env('SENTRY_LARAVEL_DSN') ?: env('VITE_SENTRY_DSN', ''));
        if ($dsn === '' || str_contains($dsn, 'placeholder')) {
            return null;
        }

        $parsed = parse_url($dsn);
        if (!$parsed || !isset($parsed['host'], $parsed['path'])) {
            return null;
        }

        $host = $parsed['host'];
        $projectId = trim($parsed['path'], '/');
        $key = $parsed['user'] ?? null;
        $eventId = str_replace('-', '', (string) Str::uuid());

        $envelopeHeader = json_encode([
            'event_id' => $eventId,
            'sent_at' => now()->toIso8601String(),
            'dsn' => $dsn,
        ], JSON_UNESCAPED_SLASHES);

        $itemHeader = json_encode([
            'type' => 'event',
            'content_type' => 'application/json',
        ], JSON_UNESCAPED_SLASHES);

        $payload = json_encode([
            'event_id' => $eventId,
            'timestamp' => microtime(true),
            'platform' => 'php',
            'level' => 'error',
            'logger' => 'laravel.exception',
            'environment' => config('services.sentry.environment', config('app.env', 'production')),
            'release' => 'habuilt@1.0.0',
            'server_name' => gethostname() ?: 'habuilt-hostinger-kvm',
            'exception' => [
                'values' => [
                    [
                        'type' => get_class($e),
                        'value' => $e->getMessage(),
                        'stacktrace' => [
                            'frames' => array_slice(array_map(function ($frame) {
                                return [
                                    'filename' => $frame['file'] ?? '[internal]',
                                    'lineno' => $frame['line'] ?? 0,
                                    'function' => $frame['function'] ?? '[closure]',
                                ];
                            }, $e->getTrace()), 0, 20),
                        ],
                    ],
                ],
            ],
            'tags' => array_merge([
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'server' => 'Hostinger KVM 2',
            ], $context['tags'] ?? []),
            'extra' => array_merge([
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'code' => $e->getCode(),
            ], $context['extra'] ?? []),
        ], JSON_UNESCAPED_SLASHES);

        $envelope = "{$envelopeHeader}\n{$itemHeader}\n{$payload}\n";

        try {
            $queryParams = ['sentry_version' => '7'];
            if ($key) {
                $queryParams['sentry_key'] = $key;
            }
            $url = "https://{$host}/api/{$projectId}/envelope/?" . http_build_query($queryParams);

            $headers = [
                'Content-Type' => 'application/x-sentry-envelope',
            ];
            if ($key) {
                $headers['X-Sentry-Auth'] = "Sentry sentry_version=7, sentry_key={$key}, sentry_client=habuilt-laravel/2.1";
            }

            $response = Http::timeout(4)
                ->withHeaders($headers)
                ->withBody($envelope, 'application/x-sentry-envelope')
                ->post($url);

            if ($response->successful()) {
                return $eventId;
            }

            Log::channel('single')->warning('[SentryRelayService] Relay response non-2xx: ' . $response->status());
            return null;
        } catch (Throwable $dispatchError) {
            Log::channel('single')->warning('[SentryRelayService] Relay dispatch failed: ' . $dispatchError->getMessage());
            return null;
        }
    }
}
