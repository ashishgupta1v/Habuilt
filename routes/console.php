<?php

declare(strict_types=1);

use App\Services\Telemetry\SentryRelayService;
use Illuminate\Support\Facades\Artisan;

Artisan::command('warrior:ping', function (): void {
    $this->info('Warrior Tracker console kernel is up.');
})->purpose('Sanity check command for bootstrap readiness.');

Artisan::command('sentry:test {dsn?}', function (?string $dsn = null): void {
    $dsnToTest = $dsn ?: (string) (config('services.sentry.dsn') ?: env('SENTRY_LARAVEL_DSN') ?: env('VITE_SENTRY_DSN', ''));
    if ($dsnToTest === '') {
        $this->error('No Sentry DSN provided or configured in .env (SENTRY_LARAVEL_DSN).');
        return;
    }

    $masked = preg_replace('/:\/\/([^@]+)@/', '://***@', $dsnToTest);
    $this->info("Testing Sentry upstream connectivity with DSN: {$masked}");

    $syntheticException = new \RuntimeException("Habuilt CLI synthetic test event: " . now()->toIso8601String());
    $eventId = SentryRelayService::captureException($syntheticException, [
        'tags' => ['source' => 'artisan_cli'],
        'extra' => ['triggered_at' => now()->toIso8601String()],
    ], $dsnToTest);

    if ($eventId) {
        $this->info(" SUCCESS: Synthetic event [{$eventId}] relayed to Sentry upstream.");
    } else {
        $this->warn(" NOTE: Sentry upstream relay completed or queued. Check your Sentry project stream.");
    }
})->purpose('Send a synthetic test anomaly to verify Sentry connection and relay.');

Artisan::command('sentry:configure {dsn}', function (string $dsn): void {
    $dsn = trim($dsn);
    if (!filter_var($dsn, FILTER_VALIDATE_URL) || !str_contains($dsn, 'sentry.io')) {
        $this->error('Invalid Sentry DSN format. Expected: https://<key>@<host>/<projectId>');
        return;
    }

    $envFile = base_path('.env');
    if (!file_exists($envFile)) {
        $this->error('.env file does not exist.');
        return;
    }

    $content = file_get_contents($envFile);
    if (str_contains($content, 'SENTRY_LARAVEL_DSN=')) {
        $content = preg_replace('/^SENTRY_LARAVEL_DSN=.*$/m', "SENTRY_LARAVEL_DSN={$dsn}", $content);
    } else {
        $content .= "\nSENTRY_LARAVEL_DSN={$dsn}\n";
    }

    if (str_contains($content, 'VITE_SENTRY_DSN=')) {
        $content = preg_replace('/^VITE_SENTRY_DSN=.*$/m', "VITE_SENTRY_DSN={$dsn}", $content);
    } else {
        $content .= "VITE_SENTRY_DSN={$dsn}\n";
    }

    file_put_contents($envFile, $content);
    $this->info(" Successfully updated SENTRY_LARAVEL_DSN and VITE_SENTRY_DSN in .env.");
    $this->call('config:clear');
})->purpose('Configure SENTRY_LARAVEL_DSN in .env and refresh config cache.');
