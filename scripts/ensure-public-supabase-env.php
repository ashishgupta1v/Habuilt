<?php

declare(strict_types=1);

/**
 * Fill an empty server Supabase URL or public anon key.
 * Prints status tokens only. Never prints the values.
 */

$envPath = $argv[1] ?? '.env';
$jsPath = $argv[2] ?? 'resources/js/lib/supabase.js';
$env = is_file($envPath) ? (string) file_get_contents($envPath) : '';
$js = is_file($jsPath) ? (string) file_get_contents($jsPath) : '';

$read = static function (string $source, string $key): ?string {
    if (!preg_match('/^'.preg_quote($key, '/').'=(.*)$/m', $source, $matches)) {
        return null;
    }
    $value = trim($matches[1]);
    if ($value !== '' && ($value[0] === '"' || $value[0] === "'")) {
        $value = trim($value, "\"'");
    }

    return $value;
};

$write = static function (string $source, string $key, string $value): string {
    $line = $key.'='.$value;
    if (preg_match('/^'.preg_quote($key, '/').'=.*$/m', $source)) {
        return (string) preg_replace('/^'.preg_quote($key, '/').'=.*$/m', $line, $source, 1);
    }

    return rtrim($source)."\n".$line."\n";
};

$public = [
    'SUPABASE_URL' => '',
    'SUPABASE_ANON_KEY' => '',
];
if (preg_match("/PROD_SUPABASE_URL = '([^']+)'/", $js, $matches) === 1) {
    $public['SUPABASE_URL'] = $matches[1];
}
if (preg_match("/PROD_SUPABASE_ANON_KEY = '([^']+)'/", $js, $matches) === 1) {
    $public['SUPABASE_ANON_KEY'] = $matches[1];
}

$fallbacks = [
    'SUPABASE_URL' => 'VITE_SUPABASE_URL',
    'SUPABASE_ANON_KEY' => 'VITE_SUPABASE_ANON_KEY',
];

foreach ($fallbacks as $key => $from) {
    $current = $read($env, $key);
    if (is_string($current) && $current !== '') {
        echo $key."=set\n";
        continue;
    }

    $other = $read($env, $from);
    $value = '';
    $source = 'empty';
    if (is_string($other) && $other !== '') {
        $value = $other;
        $source = 'copied';
    } elseif ($public[$key] !== '') {
        $value = $public[$key];
        $source = 'public_client';
    }

    if ($value === '') {
        echo $key."=empty\n";
        continue;
    }

    $env = $write($env, $key, $value);
    echo $key.'='.$source."\n";
}

file_put_contents($envPath, $env);
