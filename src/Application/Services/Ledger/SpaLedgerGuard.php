<?php

declare(strict_types=1);

namespace App\Services\Ledger;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Creates the SPA ledger tables when they are missing, collapses safe duplicate
 * check-ins, adds the unique key the API upsert uses, and applies Supabase RLS
 * when this connection is the Supabase database.
 */
final class SpaLedgerGuard
{
    public const UNIQUE_INDEX = 'habit_check_ins_user_habit_month_day_uniq';

    /**
     * @return array{
     *   collapse: array{collapsed_groups: int, conflicting_groups: int, aborted: bool},
     *   unique_index: string,
     *   rls: string
     * }
     */
    public function ensure(): array
    {
        $this->createMissingTables();

        return DB::transaction(function (): array {
            $collapse = (new CheckInDuplicateCollapser())->collapse();
            if ($collapse['aborted']) {
                return [
                    'collapse' => $collapse,
                    'unique_index' => 'not_created',
                    'rls' => $this->applyRlsIfPostgres(),
                ];
            }

            return [
                'collapse' => $collapse,
                'unique_index' => $this->ensureUniqueIndex(),
                'rls' => $this->applyRlsIfPostgres(),
            ];
        });
    }

    public function rollbackUniqueIndex(): void
    {
        if (!Schema::hasTable('habit_check_ins') || !$this->uniqueIndexExists()) {
            return;
        }

        Schema::table('habit_check_ins', function (Blueprint $table): void {
            $table->dropUnique(self::UNIQUE_INDEX);
        });
    }

    private function createMissingTables(): void
    {
        if (!Schema::hasTable('habit_check_ins')) {
            Schema::create('habit_check_ins', function (Blueprint $table): void {
                $table->uuid('id')->primary();
                $table->string('user_id');
                $table->string('habit_id');
                $table->string('habit_name')->nullable();
                $table->string('month_key');
                $table->unsignedTinyInteger('day');
                $table->date('completed_on');
                $table->integer('points')->default(1);
                $table->string('canonical_key')->nullable();
                $table->string('source')->default('web');
                $table->timestamps();
                $table->unique(
                    ['user_id', 'habit_id', 'month_key', 'day'],
                    self::UNIQUE_INDEX
                );
            });
        }

        if (!Schema::hasTable('user_settings')) {
            Schema::create('user_settings', function (Blueprint $table): void {
                $table->string('user_id')->primary();
                $table->json('progressive_settings')->nullable();
                $table->json('custom_habits')->nullable();
                $table->json('rewards')->nullable();
                $table->json('reward_ledger')->nullable();
                $table->json('weekly_reviews')->nullable();
                $table->json('enhanced_state')->nullable();
                $table->string('day_type')->default('home');
                $table->boolean('dark_mode')->default(true);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('user_protocols')) {
            Schema::create('user_protocols', function (Blueprint $table): void {
                $table->uuid('id')->primary();
                $table->string('user_id');
                $table->string('name')->nullable();
                $table->string('archetype')->nullable();
                $table->text('description')->nullable();
                $table->string('wake_time')->nullable();
                $table->string('sleep_time')->nullable();
                $table->string('work_start')->nullable();
                $table->string('work_end')->nullable();
                $table->boolean('is_active')->default(true);
                $table->json('slots')->nullable();
                $table->json('habits')->nullable();
                $table->timestamps();
                $table->index('user_id');
            });
        }

        if (!Schema::hasTable('user_biomarkers')) {
            Schema::create('user_biomarkers', function (Blueprint $table): void {
                $table->uuid('id')->primary();
                $table->string('user_id');
                $table->date('log_date');
                $table->integer('stiffness_minutes')->default(0);
                $table->integer('hydration_ml')->default(0);
                $table->string('energy_level')->nullable();
                $table->decimal('sleep_hours', 4, 2)->default(0);
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->unique(['user_id', 'log_date'], 'user_biomarkers_user_log_date_uniq');
            });
        }

        if (!Schema::hasTable('partner_connections')) {
            Schema::create('partner_connections', function (Blueprint $table): void {
                $table->uuid('id')->primary();
                $table->string('user_id');
                $table->string('partner_user_id')->nullable();
                $table->string('invite_code')->unique();
                $table->string('status')->default('pending');
                $table->string('alias')->nullable();
                $table->json('permissions')->nullable();
                $table->timestamps();
                $table->index('user_id');
                $table->index('partner_user_id');
            });
        }
    }

    private function ensureUniqueIndex(): string
    {
        if ($this->uniqueIndexExists() || $this->equivalentUniqueIndexExists()) {
            return 'exists';
        }

        Schema::table('habit_check_ins', function (Blueprint $table): void {
            $table->unique(
                ['user_id', 'habit_id', 'month_key', 'day'],
                self::UNIQUE_INDEX
            );
        });

        return 'created';
    }

    private function uniqueIndexExists(): bool
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            $rows = DB::select(
                "SELECT name FROM sqlite_master WHERE type = 'index' AND name = ?",
                [self::UNIQUE_INDEX]
            );

            return $rows !== [];
        }

        if ($driver === 'pgsql') {
            $rows = DB::select(
                'SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = ?',
                [self::UNIQUE_INDEX]
            );

            return $rows !== [];
        }

        return false;
    }

    /**
     * Postgres already enforces the upsert key when any unique index covers
     * exactly (user_id, habit_id, month_key, day), whatever its name is.
     */
    private function equivalentUniqueIndexExists(): bool
    {
        if (Schema::getConnection()->getDriverName() !== 'pgsql') {
            return false;
        }

        $rows = DB::select(
            "SELECT i.relname
             FROM pg_index ix
             JOIN pg_class i ON i.oid = ix.indexrelid
             JOIN pg_class t ON t.oid = ix.indrelid
             JOIN pg_namespace n ON n.oid = t.relnamespace
             WHERE n.nspname = current_schema()
               AND t.relname = 'habit_check_ins'
               AND ix.indisunique
               AND ix.indpred IS NULL
               AND (
                 SELECT string_agg(a.attname, ',' ORDER BY k.ord)
                 FROM unnest(ix.indkey) WITH ORDINALITY AS k(attnum, ord)
                 JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
               ) = 'user_id,habit_id,month_key,day'"
        );

        return $rows !== [];
    }

    private function applyRlsIfPostgres(): string
    {
        if (Schema::getConnection()->getDriverName() !== 'pgsql') {
            return 'skipped-not-pgsql';
        }

        $hasAuth = DB::select("SELECT 1 FROM pg_namespace WHERE nspname = 'auth'");
        if ($hasAuth === []) {
            return 'skipped-no-auth-schema';
        }

        $sql = (string) file_get_contents(base_path('database/sql/2026_11_02_row_level_security.sql'));
        DB::unprepared($sql);

        return 'applied';
    }
}
