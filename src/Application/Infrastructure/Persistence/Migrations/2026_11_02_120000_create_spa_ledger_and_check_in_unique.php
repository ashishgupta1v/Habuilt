<?php

declare(strict_types=1);

use App\Services\Ledger\SpaLedgerGuard;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        (new SpaLedgerGuard())->ensure();
    }

    public function down(): void
    {
        (new SpaLedgerGuard())->rollbackUniqueIndex();
    }
};
