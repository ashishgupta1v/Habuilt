<?php

declare(strict_types=1);

use App\Services\Telemetry\SentryRelayService;
use Illuminate\Support\Facades\Artisan;

Artisan::command('warrior:ping', function (): void {
    $this->info('Warrior Tracker console kernel is up.');
})->purpose('Sanity check command for bootstrap readiness.');

Artisan::command('sentry:test {dsn?}', function (?string $dsn = null): void {
    $dsnToTest = $dsn ?: (string) config('services.sentry.dsn', '');
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
        $content = preg_replace('/^VITE_SENTRY_DSN=.*$/m', 'VITE_SENTRY_DSN=', $content);
    }

    file_put_contents($envFile, $content);
    $this->info(' Successfully updated SENTRY_LARAVEL_DSN in .env. The browser bundle is not given the DSN.');
    $this->call('config:clear');
})->purpose('Configure SENTRY_LARAVEL_DSN in .env and refresh config cache.');

Artisan::command('habuilt:secure-ledger', function (): int {
    try {
        $result = (new \App\Services\Ledger\SpaLedgerGuard())->ensure();
    } catch (\App\Services\Ledger\CheckInConstraintConflict $exception) {
        $this->error($exception->getMessage());
        $this->error('conflicting_groups='.$exception->conflictingGroups);
        $this->error('unique_index=not_created');
        $this->error('rls=not_applied');

        return 1;
    }

    $collapse = $result['collapse'];
    $this->info('collapsed_groups='.$collapse['collapsed_groups']);
    $this->info('conflicting_groups='.$collapse['conflicting_groups']);
    $this->info('unique_index='.$result['unique_index']);
    $this->info('rls='.$result['rls']);

    if ($collapse['aborted'] || $result['unique_index'] === 'not_created') {
        $this->error('Unique check-in constraint was not created.');

        return 1;
    }

    return 0;
})->purpose('Collapse safe duplicate check-ins, add the unique key, and apply Supabase row-level security.');
