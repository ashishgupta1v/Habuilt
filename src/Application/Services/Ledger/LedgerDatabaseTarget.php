<?php

declare(strict_types=1);

namespace App\Services\Ledger;

use Illuminate\Support\Facades\DB;

/**
 * Points the secure-ledger command at a Supabase URL without changing
 * the application connection used by web requests.
 */
final class LedgerDatabaseTarget
{
    public function useUrl(string $databaseUrl): string
    {
        $databaseUrl = trim($databaseUrl);
        if ($databaseUrl === '') {
            return 'default';
        }

        $base = config('database.connections.pgsql');
        if (!is_array($base)) {
            $base = ['driver' => 'pgsql'];
        }

        config([
            'database.connections.supabase_ledger' => array_merge($base, [
                'driver' => 'pgsql',
                'url' => $databaseUrl,
            ]),
        ]);
        DB::purge('supabase_ledger');
        DB::setDefaultConnection('supabase_ledger');

        return 'supabase';
    }
}
