<?php

declare(strict_types=1);

/**
 * Reports whether an override URL is sending Laravel away from DB_HOST.
 * Prints only a status line. Never prints a host, password, or URL.
 *
 * Clears the override only when DB_HOST connects and its habit_check_ins
 * count is at least the override count (including both zero).
 */

$envFile = $argv[1] ?? (getcwd().DIRECTORY_SEPARATOR.'.env');
if (!is_file($envFile)) {
    echo "supabase_db_url=missing changed=no trap=inactive\n";
    exit(0);
}

$raw = (string) file_get_contents($envFile);
$values = parseEnv($raw);
$supabaseUrl = trim((string) ($values['SUPABASE_DB_URL'] ?? ''));
$dbUrl = trim((string) ($values['DB_URL'] ?? ''));
$effective = $supabaseUrl !== '' ? $supabaseUrl : $dbUrl;
$source = $supabaseUrl !== '' ? 'supabase_db_url' : ($dbUrl !== '' ? 'db_url' : 'none');

if ($effective === '') {
    echo "supabase_db_url=empty db_url=".($dbUrl === '' ? 'empty' : 'set')." changed=no trap=inactive\n";
    exit(0);
}

$target = classify($effective, (string) ($values['DB_HOST'] ?? ''));
$hostCount = countCheckIns(hostDsn($values), (string) ($values['DB_USERNAME'] ?? ''), (string) ($values['DB_PASSWORD'] ?? ''));
$urlCount = countCheckIns(...urlDsn($effective));

$changed = false;
if ($hostCount !== null && $urlCount !== null && $hostCount >= $urlCount) {
    $raw = blankKey($raw, $source === 'db_url' ? 'DB_URL' : 'SUPABASE_DB_URL');
    file_put_contents($envFile, $raw);
    $changed = true;
}

echo sprintf(
    "supabase_db_url=%s db_url=%s target=%s host_rows=%s url_rows=%s changed=%s trap=%s\n",
    $supabaseUrl === '' ? 'empty' : 'set',
    $dbUrl === '' ? 'empty' : 'set',
    $target,
    $hostCount === null ? 'unavailable' : (string) $hostCount,
    $urlCount === null ? 'unavailable' : (string) $urlCount,
    $changed ? 'yes' : 'no',
    $changed ? 'cleared' : 'active'
);

exit(0);

function parseEnv(string $raw): array
{
    $values = [];
    foreach (preg_split("/\r\n|\n|\r/", $raw) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        if (!str_contains($line, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        if ($value !== '' && (($value[0] === '"' && str_ends_with($value, '"')) || ($value[0] === "'" && str_ends_with($value, "'")))) {
            $value = substr($value, 1, -1);
        }
        $values[$key] = $value;
    }

    return $values;
}

function classify(string $url, string $dbHost): string
{
    $host = strtolower((string) parse_url($url, PHP_URL_HOST));
    if ($host !== '' && str_contains($host, 'supabase.co')) {
        return 'supabase';
    }
    if ($host !== '' && strcasecmp($host, $dbHost) === 0) {
        return 'same';
    }

    return 'other';
}

function hostDsn(array $values): string
{
    $host = (string) ($values['DB_HOST'] ?? '127.0.0.1');
    $port = (string) ($values['DB_PORT'] ?? '5432');
    $database = (string) ($values['DB_DATABASE'] ?? 'postgres');
    $ssl = (string) ($values['DB_SSLMODE'] ?? 'require');

    return "pgsql:host={$host};port={$port};dbname={$database};sslmode={$ssl};connect_timeout=8";
}

function urlDsn(string $url): array
{
    $parts = parse_url($url);
    $host = (string) ($parts['host'] ?? '');
    $port = (string) ($parts['port'] ?? '5432');
    $database = ltrim((string) ($parts['path'] ?? '/postgres'), '/');
    if ($database === '') {
        $database = 'postgres';
    }
    $user = rawurldecode((string) ($parts['user'] ?? ''));
    $pass = rawurldecode((string) ($parts['pass'] ?? ''));
    $query = [];
    parse_str((string) ($parts['query'] ?? ''), $query);
    $ssl = (string) ($query['sslmode'] ?? 'require');
    $dsn = "pgsql:host={$host};port={$port};dbname={$database};sslmode={$ssl};connect_timeout=8";

    return [$dsn, $user, $pass];
}

function countCheckIns(string $dsn, string $user, string $pass): ?int
{
    $handler = static function (): bool {
        return true;
    };
    set_error_handler($handler);
    try {
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 8,
        ]);
        $value = $pdo->query('select count(*) from habit_check_ins')->fetchColumn();

        return is_numeric($value) ? (int) $value : 0;
    } catch (Throwable) {
        return null;
    } finally {
        restore_error_handler();
    }
}

function blankKey(string $raw, string $key): string
{
    if (preg_match('/^'.preg_quote($key, '/').'=/m', $raw) === 1) {
        return (string) preg_replace('/^'.preg_quote($key, '/').'=.*$/m', $key.'=', $raw);
    }

    return rtrim($raw, "\r\n")."\n".$key."=\n";
}
